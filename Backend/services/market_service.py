"""
services/market_service.py

Business logic for the Market Intelligence feature.

Reads ONLY from the AMIS-ingested Supabase tables:
    commodities, markets, crop_market_rates

Data-integrity rules (project rules #10 / #17):
  - Never fabricate prices, trends, or signals.
  - If the AMIS pipeline has not ingested data yet, methods return
    empty results so the UI can render honest empty states.
  - Computed values (averages, changes, signals, insights) are always
    derived from real rows and annotated with their basis.

Market data is public government reference data, so no farmer-scoped
ownership checks apply here.

Caching:
  The commodities list and the markets lookup map change at most once
  per day (the AMIS scraper runs daily), so both are cached in memory
  with a short TTL to keep the crop selector snappy.
"""

import logging
import time
import uuid
from datetime import date, timedelta
from typing import Any, Optional

from config.supabase_client import supabase

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tunables
# ---------------------------------------------------------------------------

_CACHE_TTL_SECONDS = 600          # 10 minutes
_PAGE_SIZE = 1000                 # PostgREST page size for rate scans
_MAX_LIST_SCAN_ROWS = 15000       # cap for the commodities-list scan
_MAX_OVERVIEW_ROWS = 25000        # cap for a single commodity's history
_SIGNAL_THRESHOLD_PCT = 2.0       # ±2% → rising / falling, else stable


