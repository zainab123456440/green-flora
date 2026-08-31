"""
farmer.py (schemas)

API-facing request/response schemas for the Farmer endpoints.

Why this file is separate from models/farmer.py:
  - models/farmer.py   -> the INTERNAL shape of a Farmer (used by services,
                           the database layer, etc.)
  - schemas/farmer.py  -> the EXTERNAL contract exposed over the API
                           (what clients are allowed to send, and exactly
                           what they receive back)

Keeping these separate means the frontend's API contract stays stable
even if the internal model changes later (e.g. new internal-only fields,
DB-specific columns). This follows project-context.md Section 28,
rule 7: "Follow the API contract."

Validation rules here are intentionally farmer-friendly and forgiving
(e.g. optional fields, sensible bounds) since this is a hackathon MVP,
not a strict enterprise form.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ---------------------------------------------------------------------------
# Shared / reusable field constraints
# ---------------------------------------------------------------------------

ALLOWED_LANGUAGES = {"ur", "en", "pa", "sd"}  # Urdu, English, Punjabi, Sindhi
ALLOWED_IRRIGATION_METHODS = {"canal", "tubewell", "drip", "sprinkler", "rainfed"}
ALLOWED_OWNERSHIP_STATUSES = {"owned", "leased", "shared"}


# ---------------------------------------------------------------------------
# Response schema — what the API sends back
# ---------------------------------------------------------------------------

class FarmerResponse(BaseModel):
    """Full farmer record returned to the frontend."""

    id: str
    name: str
    phone_number: Optional[str] = None
    preferred_language: str = "ur"
    location: Optional[str] = None
    farm_name: Optional[str] = None
    farm_area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    irrigation_method: Optional[str] = None
    ownership_status: Optional[str] = None
    current_crop: Optional[str] = None
    crop_stage: Optional[str] = None
    budget_pkr: Optional[float] = None
    farm_latitude: Optional[float] = None
    farm_longitude: Optional[float] = None
    is_demo: bool = False

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "demo-farmer-001",
                "name": "Muhammad Asif",
                "phone_number": "+92-300-0000000",
                "preferred_language": "ur",
                "location": "Punjab, Pakistan",
                "farm_name": "Asif Farm",
                "farm_area_acres": 12,
                "soil_type": "Loamy",
                "irrigation_method": "canal",
                "ownership_status": "owned",
                "current_crop": "Wheat",
                "crop_stage": "Vegetative",
                "budget_pkr": 150000,
                "is_demo": True,
            }
        }
    }


# ---------------------------------------------------------------------------
# Request schema — what the frontend is allowed to update
# ---------------------------------------------------------------------------

class FarmerUpdateRequest(BaseModel):
    """
    Payload for updating a farmer's profile (PUT /api/farmer).

    All fields are optional so the frontend can send a partial update
    (e.g. only changing `current_crop`) without resending the whole
    profile.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(default=None, max_length=20)
    preferred_language: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=150)
    farm_name: Optional[str] = Field(default=None, max_length=100)
    farm_area_acres: Optional[float] = Field(default=None, ge=0)
    soil_type: Optional[str] = Field(default=None, max_length=50)
    irrigation_method: Optional[str] = None
    ownership_status: Optional[str] = None
    current_crop: Optional[str] = Field(default=None, max_length=50)
    crop_stage: Optional[str] = Field(default=None, max_length=50)
    budget_pkr: Optional[float] = Field(default=None, ge=0)
    farm_latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    farm_longitude: Optional[float] = Field(default=None, ge=-180, le=180)

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_LANGUAGES:
            raise ValueError(
                f"preferred_language must be one of {sorted(ALLOWED_LANGUAGES)}"
            )
        return value

    @field_validator("irrigation_method")
    @classmethod
    def validate_irrigation(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_IRRIGATION_METHODS:
            raise ValueError(
                f"irrigation_method must be one of {sorted(ALLOWED_IRRIGATION_METHODS)}"
            )
        return value

    @field_validator("ownership_status")
    @classmethod
    def validate_ownership(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_OWNERSHIP_STATUSES:
            raise ValueError(
                f"ownership_status must be one of {sorted(ALLOWED_OWNERSHIP_STATUSES)}"
            )
        return value

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_crop": "Rice",
                "budget_pkr": 200000,
            }
        }
    }


# ---------------------------------------------------------------------------
# Dashboard summary schema — lightweight overview for the dashboard page
# ---------------------------------------------------------------------------

class DashboardSummaryResponse(BaseModel):
    """
    Compact farmer + farm overview for the dashboard.

    Deliberately smaller than FarmerResponse: the dashboard needs a
    quick glance, not the full profile (Section 16 of project-context.md).
    """

    farmer_name: str
    location: Optional[str] = None
    farm_area_acres: Optional[float] = None
    current_crop: Optional[str] = None
    crop_stage: Optional[str] = None
    is_demo: bool = False
