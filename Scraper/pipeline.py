"""
pipeline.py

Main orchestration for the AMIS market-data ingestion pipeline.

Coordinates scraping, normalisation, and database writes.  Designed
to be called from the CLI entry-point (``run.py``) or from GitHub
Actions.

Error handling strategy:
  - A failure in one commodity never blocks others.
  - A failure in the Supabase connection is fatal (exit 1).
  - Every run writes an ingestion-log entry (success / partial / failed).
  - Existing data is never deleted.
"""

import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any, Optional

from Scraper import config
from Scraper import db as database
from Scraper import parser
from Scraper.parser import CommodityInfo, MarketPrice

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pipeline entry-point
# ---------------------------------------------------------------------------


def run_pipeline(
    *,
    dry_run: bool = False,
    filter_ids: Optional[set[int]] = None,
) -> int:
    """
    Execute the full AMIS ingestion pipeline.

    Parameters
    ----------
    dry_run : bool
        When True, scrape and parse but skip all Supabase writes.
    filter_ids : set[int] | None
        If provided, only scrape these commodity IDs.

    Returns
    -------
    int
        0 on success (or partial success), 1 on fatal failure.
    """
    started = time.monotonic()
    logger.info("=" * 60)
    logger.info("AMIS Market Data Pipeline -- START")
    logger.info("  dry_run=%s  filter_ids=%s", dry_run, filter_ids)
    logger.info("=" * 60)

    # ------------------------------------------------------------------
    # 1. Supabase client + connectivity
    # ------------------------------------------------------------------
    client = None
    log_columns: set[str] = set()
    commodity_columns: set[str] = set()
    market_columns: set[str] = set()
    rates_columns: set[str] = set()

    if not dry_run:
        try:
            client = database.get_client()
        except RuntimeError as exc:
            logger.error("FATAL: %s", exc)
            return 1

        if not database.verify_connectivity(client):
            logger.error("FATAL: Cannot reach Supabase. Aborting.")
            return 1

        # Discover schemas
        log_columns = database.discover_columns(client, config.TABLE_LOGS)
        commodity_columns = database.discover_columns(
            client, config.TABLE_COMMODITIES,
        )
        market_columns = database.discover_columns(
            client, config.TABLE_MARKETS,
        )
        rates_columns = database.discover_columns(
            client, config.TABLE_RATES,
        )

    # ------------------------------------------------------------------
    # 2. Start ingestion log
    # ------------------------------------------------------------------
    log_id: Optional[str] = None
    if client and not dry_run:
        log_id = database.log_ingestion_start(
            client, columns=log_columns,
        )

    # ------------------------------------------------------------------
    # 3. Discover commodities from AMIS
    # ------------------------------------------------------------------
    session = parser._build_session()
    commodities = parser.discover_commodities(session)
    if not commodities:
        error_msg = "Could not discover any commodities from AMIS."
        logger.error(error_msg)
        if client and not dry_run:
            database.log_ingestion_end(
                client, log_id,
                status="failed",
                error_message=error_msg,
                columns=log_columns,
            )
        return 1
    logger.info("Discovered %d commodities.", len(commodities))

    # ------------------------------------------------------------------
    # 4. Scrape all commodity pages
    # ------------------------------------------------------------------
    all_prices, success_count, fail_count = parser.scrape_all(
        commodities, filter_ids=filter_ids,
    )

    logger.info(
        "Scraping complete: %d commodities OK, %d failed, %d price rows.",
        success_count, fail_count, len(all_prices),
    )

    if not all_prices:
        status = "partial" if fail_count > 0 else "success"
        msg = (
            f"No price data found. {fail_count} commodities failed."
            if fail_count
            else "No price data available today (all commodities returned empty)."
        )
        logger.warning(msg)
        if client and not dry_run:
            database.log_ingestion_end(
                client, log_id,
                status=status,
                records_found=0,
                records_inserted=0,
                records_skipped=0,
                error_message=msg,
                columns=log_columns,
            )
        return 0

    # ------------------------------------------------------------------
    # 5. Normalise data
    # ------------------------------------------------------------------
    all_prices = _normalise(all_prices)

    # ------------------------------------------------------------------
    # 6. Dry-run: print summary and exit
    # ------------------------------------------------------------------
    if dry_run:
        _print_dry_run_summary(all_prices, success_count, fail_count)
        return 0

    # ------------------------------------------------------------------
    # 7. Resolve commodity & market IDs
    # ------------------------------------------------------------------
    assert client is not None  # guaranteed by dry_run check above

    # Build name -> AMIS ID maps for stable DB lookups
    commodity_amis_map: dict[str, int] = {
        c.name: c.commodity_id for c in commodities
    }
    market_amis_map: dict[str, int] = {}
    for p in all_prices:
        if p.amis_market_id is not None and p.market_name not in market_amis_map:
            market_amis_map[p.market_name] = p.amis_market_id

    commodity_names = {p.commodity_name for p in all_prices}
    market_names = {p.market_name for p in all_prices}

    logger.info(
        "Resolving %d commodities and %d markets in Supabase...",
        len(commodity_names), len(market_names),
    )

    # Filter AMIS maps to only include names we actually need
    commodity_map = database.resolve_commodities(
        client,
        {n: commodity_amis_map[n] for n in commodity_names if n in commodity_amis_map},
        columns=commodity_columns,
    )
    market_map = database.resolve_markets(
        client,
        {n: market_amis_map[n] for n in market_names if n in market_amis_map},
        columns=market_columns,
    )

    logger.info(
        "Resolved %d/%d commodities, %d/%d markets.",
        len(commodity_map), len(commodity_names),
        len(market_map), len(market_names),
    )

    # ------------------------------------------------------------------
    # 8. Build rate rows with resolved foreign keys
    # ------------------------------------------------------------------
    rates = _build_rate_rows(all_prices, commodity_map, market_map, rates_columns)
    logger.info("Prepared %d rate rows for upsert.", len(rates))

    if not rates:
        msg = "No rate rows could be built (all commodity/market lookups failed)."
        logger.error(msg)
        database.log_ingestion_end(
            client, log_id,
            status="failed",
            records_found=len(all_prices),
            records_inserted=0,
            records_skipped=0,
            error_message=msg,
            columns=log_columns,
        )
        return 1

    # ------------------------------------------------------------------
    # 9. Upsert rates
    # ------------------------------------------------------------------
    written, skipped = database.upsert_rates(client, rates, columns=rates_columns)
    logger.info("Upserted %d rate rows (%d skipped).", written, skipped)

    # ------------------------------------------------------------------
    # 10. Finalise ingestion log
    # ------------------------------------------------------------------
    elapsed = time.monotonic() - started
    status = "success" if fail_count == 0 else "partial"
    error_msg = (
        f"{fail_count} commodities failed to scrape."
        if fail_count > 0 else None
    )

    database.log_ingestion_end(
        client, log_id,
        status=status,
        records_found=len(all_prices),
        records_inserted=written,
        records_skipped=skipped,
        error_message=error_msg,
        columns=log_columns,
    )

    logger.info("=" * 60)
    logger.info(
        "Pipeline COMPLETE  status=%s  rows=%d  elapsed=%.1fs",
        status, written, elapsed,
    )
    logger.info("=" * 60)
    return 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _normalise(prices: list[MarketPrice]) -> list[MarketPrice]:
    """
    Clean/normalise parsed prices before database insertion.

    - Strip whitespace from names
    - Ensure prices are non-negative
    """
    cleaned: list[MarketPrice] = []
    for p in prices:
        p.commodity_name = p.commodity_name.strip()
        p.market_name = p.market_name.strip()

        # Validate prices
        if p.min_price is not None and p.min_price < 0:
            p.min_price = None
        if p.max_price is not None and p.max_price < 0:
            p.max_price = None
        if p.fqp_price is not None and p.fqp_price < 0:
            p.fqp_price = None
        if p.quantity is not None and p.quantity < 0:
            p.quantity = None

        cleaned.append(p)
    return cleaned


