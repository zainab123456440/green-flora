"""
db.py

Supabase integration for the AMIS scraper pipeline.

Handles schema discovery, idempotent upserts, and ingestion logging.
All DB operations are isolated here so the rest of the pipeline never
touches the database directly.

Design principles:
  - Schema-resilient: discover columns at runtime; never crash if a
    non-essential column is missing.
  - Idempotent: running the pipeline twice on the same day must not
    create duplicates.
  - Safe: never DELETE existing data; only INSERT or UPDATE.

Verified Supabase schema (2026-09-01):
  crop_market_rates: id, commodity_id, market_id, price_date, min_price,
      max_price, fqp, quantity, unit, source, created_at
      UNIQUE constraint: (commodity_id, market_id, price_date)
  commodities: id, amis_id, name, category, unit, is_active, created_at
  markets: id, amis_id, name, district, province, latitude, longitude,
      is_active, created_at
  data_ingestion_logs: id, run_started_at, run_finished_at, status,
      records_found, records_inserted, records_skipped, error_message, source
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client

from Scraper import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client factory
# ---------------------------------------------------------------------------


def get_client() -> Client:
    """
    Create and return a Supabase client using service-role credentials.

    Raises ``RuntimeError`` if credentials are missing.
    """
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set. "
            "Configure them as environment variables or in Scraper/.env."
        )
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# Schema discovery
# ---------------------------------------------------------------------------


def discover_columns(client: Client, table: str) -> set[str]:
    """
    Discover column names for *table* by selecting one row.

    Returns an empty set if the table is empty or unreachable.
    """
    try:
        result = client.table(table).select("*").limit(1).execute()
        if result.data:
            cols = set(result.data[0].keys())
            logger.debug("Table '%s' columns: %s", table, cols)
            return cols
    except Exception as exc:
        logger.warning("Could not discover schema for '%s': %s", table, exc)

    # Fallback: try an insert of nothing to trigger a schema error that
    # reveals column names.  This is a last-resort hack for empty tables.
    logger.info("Table '%s' appears empty; assuming standard columns.", table)
    return set()


def verify_connectivity(client: Client) -> bool:
    """Quick health-check: can we reach Supabase at all?"""
    try:
        client.table(config.TABLE_COMMODITIES).select("id").limit(1).execute()
        return True
    except Exception as exc:
        logger.error("Supabase connectivity check failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Commodity upsert
# ---------------------------------------------------------------------------


def upsert_commodity(
    client: Client,
    name: str,
    *,
    columns: set[str],
    amis_id: int | None = None,
    category: str | None = None,
) -> Optional[str]:
    """
    Insert-or-get a commodity by *name*.  Returns the row ``id``.

    When *amis_id* is provided it is used as the primary lookup key
    (more stable than the display name).  The ``amis_id`` column stores
    the AMIS integer ID as text.
    """
    # Strategy 1: look up by amis_id (most stable)
    if amis_id is not None and "amis_id" in columns:
        try:
            existing = (
                client.table(config.TABLE_COMMODITIES)
                .select("id")
                .eq("amis_id", str(amis_id))
                .limit(1)
                .execute()
            )
            if existing.data:
                return existing.data[0]["id"]
        except Exception as exc:
            logger.debug("SELECT for commodity amis_id=%s failed: %s", amis_id, exc)

    # Strategy 2: look up by name
    try:
        existing = (
            client.table(config.TABLE_COMMODITIES)
            .select("id")
            .eq("name", name)
            .limit(1)
            .execute()
        )
        if existing.data:
            return existing.data[0]["id"]
    except Exception as exc:
        logger.debug("SELECT for commodity '%s' failed: %s", name, exc)

    # Build insert payload
    payload: dict[str, Any] = {"name": name}
    if amis_id is not None and "amis_id" in columns:
        payload["amis_id"] = str(amis_id)
    if category and "category" in columns:
        payload["category"] = category

    try:
        result = (
            client.table(config.TABLE_COMMODITIES)
            .insert(payload)
            .execute()
        )
        if result.data:
            cid = result.data[0]["id"]
            logger.debug("Created commodity '%s' -> %s", name, cid)
            return cid
    except Exception as exc:
        # Row was created between our SELECT and INSERT.  Re-fetch.
        logger.debug("INSERT for commodity '%s' failed: %s", name, exc)
        lookup_col = "amis_id" if amis_id is not None and "amis_id" in columns else "name"
        lookup_val = str(amis_id) if lookup_col == "amis_id" else name
        try:
            fallback = (
                client.table(config.TABLE_COMMODITIES)
                .select("id")
                .eq(lookup_col, lookup_val)
                .limit(1)
                .execute()
            )
            if fallback.data:
                return fallback.data[0]["id"]
        except Exception:
            pass

    logger.error("Could not resolve commodity '%s'.", name)
    return None


# ---------------------------------------------------------------------------
# Market upsert
# ---------------------------------------------------------------------------


def upsert_market(
    client: Client,
    name: str,
    *,
    columns: set[str],
    amis_id: int | None = None,
) -> Optional[str]:
    """
    Insert-or-get a market by *name*.  Returns the row ``id``.

    When *amis_id* is provided it is used as the primary lookup key.
    """
    # Strategy 1: look up by amis_id
    if amis_id is not None and "amis_id" in columns:
        try:
            existing = (
                client.table(config.TABLE_MARKETS)
                .select("id")
                .eq("amis_id", str(amis_id))
                .limit(1)
                .execute()
            )
            if existing.data:
                return existing.data[0]["id"]
        except Exception as exc:
            logger.debug("SELECT for market amis_id=%s failed: %s", amis_id, exc)

    # Strategy 2: look up by name
    try:
        existing = (
            client.table(config.TABLE_MARKETS)
            .select("id")
            .eq("name", name)
            .limit(1)
            .execute()
        )
        if existing.data:
            return existing.data[0]["id"]
    except Exception as exc:
        logger.debug("SELECT for market '%s' failed: %s", name, exc)

    payload: dict[str, Any] = {"name": name}
    if amis_id is not None and "amis_id" in columns:
        payload["amis_id"] = str(amis_id)

    try:
        result = (
            client.table(config.TABLE_MARKETS)
            .insert(payload)
            .execute()
        )
        if result.data:
            mid = result.data[0]["id"]
            logger.debug("Created market '%s' -> %s", name, mid)
            return mid
    except Exception as exc:
        logger.debug("INSERT for market '%s' failed: %s", name, exc)
        lookup_col = "amis_id" if amis_id is not None and "amis_id" in columns else "name"
        lookup_val = str(amis_id) if lookup_col == "amis_id" else name
        try:
            fallback = (
                client.table(config.TABLE_MARKETS)
                .select("id")
                .eq(lookup_col, lookup_val)
                .limit(1)
                .execute()
            )
            if fallback.data:
                return fallback.data[0]["id"]
        except Exception:
            pass

    logger.error("Could not resolve market '%s'.", name)
    return None


# ---------------------------------------------------------------------------
# Bulk commodity / market resolution
# ---------------------------------------------------------------------------


def resolve_commodities(
    client: Client,
    name_to_amis_id: dict[str, int],
    *,
    columns: set[str],
) -> dict[str, str]:
    """
    Ensure every commodity exists and return a {name: id} mapping.

    *name_to_amis_id* maps commodity display names to their AMIS integer
    IDs (from the browse page).
    """
    mapping: dict[str, str] = {}
    for name in sorted(name_to_amis_id):
        cid = upsert_commodity(
            client, name,
            columns=columns,
            amis_id=name_to_amis_id[name],
        )
        if cid:
            mapping[name] = cid
    return mapping


def resolve_markets(
    client: Client,
    name_to_amis_id: dict[str, int],
    *,
    columns: set[str],
) -> dict[str, str]:
    """
    Ensure every market exists and return a {name: id} mapping.

    *name_to_amis_id* maps market display names to their AMIS integer
    IDs (extracted from HTML links during scraping).
    """
    mapping: dict[str, str] = {}
    for name in sorted(name_to_amis_id):
        mid = upsert_market(
            client, name,
            columns=columns,
            amis_id=name_to_amis_id[name],
        )
        if mid:
            mapping[name] = mid
    return mapping


# ---------------------------------------------------------------------------
# Rate upsert
# ---------------------------------------------------------------------------


def upsert_rates(
    client: Client,
    rates: list[dict[str, Any]],
    *,
    columns: set[str],
) -> tuple[int, int]:
    """
    Upsert *rates* into ``crop_market_rates`` in batches.

    Each dict in *rates* must already contain resolved ``commodity_id``
    and ``market_id`` UUIDs.

    Duplicate strategy:
      Uses database-level ``UPSERT`` with ``ON CONFLICT`` on the unique
      constraint ``(commodity_id, market_id, price_date)``.
      If the constraint is missing the batch falls back to row-by-row
      SELECT-then-INSERT/UPDATE.

    Returns ``(inserted_or_updated, skipped)`` counts.
    """
    if not rates:
        return 0, 0

    written = 0
    skipped = 0
    for i in range(0, len(rates), config.BATCH_SIZE):
        batch = rates[i : i + config.BATCH_SIZE]
        # Filter payload to only include columns that exist in the table
        clean_batch = []
        for row in batch:
            clean = {k: v for k, v in row.items() if k in columns or not columns}
            clean_batch.append(clean)

        try:
            result = (
                client.table(config.TABLE_RATES)
                .upsert(
                    clean_batch,
                    on_conflict="commodity_id,market_id,price_date",
                )
                .execute()
            )
            written += len(result.data) if result.data else len(clean_batch)
        except Exception as exc:
            err_str = str(exc)
            if "42P10" in err_str or "no unique" in err_str.lower():
                logger.warning(
                    "Unique constraint missing on crop_market_rates. "
                    "Falling back to row-by-row. Run the ALTER TABLE to add it."
                )
            else:
                logger.warning(
                    "Batch upsert failed (%s); falling back to row-by-row.", exc,
                )
            w, s = _upsert_rates_fallback(client, clean_batch, columns)
            written += w
            skipped += s

    return written, skipped


def _upsert_rates_fallback(
    client: Client,
    batch: list[dict[str, Any]],
    columns: set[str],
) -> tuple[int, int]:
    """
    Row-by-row fallback: SELECT existing row, UPDATE if found,
    INSERT if not.

    Returns ``(written, skipped)`` counts.
    """
    written = 0
    skipped = 0
    for row in batch:
        try:
            existing = (
                client.table(config.TABLE_RATES)
                .select("id")
                .eq("commodity_id", row["commodity_id"])
                .eq("market_id", row["market_id"])
                .eq("price_date", row["price_date"])
                .limit(1)
                .execute()
            )
            if existing.data:
                client.table(config.TABLE_RATES).update(row).eq(
                    "id", existing.data[0]["id"],
                ).execute()
            else:
                client.table(config.TABLE_RATES).insert(row).execute()
            written += 1
        except Exception as exc:
            logger.warning("Row-level upsert failed: %s", exc)
            skipped += 1

    return written, skipped


# ---------------------------------------------------------------------------
# Ingestion log
# ---------------------------------------------------------------------------


def log_ingestion_start(client: Client, *, columns: set[str]) -> Optional[str]:
    """
    Insert an ingestion-log row with status='running'.
    Returns the row ID so it can be updated later.

    The ``run_started_at`` column defaults to now() in the DB, so we
    only need to set ``source`` and ``status``.
    """
    payload: dict[str, Any] = {
        "source": config.INGESTION_SOURCE,
        "status": "running",
    }
    # Only include columns that exist
    if columns:
        payload = {k: v for k, v in payload.items() if k in columns}

    try:
        result = client.table(config.TABLE_LOGS).insert(payload).execute()
        if result.data:
            return result.data[0]["id"]
    except Exception as exc:
        logger.warning("Could not write ingestion log start: %s", exc)
    return None


def log_ingestion_end(
    client: Client,
    log_id: Optional[str],
    *,
    status: str,
    records_found: int = 0,
    records_inserted: int = 0,
    records_skipped: int = 0,
    error_message: str | None = None,
    columns: set[str],
) -> None:
    """
    Update the ingestion-log row with final results.

    Uses the actual DB column names: ``run_finished_at``,
    ``records_found``, ``records_inserted``, ``records_skipped``.
    """
    now = datetime.now(timezone.utc).isoformat()
    payload: dict[str, Any] = {
        "status": status,
        "records_found": records_found,
        "records_inserted": records_inserted,
        "records_skipped": records_skipped,
        "run_finished_at": now,
    }
    if error_message:
        payload["error_message"] = error_message

    # Filter to existing columns
    if columns:
        payload = {k: v for k, v in payload.items() if k in columns}

    if log_id:
        try:
            client.table(config.TABLE_LOGS).update(payload).eq(
                "id", log_id,
            ).execute()
        except Exception as exc:
            logger.warning("Could not update ingestion log: %s", exc)
    else:
        # No start row was created; insert a complete row
        payload["source"] = config.INGESTION_SOURCE
        if columns:
            payload = {k: v for k, v in payload.items() if k in columns or not columns}
        try:
            client.table(config.TABLE_LOGS).insert(payload).execute()
        except Exception as exc:
            logger.warning("Could not insert ingestion log: %s", exc)
