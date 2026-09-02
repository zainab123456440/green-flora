"""
routes/support.py

API endpoints for the Government Farmer Support feature.

Routes stay thin: they validate input, call the service layer, and shape
the response. No business logic lives here.

Government support contact data is public reference information, not
farmer-owned data, so these endpoints do not require authentication.

Endpoints:
    GET /api/support/government   -> active government support record
"""

import logging

from fastapi import APIRouter, HTTPException, status

from schemas.support import GovernmentSupportResponse
from services.support_service import support_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/support", tags=["support"])


# ---------------------------------------------------------------------------
# Government support (dashboard card)
# ---------------------------------------------------------------------------

@router.get("/government", response_model=GovernmentSupportResponse)
def get_government_support() -> GovernmentSupportResponse:
    """
    Return the active official government support service (helpline)
    used by the dashboard card. Values come from the Supabase
    ``government_support`` table and are never fabricated.
    """
    try:
        support, data_available = support_service.get_active_support()
        return GovernmentSupportResponse(
            support=support,
            data_available=data_available,
        )
    except RuntimeError as exc:
        logger.exception("Failed to load government support")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc) or "Government support information is temporarily unavailable.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error loading government support")
        raise HTTPException(
            status_code=500,
            detail="Failed to load government support information. Please try again.",
        ) from exc