def _build_rate_rows(
    prices: list[MarketPrice],
    commodity_map: dict[str, str],
    market_map: dict[str, str],
    columns: set[str],
) -> list[dict[str, Any]]:
    """
    Convert MarketPrice objects into dicts ready for Supabase upsert,
    with resolved foreign-key IDs.
    """
    rows: list[dict[str, Any]] = []
    skipped = 0

    for p in prices:
        cid = commodity_map.get(p.commodity_name)
        mid = market_map.get(p.market_name)

        if not cid or not mid:
            skipped += 1
            continue

        row: dict[str, Any] = {
            "commodity_id": cid,
            "market_id": mid,
            "price_date": p.date.isoformat(),
            "min_price": p.min_price,
            "max_price": p.max_price,
            "fqp": p.fqp_price,
            "quantity": p.quantity,
            "unit": p.unit,
        }

        # source column has a DB default of 'AMIS', but set explicitly
        if "source" in columns:
            row["source"] = config.INGESTION_SOURCE

        rows.append(row)

    if skipped:
        logger.warning(
            "Skipped %d rows due to unresolved commodity/market IDs.", skipped,
        )
    return rows


def _print_dry_run_summary(
    prices: list[MarketPrice],
    success_count: int,
    fail_count: int,
) -> None:
    """Print a human-readable summary for --dry-run mode."""
    commodities = {p.commodity_name for p in prices}
    markets = {p.market_name for p in prices}
    dates = {p.date for p in prices}

    print("\n" + "=" * 60)
    print("DRY RUN SUMMARY")
    print("=" * 60)
    print(f"  Commodities scraped : {success_count}")
    print(f"  Commodities failed  : {fail_count}")
    print(f"  Unique commodities : {len(commodities)}")
    print(f"  Unique markets      : {len(markets)}")
    print(f"  Dates covered       : {sorted(dates)}")
    print(f"  Total price rows    : {len(prices)}")
    print()

    # Show a sample of the data
    print("Sample rows (first 10):")
    print(f"  {'Commodity':<30} {'Market':<20} {'Date':<12} "
          f"{'Min':>8} {'Max':>8} {'FQP':>8} {'Qty':>8}")
    print("  " + "-" * 102)
    for p in prices[:10]:
        print(
            f"  {p.commodity_name:<30} {p.market_name:<20} "
            f"{p.date.isoformat():<12} "
            f"{_fmt(p.min_price):>8} {_fmt(p.max_price):>8} "
            f"{_fmt(p.fqp_price):>8} {_fmt(p.quantity):>8}"
        )
    print("=" * 60 + "\n")


def _fmt(value: Optional[float]) -> str:
    """Format an optional float for display."""
    if value is None:
        return "-"
    return f"{value:,.0f}"