class MarketService:
    """Serves AMIS market data for the Market Intelligence feature."""

    def __init__(self) -> None:
        # (timestamp, payload) caches
        self._commodities_cache: Optional[tuple[float, list[dict]]] = None
        self._markets_cache: Optional[tuple[float, dict[str, dict]]] = None

    # ------------------------------------------------------------------
    # Public: commodities for the crop selector
    # ------------------------------------------------------------------

    def list_commodities(self, refresh: bool = False) -> tuple[list[dict], bool]:
        """
        Return every commodity that has at least one price row, with its
        latest date, representative price, and reporting-market count.

        Returns ``(items, data_available)``.  ``data_available`` is False
        when Supabase is not configured or nothing has been ingested yet.
        """
        if supabase is None:
            return [], False

        now = time.monotonic()
        if (
            not refresh
            and self._commodities_cache
            and now - self._commodities_cache[0] < _CACHE_TTL_SECONDS
        ):
            return self._commodities_cache[1], True

        try:
            comms = (
                supabase.table("commodities")
                .select("id, name, category, unit, is_active")
                .order("name")
                .execute()
            )
        except Exception as exc:
            logger.exception("Failed to load commodities")
            raise RuntimeError("Could not load market commodities.") from exc

        commodity_rows = comms.data or []
        if not commodity_rows:
            return [], False

        # Scan rate rows newest-first, grouped by (date, commodity), and
        # capture each commodity's most recent date-layer of rows.
        latest: dict[str, dict] = {}
        scanned = 0
        offset = 0
        try:
            while scanned < _MAX_LIST_SCAN_ROWS and len(latest) < len(commodity_rows):
                page = (
                    supabase.table("crop_market_rates")
                    .select(
                        "commodity_id, market_id, price_date, "
                        "fqp, min_price, max_price, quantity, unit"
                    )
                    .order("price_date", desc=True)
                    .order("commodity_id", desc=False)
                    .range(offset, offset + _PAGE_SIZE - 1)
                    .execute()
                )
                rows = page.data or []
                if not rows:
                    break
                scanned += len(rows)
                for row in rows:
                    cid = row["commodity_id"]
                    entry = latest.get(cid)
                    if entry is None:
                        latest[cid] = {
                            "date": row["price_date"],
                            "rows": [row],
                        }
                    elif row["price_date"] == entry["date"]:
                        # Same (date, commodity) layer — contiguous thanks
                        # to the compound ordering.
                        entry["rows"].append(row)
                    # else: older layer for an already-covered commodity
                offset += _PAGE_SIZE
        except Exception as exc:
            logger.exception("Failed to scan crop_market_rates for selector")
            raise RuntimeError("Could not load market prices.") from exc

        items: list[dict] = []
        for comm in commodity_rows:
            entry = latest.get(comm["id"])
            if not entry:
                continue  # no price data at all → not selectable
            price, _basis = self._representative_price(entry["rows"])
            items.append(
                {
                    "id": comm["id"],
                    "name": comm["name"],
                    "category": comm.get("category"),
                    "unit": comm.get("unit") or self._unit_from_rows(entry["rows"]),
                    "latest_date": entry["date"],
                    "latest_price": price,
                    "markets_reporting": len(entry["rows"]),
                }
            )

        self._commodities_cache = (time.monotonic(), items)
        return items, True

    # ------------------------------------------------------------------
    # Public: full overview for one commodity
    # ------------------------------------------------------------------

    def get_overview(
        self,
        commodity_id: str,
        days: int = 180,
        market_id: Optional[str] = None,
    ) -> dict:
        """
        Build the complete market-intelligence bundle for one commodity.

        ``days`` is the size of the history window (anchored at the
        commodity's latest available date, not "today", so late or
        missing ingestions still work).  ``market_id`` optionally scopes
        the trend series to a single market.

        Raises:
            LookupError — commodity does not exist.
            RuntimeError — database failures.
        """
        if supabase is None:
            raise RuntimeError(
                "Market data is not configured. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_KEY."
            )

        # PostgREST rejects non-UUID ids with a 400, so validate formats
        # up-front and surface a friendly 404 instead.
        try:
            uuid.UUID(commodity_id)
        except (ValueError, AttributeError, TypeError):
            raise LookupError("Crop not found.") from None
        if market_id is not None:
            try:
                uuid.UUID(market_id)
            except (ValueError, AttributeError, TypeError):
                raise LookupError("Market not found.") from None

        # --- Resolve the commodity ------------------------------------
        try:
            comm = (
                supabase.table("commodities")
                .select("id, name, category, unit")
                .eq("id", commodity_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            logger.exception("Failed to load commodity %s", commodity_id)
            raise RuntimeError("Could not load market data.") from exc

        if not comm.data:
            raise LookupError("Crop not found.")

        commodity = comm.data[0]
        unit = commodity.get("unit")

        overview: dict[str, Any] = {
            "commodity_id": commodity["id"],
            "commodity_name": commodity["name"],
            "category": commodity.get("category"),
            "unit": unit,
            "latest_date": None,
            "first_date": None,
            "days_of_data": 0,
            "markets_reporting": 0,
            "current_price": None,
            "price_basis": "unknown",
            "change_pct": None,
            "change_period_days": None,
            "signal": "insufficient_data",
            "highest_market": None,
            "lowest_market": None,
            "spread_abs": None,
            "spread_pct": None,
            "trend": [],
            "trend_market_id": market_id,
            "market_comparison": [],
            "distribution": None,
            "insights": [],
        }

        # --- Anchor at the commodity's latest date --------------------
        try:
            anchor_res = (
                supabase.table("crop_market_rates")
                .select("price_date")
                .eq("commodity_id", commodity_id)
                .order("price_date", desc=True)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            logger.exception("Failed to load anchor date for %s", commodity_id)
            raise RuntimeError("Could not load market data.") from exc

        if not anchor_res.data:
            # Commodity exists but has no price rows at all.
            overview["insights"].append(
                "No prices have been reported for this crop yet. "
                "Check back after the next daily AMIS update."
            )
            return overview

        anchor = anchor_res.data[0]["price_date"]
        start = (
            date.fromisoformat(anchor) - timedelta(days=max(days - 1, 0))
        ).isoformat()

        # --- Fetch the full history window ----------------------------
        rows = self._fetch_commodity_rates(commodity_id, start, anchor)
        if not rows:
            rows = self._fetch_commodity_rates(commodity_id, anchor, anchor)

        if not rows:
            overview["insights"].append(
                "No price data is available for this crop right now."
            )
            return overview

        markets_map = self._markets_map()
        unit = unit or self._unit_from_rows(rows)
        overview["unit"] = unit

        dates = sorted({r["price_date"] for r in rows})
        overview["latest_date"] = dates[-1]
        overview["first_date"] = dates[0]
        overview["days_of_data"] = len(dates)

        # --- Current (latest date) layer ------------------------------
        current_rows = [r for r in rows if r["price_date"] == anchor]
        current_price, basis = self._representative_price(current_rows)
        overview["current_price"] = current_price
        overview["price_basis"] = basis
        overview["markets_reporting"] = len(current_rows)

        # --- Per-market comparison at the latest date ------------------
        comparison: list[dict] = []
        for r in current_rows:
            price = self._row_price(r)
            if price is None:
                continue
            comparison.append(
                {
                    "market_id": r["market_id"],
                    "name": markets_map.get(r["market_id"], {}).get(
                        "name", "Unknown market"
                    ),
                    "price": round(price, 2),
                    "min_price": r.get("min_price"),
                    "max_price": r.get("max_price"),
                    "quantity": r.get("quantity"),
                    "date": anchor,
                }
            )
        comparison.sort(key=lambda c: c["price"], reverse=True)
        overview["market_comparison"] = comparison

        if comparison:
            overview["highest_market"] = comparison[0]
            overview["lowest_market"] = comparison[-1]
        if len(comparison) >= 2:
            hi = comparison[0]["price"]
            lo = comparison[-1]["price"]
            overview["spread_abs"] = round(hi - lo, 2)
            if lo > 0:
                overview["spread_pct"] = round((hi - lo) / lo * 100, 1)

        # --- Trend series ----------------------------------------------
        overview["trend"] = self._build_trend(rows, market_id)

        # --- Price change + signal --------------------------------------
        change_pct, period_days = self._compute_change(rows, anchor)
        overview["change_pct"] = change_pct
        overview["change_period_days"] = period_days
        if change_pct is not None:
            overview["signal"] = self._signal_from_change(change_pct)

        # --- Arrivals (quantity) distribution ----------------------------
        overview["distribution"] = self._build_distribution(
            current_rows, markets_map
        )

        # --- Farmer insights ---------------------------------------------
        overview["insights"] = self._build_insights(
            commodity["name"], overview
        )
        return overview

    # ------------------------------------------------------------------
    # Price helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_price(row: dict) -> Optional[float]:
        """FQP when present, else the midpoint of min/max."""
        fqp = row.get("fqp")
        if fqp is not None and fqp > 0:
            return float(fqp)
        lo = row.get("min_price")
        hi = row.get("max_price")
        if lo is not None and hi is not None and (lo > 0 or hi > 0):
            return (float(lo) + float(hi)) / 2
        return None

    def _representative_price(self, rows: list[dict]) -> tuple[Optional[float], str]:
        """
        Representative price for a set of market rows on one date.

        Returns ``(price, basis)`` where *basis* describes the method:
          - "weighted"  : quantity-weighted average FQP (arrivals data)
          - "average"   : simple average FQP across markets
          - "single"    : price of the only reporting market
          - "unknown"   : no usable price
        """
        entries: list[tuple[float, Optional[float]]] = []
        for r in rows:
            price = self._row_price(r)
            if price is not None:
                entries.append((price, r.get("quantity")))

        if not entries:
            return None, "unknown"
        if len(entries) == 1:
            return round(entries[0][0], 2), "single"

        with_qty = [q for _p, q in entries if q is not None and q > 0]
        if len(with_qty) >= max(2, int(len(entries) * 0.8)):
            total_qty = sum(q for q in with_qty)
            if total_qty > 0:
                weighted = sum(
                    p * (q or 0) for p, q in entries
                ) / sum((q or 0) for _p, q in entries)
                return round(weighted, 2), "weighted"

        simple = sum(p for p, _q in entries) / len(entries)
        return round(simple, 2), "average"

    # ------------------------------------------------------------------
    # Trend / change / signal
    # ------------------------------------------------------------------

    def _build_trend(
        self, rows: list[dict], market_id: Optional[str]
    ) -> list[dict]:
        """Daily price series — one market's FQP or the all-market average."""
        by_date: dict[str, list[dict]] = {}
        for r in rows:
            if market_id and r["market_id"] != market_id:
                continue
            by_date.setdefault(r["price_date"], []).append(r)

        trend: list[dict] = []
        for day in sorted(by_date):
            day_rows = by_date[day]
            if market_id:
                price = self._row_price(day_rows[0])
            else:
                price, _ = self._representative_price(day_rows)
            if price is not None:
                trend.append({"date": day, "price": round(price, 2)})
        return trend

    def _compute_change(
        self, rows: list[dict], anchor: str
    ) -> tuple[Optional[float], Optional[int]]:
        """
        Percent change of the representative price versus roughly 7 days
        earlier.  Falls back to the most recent earlier date when a full
        week of history is not yet available.  Returns
        ``(change_pct, period_days)`` or ``(None, None)``.
        """
        by_date: dict[str, list[dict]] = {}
        for r in rows:
            by_date.setdefault(r["price_date"], []).append(r)

        current, _ = self._representative_price(by_date.get(anchor, []))
        if current is None or len(by_date) < 2:
            return None, None

        anchor_d = date.fromisoformat(anchor)

        # Prefer a reference point ~7 days back; accept 2–14 days back.
        target = anchor_d - timedelta(days=7)
        candidates = [
            d
            for d in by_date
            if timedelta(days=2) <= anchor_d - date.fromisoformat(d) <= timedelta(days=14)
        ]
        if not candidates:
            # Fall back to the most recent date that is at least 1 day old.
            candidates = [
                d for d in by_date if anchor_d - date.fromisoformat(d) >= timedelta(days=1)
            ]
        if not candidates:
            return None, None

        ref_date = min(candidates, key=lambda d: abs((date.fromisoformat(d) - target).days))
        reference, _ = self._representative_price(by_date[ref_date])
        if reference is None or reference <= 0:
            return None, None

        change = (current - reference) / reference * 100
        period = (anchor_d - date.fromisoformat(ref_date)).days
        return round(change, 1), period

    @staticmethod
    def _signal_from_change(change_pct: float) -> str:
        if change_pct >= _SIGNAL_THRESHOLD_PCT:
            return "rising"
        if change_pct <= -_SIGNAL_THRESHOLD_PCT:
            return "falling"
        return "stable"

    # ------------------------------------------------------------------
    # Arrivals distribution
    # ------------------------------------------------------------------

    def _build_distribution(
        self, current_rows: list[dict], markets_map: dict[str, dict]
    ) -> Optional[dict]:
        """
        Arrivals (quantity) distribution across markets on the latest
        date.  Returns None when the quantity data is not meaningful
        (fewer than two markets with positive arrivals).
        """
        entries: list[tuple[str, str, float]] = []
        for r in current_rows:
            qty = r.get("quantity")
            if qty is None or qty <= 0:
                continue
            entries.append(
                (
                    r["market_id"],
                    markets_map.get(r["market_id"], {}).get(
                        "name", "Unknown market"
                    ),
                    float(qty),
                )
            )

        if len(entries) < 2:
            return None

        total = sum(q for _mid, _n, q in entries)
        if total <= 0:
            return None

        entries.sort(key=lambda e: e[2], reverse=True)
        distribution_entries = [
            {
                "market_id": mid,
                "name": name,
                "quantity": round(qty, 2),
                "share_pct": round(qty / total * 100, 1),
            }
            for mid, name, qty in entries
        ]
        return {
            "entries": distribution_entries,
            "total_quantity": round(total, 2),
        }

    # ------------------------------------------------------------------
    # Farmer insights
    # ------------------------------------------------------------------

    def _build_insights(self, crop_name: str, o: dict) -> list[str]:
        """
        Short, farmer-friendly insight strings derived ONLY from real
        values in the overview dict.
        """
        insights: list[str] = []

        # 1. Price direction
        signal = o.get("signal")
        change = o.get("change_pct")
        period = o.get("change_period_days")
        if signal == "rising" and change is not None:
            insights.append(
                f"{crop_name} prices are rising — up {change}% over the last "
                f"{period} days."
            )
        elif signal == "falling" and change is not None:
            insights.append(
                f"{crop_name} prices are falling — down {abs(change)}% over "
                f"the last {period} days."
            )
        elif signal == "stable" and change is not None:
            insights.append(
                f"{crop_name} prices have stayed stable "
                f"({change:+.1f}%) over the last {period} days."
            )

        # 2. Best market to sell
        hi = o.get("highest_market")
        lo = o.get("lowest_market")
        if hi and lo and hi["name"] != lo["name"]:
            insights.append(
                f"Highest price today is in {hi['name']} "
                f"(Rs {hi['price']:,.0f}); lowest in {lo['name']} "
                f"(Rs {lo['price']:,.0f})."
            )

        # 3. Market spread
        if o.get("spread_pct") is not None and o["spread_pct"] > 0:
            insights.append(
                f"Prices differ by {o['spread_pct']}% between the highest "
                f"and lowest markets — comparing mandis before selling can "
                f"pay off."
            )

        # 4. Recent movement over the visible window
        trend = o.get("trend") or []
        if len(trend) >= 2:
            first, last = trend[0], trend[-1]
            if last["price"] != first["price"]:
                insights.append(
                    f"Price moved from Rs {first['price']:,.0f} to "
                    f"Rs {last['price']:,.0f} over the last "
                    f"{o.get('days_of_data', len(trend))} days of data."
                )

        # 5. Coverage / honesty notes
        markets_count = o.get("markets_reporting") or 0
        if markets_count:
            insights.append(
                f"Today's prices are reported from {markets_count} market"
                f"{'s' if markets_count != 1 else ''}."
            )
        if o.get("days_of_data", 0) <= 1:
            insights.append(
                "Only one day of price data is available so far — trend "
                "lines and signals will become more useful as daily data "
                "is collected."
            )

        return insights[:6]

    # ------------------------------------------------------------------
    # Supabase fetch helpers
    # ------------------------------------------------------------------

    def _fetch_commodity_rates(
        self, commodity_id: str, start: str, end: str
    ) -> list[dict]:
        """Fetch a commodity's rate rows in a date window (paginated)."""
        rows: list[dict] = []
        offset = 0
        while len(rows) < _MAX_OVERVIEW_ROWS:
            page = (
                supabase.table("crop_market_rates")
                .select(
                    "market_id, price_date, min_price, max_price, "
                    "fqp, quantity, unit"
                )
                .eq("commodity_id", commodity_id)
                .gte("price_date", start)
                .lte("price_date", end)
                .order("price_date", desc=False)
                .range(offset, offset + _PAGE_SIZE - 1)
                .execute()
            )
            data = page.data or []
            rows.extend(data)
            if len(data) < _PAGE_SIZE:
                break
            offset += _PAGE_SIZE
        return rows[:_MAX_OVERVIEW_ROWS]

    def _markets_map(self) -> dict[str, dict]:
        """Cached {market_id: {name, district, province}} lookup."""
        now = time.monotonic()
        if (
            self._markets_cache
            and now - self._markets_cache[0] < _CACHE_TTL_SECONDS
        ):
            return self._markets_cache[1]

        result = supabase.table("markets").select(
            "id, name, district, province"
        ).execute()
        mapping = {m["id"]: m for m in (result.data or [])}
        self._markets_cache = (now, mapping)
        return mapping

    @staticmethod
    def _unit_from_rows(rows: list[dict]) -> Optional[str]:
        """First non-null unit among rate rows (e.g. 'Rs/100Kg')."""
        for r in rows:
            if r.get("unit"):
                return r["unit"]
        return None


# Single shared instance.
market_service = MarketService()
