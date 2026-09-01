"""
market.py (schemas)

API-facing response schemas for the Market Intelligence endpoints.

All values come from the AMIS-ingested Supabase tables
(``commodities``, ``markets``, ``crop_market_rates``) — never fabricated.
Fields are ``None`` / empty when the underlying data is missing so the
frontend can render honest empty states.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Commodities list (crop selector)
# ---------------------------------------------------------------------------

class MarketCommodityItem(BaseModel):
    """One selectable crop with its latest known price snapshot."""

    id: str
    name: str
    category: Optional[str] = None
    unit: Optional[str] = None
    # Most recent date this crop had any reported price (ISO date).
    latest_date: Optional[str] = None
    # Representative price (FQP-based) on latest_date.
    latest_price: Optional[float] = None
    # How many markets reported a price on latest_date.
    markets_reporting: int = 0


class MarketCommoditiesResponse(BaseModel):
    """Response for the crop-selector list endpoint."""

    commodities: list[MarketCommodityItem] = []
    total: int = 0
    # False when the AMIS pipeline has not ingested any data yet.
    data_available: bool = True


# ---------------------------------------------------------------------------
# Market overview (single commodity)
# ---------------------------------------------------------------------------

class MarketComparisonEntry(BaseModel):
    """Price of one crop in one market on the latest date."""

    market_id: str
    name: str
    price: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    quantity: Optional[float] = None
    date: Optional[str] = None


class MarketTrendPoint(BaseModel):
    """One point of the price trend series (daily)."""

    date: str
    price: float


class MarketDistributionEntry(BaseModel):
    """Share of total arrivals (quantity) for one market."""

    market_id: str
    name: str
    quantity: float
    share_pct: float


class MarketDistribution(BaseModel):
    """Arrivals distribution across markets for the latest date."""

    entries: list[MarketDistributionEntry] = []
    total_quantity: float = 0.0


class MarketSignal(str, Enum):
    RISING = "rising"
    FALLING = "falling"
    STABLE = "stable"
    INSUFFICIENT_DATA = "insufficient_data"


class MarketOverviewResponse(BaseModel):
    """Complete market-intelligence bundle for one crop."""

    commodity_id: str
    commodity_name: str
    category: Optional[str] = None
    # Price unit, e.g. "Rs/100Kg".
    unit: Optional[str] = None

    # -- Data coverage -------------------------------------------------------
    latest_date: Optional[str] = None
    first_date: Optional[str] = None
    # Number of distinct dates with price data in the fetched window.
    days_of_data: int = 0
    markets_reporting: int = 0

    # -- Summary cards -------------------------------------------------------
    current_price: Optional[float] = None
    # How the current price was derived (shown to keep the UI honest).
    price_basis: str = "unknown"
    change_pct: Optional[float] = None
    change_period_days: Optional[int] = None
    signal: MarketSignal = MarketSignal.INSUFFICIENT_DATA
    highest_market: Optional[MarketComparisonEntry] = None
    lowest_market: Optional[MarketComparisonEntry] = None
    spread_abs: Optional[float] = None
    spread_pct: Optional[float] = None

    # -- Charts --------------------------------------------------------------
    trend: list[MarketTrendPoint] = []
    # Market the trend is scoped to; None means all-market average.
    trend_market_id: Optional[str] = None
    market_comparison: list[MarketComparisonEntry] = []
    distribution: Optional[MarketDistribution] = None

    # -- Farmer insights -----------------------------------------------------
    insights: list[str] = Field(
        default_factory=list,
        description="Short, data-driven, farmer-friendly insight strings.",
    )
