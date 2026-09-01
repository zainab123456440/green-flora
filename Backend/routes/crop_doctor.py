"""
routes/crop_doctor.py

API endpoint for the Crop Doctor feature.

Accepts an image upload (multipart/form-data), validates it, forwards
it to the crop_doctor_service for Gemini analysis, and returns the
diagnosis together with budget-aware product recommendations.

Endpoint:
    POST /api/crop-doctor/analyse
"""

import logging
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from dependencies.auth import get_optional_user
from services.crop_doctor_service import crop_doctor_service
from services.farmer_service import farmer_service
from schemas.crop_doctor import CropDoctorResponse
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crop-doctor", tags=["crop-doctor"])

# Maximum allowed image size: 10 MB
_MAX_IMAGE_BYTES = 10 * 1024 * 1024

# Allowed MIME types
_ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


@router.post("/analyse", response_model=CropDoctorResponse)
async def analyse_crop(
    image: UploadFile = File(..., description="Crop image (JPEG/PNG/WebP, max 10 MB)"),
    user: Optional[dict] = Depends(get_optional_user),
) -> CropDoctorResponse:
    """
    Analyse a crop image and return diagnosis + product recommendations.

    The image is sent to Gemini for structured analysis. The resulting
    diagnosis is matched against the `agricultural_products` database
    table, filtered by the farmer's budget.
    """
    # ------------------------------------------------------------------
    # 1. Validate the uploaded file
    # ------------------------------------------------------------------
    if image.content_type not in _ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported image type: {image.content_type}. "
                "Please upload a JPEG, PNG, or WebP image."
            ),
        )

    image_bytes = await image.read()

    if len(image_bytes) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Image is too large ({len(image_bytes) // (1024*1024)} MB). "
                "Maximum allowed size is 10 MB."
            ),
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image is empty. Please select a valid photo.",
        )

    # ------------------------------------------------------------------
    # 2. Resolve the farmer's budget
    # ------------------------------------------------------------------
    farmer_budget: Optional[float] = None
    user_id = user.get("user_id") if user else None

    try:
        if user_id or settings.demo_mode:
            farmer = farmer_service.get_farmer(user_id=user_id)
            farmer_budget = farmer.budget_pkr
    except Exception:
        # Non-fatal — proceed with no budget info
        logger.warning("Could not load farmer budget for Crop Doctor.")

    # ------------------------------------------------------------------
    # 3. Analyse
    # ------------------------------------------------------------------
    try:
        result = crop_doctor_service.analyse(
            image_bytes=image_bytes,
            mime_type=image.content_type,
            farmer_budget=farmer_budget,
        )
        return result
    except RuntimeError as exc:
        logger.error("Crop Doctor analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error in Crop Doctor")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong during analysis. Please try again.",
        ) from exc
