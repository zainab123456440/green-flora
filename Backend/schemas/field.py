"""
field.py (schemas)

API-facing request/response schemas for Field and Crop Cycle endpoints.

Relationship chain:
    farmer → farm → fields → crop_cycles → crops

Validation rules are farmer-friendly:
  - Area must be >= 0
  - Lat/lng bounds are reasonable (not strict)
  - All fields except name are optional
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ---------------------------------------------------------------------------
# Allowed values
# ---------------------------------------------------------------------------

ALLOWED_FIELD_STATUSES = {"active", "fallow", "inactive"}
ALLOWED_CYCLE_STATUSES = {"active", "harvested", "cancelled"}
ALLOWED_IRRIGATION_METHODS = {"canal", "tubewell", "drip", "sprinkler", "rainfed"}


# ---------------------------------------------------------------------------
# Field response / request schemas
# ---------------------------------------------------------------------------

class FieldResponse(BaseModel):
    """A single field returned to the frontend."""

    id: str
    farm_id: str
    name: str
    area_acres: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    boundary_geojson: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_method: Optional[str] = None
    status: str = "active"
    is_demo: bool = False

    # Nested active crop cycle (if any) for convenience.
    active_crop_cycle: Optional["CropCycleResponse"] = None


class FieldCreateRequest(BaseModel):
    """Payload for creating a new field."""

    name: str = Field(min_length=1, max_length=100)
    area_acres: Optional[float] = Field(default=None, ge=0, le=100000)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    boundary_geojson: Optional[str] = None
    soil_type: Optional[str] = Field(default=None, max_length=50)
    irrigation_method: Optional[str] = None
    status: str = "active"

    @field_validator("irrigation_method")
    @classmethod
    def validate_irrigation(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_IRRIGATION_METHODS:
            raise ValueError(
                f"irrigation_method must be one of {sorted(ALLOWED_IRRIGATION_METHODS)}"
            )
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in ALLOWED_FIELD_STATUSES:
            raise ValueError(
                f"status must be one of {sorted(ALLOWED_FIELD_STATUSES)}"
            )
        return value


class FieldUpdateRequest(BaseModel):
    """Payload for updating an existing field (partial)."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    area_acres: Optional[float] = Field(default=None, ge=0, le=100000)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    boundary_geojson: Optional[str] = None
    soil_type: Optional[str] = Field(default=None, max_length=50)
    irrigation_method: Optional[str] = None
    status: Optional[str] = None

    @field_validator("irrigation_method")
    @classmethod
    def validate_irrigation(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_IRRIGATION_METHODS:
            raise ValueError(
                f"irrigation_method must be one of {sorted(ALLOWED_IRRIGATION_METHODS)}"
            )
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_FIELD_STATUSES:
            raise ValueError(
                f"status must be one of {sorted(ALLOWED_FIELD_STATUSES)}"
            )
        return value


# ---------------------------------------------------------------------------
# Crop cycle response / request schemas
# ---------------------------------------------------------------------------

class CropCycleResponse(BaseModel):
    """A single crop cycle returned to the frontend."""

    id: str
    field_id: str
    crop_name: str
    variety: Optional[str] = None
    crop_stage: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    status: str = "active"
    is_demo: bool = False


class CropCycleCreateRequest(BaseModel):
    """Payload for creating a new crop cycle on a field."""

    crop_name: str = Field(min_length=1, max_length=50)
    variety: Optional[str] = Field(default=None, max_length=50)
    crop_stage: Optional[str] = Field(default=None, max_length=50)
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    status: str = "active"

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in ALLOWED_CYCLE_STATUSES:
            raise ValueError(
                f"status must be one of {sorted(ALLOWED_CYCLE_STATUSES)}"
            )
        return value


class CropCycleUpdateRequest(BaseModel):
    """Payload for updating an existing crop cycle (partial)."""

    crop_name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    variety: Optional[str] = Field(default=None, max_length=50)
    crop_stage: Optional[str] = Field(default=None, max_length=50)
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ALLOWED_CYCLE_STATUSES:
            raise ValueError(
                f"status must be one of {sorted(ALLOWED_CYCLE_STATUSES)}"
            )
        return value


# ---------------------------------------------------------------------------
# Farm summary with fields (used by dashboard + map page)
# ---------------------------------------------------------------------------

class FarmWithFieldsResponse(BaseModel):
    """Farm overview including all fields — used by map and dashboard."""

    farm_id: str
    farm_name: Optional[str] = None
    location: Optional[str] = None
    farm_latitude: Optional[float] = None
    farm_longitude: Optional[float] = None
    total_area_acres: Optional[float] = None
    fields: list[FieldResponse] = []
    total_fields: int = 0
    total_field_area_acres: float = 0.0
    crop_distribution: dict[str, float] = Field(
        default_factory=dict,
        description="Map of crop_name → total acres planted.",
    )


# Rebuild FieldResponse so the forward reference resolves.
FieldResponse.model_rebuild()
