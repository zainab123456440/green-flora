"""
field.py (models)

Core internal data models for Fields and Crop Cycles.

Relationship chain:
    farmer → farm → fields → crop_cycles → crops

A Field belongs to a farm and represents a distinct plot of land.
A CropCycle belongs to a field and links it to a crop for a
particular season/period.
"""

from pydantic import BaseModel, Field
from typing import Optional


class FieldModel(BaseModel):
    """Represents a single field within a farm."""

    id: str
    farm_id: str
    name: str
    area_acres: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # GeoJSON polygon stored as a JSON string (optional boundary).
    boundary_geojson: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_method: Optional[str] = None
    status: str = Field(
        default="active",
        description="Field status: active, fallow, or inactive.",
    )
    is_demo: bool = False


class CropCycleModel(BaseModel):
    """Represents a crop cycle linked to a specific field."""

    id: str
    field_id: str
    crop_name: str
    variety: Optional[str] = None
    crop_stage: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    status: str = Field(
        default="active",
        description="Cycle status: active, harvested, or cancelled.",
    )
    is_demo: bool = False
