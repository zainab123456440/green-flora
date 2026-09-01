"""
crop_doctor.py (schemas)

API-facing schemas for the Crop Doctor endpoint.

The endpoint receives an image (multipart/form-data) and returns:
  - AI-generated diagnosis (crop, problem, severity, confidence, symptoms)
  - Matching products from the `agricultural_products` Supabase table
  - Budget-aware recommendations using the farmer's budget_pkr

The diagnosis is produced by Gemini multimodal analysis on the backend;
the frontend never sees the Gemini API key.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProblemType(str, Enum):
    DISEASE = "Disease"
    PEST_INSECT = "Pest/Insect"
    NUTRIENT_DEFICIENCY = "Nutrient Deficiency"
    WEED = "Weed"
    ENVIRONMENTAL_STRESS = "Environmental/Physical Stress"
    UNKNOWN = "Unknown"


class Severity(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    UNKNOWN = "Unknown"


# ---------------------------------------------------------------------------
# Diagnosis — Gemini's structured assessment
# ---------------------------------------------------------------------------

class Diagnosis(BaseModel):
    crop: str = Field(description="Detected crop name.")
    problem: str = Field(description="Short name of the detected problem.")
    problem_type: ProblemType = Field(
        default=ProblemType.UNKNOWN,
        description="Category of the problem.",
    )
    confidence: float = Field(
        ge=0, le=100,
        description="Confidence percentage (0–100).",
    )
    severity: Severity = Field(
        default=Severity.UNKNOWN,
        description="Estimated severity level.",
    )
    symptoms: str = Field(
        description="Farmer-friendly description of visible symptoms.",
    )
    explanation: str = Field(
        description="Short explanation of what might be causing the problem.",
    )


# ---------------------------------------------------------------------------
# Product recommendation — sourced from agricultural_products table
# ---------------------------------------------------------------------------

class ProductRecommendation(BaseModel):
    """A single product from the database, matched to the diagnosis."""

    id: str
    category: str
    local_problem_target: Optional[str] = None
    scientific_target_action: Optional[str] = None
    best_local_brand: str
    company: Optional[str] = None
    formulation_active_ingredient: Optional[str] = None
    dosage_per_acre: Optional[str] = None
    approx_price_pkr: Optional[float] = None
    min_price_pkr: Optional[float] = None
    max_price_pkr: Optional[float] = None
    fits_budget: bool = True


# ---------------------------------------------------------------------------
# Budget context — tells the frontend about the farmer's budget situation
# ---------------------------------------------------------------------------

class BudgetContext(BaseModel):
    budget_pkr: float = Field(
        description="The farmer's current treatment budget (PKR).",
    )
    within_budget: bool = Field(
        description="True if at least one recommended product fits the budget.",
    )


# ---------------------------------------------------------------------------
# Low-cost actions — suggested when budget is zero or no product fits
# ---------------------------------------------------------------------------

class LowCostAction(BaseModel):
    action: str = Field(
        description="Short, safe, problem-appropriate action the farmer can take.",
    )


# ---------------------------------------------------------------------------
# Full response
# ---------------------------------------------------------------------------

class CropDoctorResponse(BaseModel):
    """Complete Crop Doctor result returned to the frontend."""

    diagnosis: Diagnosis
    products: list[ProductRecommendation] = []
    budget: BudgetContext
    low_cost_actions: list[LowCostAction] = []
    disclaimer: str = (
        "This diagnosis is an AI assessment and may not be certain. "
        "Consult a local agricultural expert for confirmation."
    )
