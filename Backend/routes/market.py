"""
routes/market.py

API endpoints for the Market Intelligence feature.

Routes stay thin: they validate input (via schemas/query params), call
the service layer, and shape the response. No business logic lives here.

Market data is public AMIS (Punjab Agriculture Marketing) reference
data, not farmer-owned data, so these endpoints do not require
authentication.

Endpoints:
    GET /api/market/commodities   -> crops for the selector
    GET /api/market/overview      -> full intelligence bundle for one crop
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from schemas.market import (
    MarketCommoditiesResponse,
    MarketOverviewResponse,
)
from services.market_service import market_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/market", tags=["market"])


# ---------------------------------------------------------------------------
# Commodities (crop selector)
# ---------------------------------------------------------------------------

@router.get("/commodities", response_model=MarketCommoditiesResponse)
def list_market_commodities(refresh: bool = Query(False)) -> MarketCommoditiesResponse:
    """
    Return all crops that have AMIS price data, with their latest date
    and representative price — used by the crop selector.
    """
    try:
        items, data_available = market_service.list_commodities(refresh=refresh)
        return MarketCommoditiesResponse(
            commodities=items,
            total=len(items),
            data_available=data_available,
        )
    except RuntimeError as exc:
        logger.exception("Failed to load market commodities")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc) or "Market data is temporarily unavailable.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error loading market commodities")
        raise HTTPException(
            status_code=500,
            detail="Failed to load market prices. Please try again.",
        ) from exc


# ---------------------------------------------------------------------------
# Market overview (single crop)
# ---------------------------------------------------------------------------

@router.get("/overview", response_model=MarketOverviewResponse)
def get_market_overview(
    commodity_id: str = Query(..., description="Commodity (crop) UUID."),
    days: int = Query(
        180,
        ge=1,
        le=365,
        description="History window in days (7 / 30 / 90 / 180).",
    ),
    market_id: Optional[str] = Query(
        None, description="Optional market UUID to scope the trend series."
    ),
) -> MarketOverviewResponse:
    """
    Return the complete market-intelligence bundle for one crop:
    current price, change, signal, highest/lowest markets, trend,
    market comparison, arrivals distribution, and farmer insights.
    """
    try:
        overview = market_service.get_overview(
            commodity_id=commodity_id,
            days=days,
            market_id=market_id,
        )
        return MarketOverviewResponse(**overview)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        logger.exception("Failed to load market overview for %s", commodity_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc) or "Market data is temporarily unavailable.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error loading market overview")
        raise HTTPException(
            status_code=500,
            detail="Failed to load market data. Please try again.",
        ) from exc
