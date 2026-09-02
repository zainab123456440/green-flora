"""
support.py (schemas)

API-facing response schemas for the Government Farmer Support endpoint.

All values come from the Supabase ``government_support`` table — never
fabricated.  ``support`` is ``None`` when no active record exists so the
frontend can render an honest fallback state.
"""

from typing import Optional

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Government support (dashboard card)
# ---------------------------------------------------------------------------

class GovernmentSupportInfo(BaseModel):
    """The active official government support service for farmers."""

    id: int
    # Service name, e.g. "Punjab Agriculture Helpline".
    name: str
    # Official organization, e.g. "Agriculture Department, Government of Punjab".
    organization: str
    # Helpline phone number as stored in the database.
    phone: str
    description: Optional[str] = None
    # Availability hours, e.g. "8:00 AM - 8:00 PM".
    hours: Optional[str] = None


class GovernmentSupportResponse(BaseModel):
    """Response for GET /api/support/government."""

    support: Optional[GovernmentSupportInfo] = None
    # False when the database is not configured (no record could be read).
    data_available: bool = True
