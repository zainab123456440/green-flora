"""
routes/farmer.py

API endpoints for the farmer profile and dashboard summary.

Routes stay thin on purpose: they validate input (via schemas), call
the service layer for the actual logic, and shape the response (via
schemas).  No business logic and no direct data access lives here —
see ``services/farmer_service.py`` (project-context.md, Section 28,
rule 6: "Follow the existing architecture.").

Authentication model
--------------------
Farmer routes use ``get_optional_user`` which returns user info when
a valid Bearer token is present, or ``None`` otherwise.  The route
handler then decides:

* ``None`` + ``DEMO_MODE=true``  → serve the demo farmer.
* ``None`` + ``DEMO_MODE=false`` → return 401 (auth required).
* ``dict``                       → proceed with the real user_id.

Endpoints:
    GET  /api/farmer              -> full farmer profile
    PUT  /api/farmer              -> partial update to the profile
    GET  /api/dashboard-summary   -> lightweight overview for the dashboard
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from config.settings import settings
from dependencies.auth import get_optional_user
from schemas.farmer import (
    FarmerResponse,
    FarmerUpdateRequest,
    DashboardSummaryResponse,
)
from services.farmer_service import farmer_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["farmer"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_user_id(user: dict | None) -> str | None:
    """
    Extract the authenticated user_id or raise 401 in live mode.

    * DEMO_MODE → returns ``None`` (service will use demo data).
    * Live mode without a valid token → raises 401.
    * Live mode with a valid token → returns the user_id string.
    """
    if settings.demo_mode:
        return None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to view your farm profile.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user["user_id"]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/farmer", response_model=FarmerResponse)
def get_farmer(
    user: dict | None = Depends(get_optional_user),
) -> FarmerResponse:
    """Return the current farmer's full profile."""
    user_id = _resolve_user_id(user)

    try:
        farmer = farmer_service.get_farmer(user_id=user_id)
        return FarmerResponse(**farmer.model_dump())
    except HTTPException:
        raise  # re-raise HTTPExceptions (e.g. 401) untouched
    except Exception as exc:
        logger.exception("Failed to load farmer profile")
        raise HTTPException(
            status_code=500,
            detail="Failed to load farmer profile. Please try again.",
        ) from exc


@router.put("/farmer", response_model=FarmerResponse)
def update_farmer(
    payload: FarmerUpdateRequest,
    user: dict | None = Depends(get_optional_user),
) -> FarmerResponse:
    """
    Update the current farmer's profile.

    Accepts a partial payload — only the fields the frontend actually
    sends are changed; everything else is left as-is.
    """
    user_id = _resolve_user_id(user)

    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided to update.",
        )

    try:
        updated_farmer = farmer_service.update_farmer(
            user_id=user_id, updates=updates
        )
        return FarmerResponse(**updated_farmer.model_dump())
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to update farmer profile")
        raise HTTPException(
            status_code=500,
            detail="Failed to save changes. Please try again.",
        ) from exc


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    user: dict | None = Depends(get_optional_user),
) -> DashboardSummaryResponse:
    """
    Return a lightweight farmer + farm overview for the dashboard page.

    Kept separate from GET /api/farmer so the dashboard only ever
    fetches the small subset of fields it actually needs to render.
    """
    user_id = _resolve_user_id(user)

    try:
        farmer = farmer_service.get_farmer(user_id=user_id)
        return DashboardSummaryResponse(
            farmer_name=farmer.name,
            location=farmer.location,
            farm_area_acres=farmer.farm_area_acres,
            current_crop=farmer.current_crop,
            crop_stage=farmer.crop_stage,
            is_demo=farmer.is_demo,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to load dashboard summary")
        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard summary.",
        ) from exc
