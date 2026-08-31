"""
farmer.py (models)

Core internal data model for a Farmer.

Per architechture.md, `models/` holds the backend's core data shapes.
This is the single source of truth for "what a Farmer looks like"
inside the backend - services, routes, and (later) the Supabase layer
should all build on this model rather than inventing their own shape.

Note: this is the INTERNAL model. `schemas/farmer.py` defines the
separate request/response shapes exposed over the API (Section 28,
rule 7 of project-context.md: follow the API contract, keep concerns
separated).
"""

from pydantic import BaseModel, Field
from typing import Optional


class Farmer(BaseModel):
    """Represents a single farmer and their core farm details."""

    id: str
    name: str
    phone_number: Optional[str] = None
    preferred_language: str = Field(
        default="ur",
        description="Farmer's preferred language, e.g. 'ur' for Urdu.",
    )
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

    class Config:
        # Allows the model to be built directly from dicts such as
        # DEMO_FARMER or rows returned from Supabase.
        from_attributes = True
