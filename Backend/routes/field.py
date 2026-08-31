"""
routes/field.py

API endpoints for fields, crop cycles, and farm summary.

Routes stay thin: they validate input (via schemas), call the
service layer, and shape the response. No business logic lives here.

Authentication model:
  Uses ``get_optional_user`` — demo mode works without auth, live
  mode requires a Bearer token. Farm ownership is enforced.

Endpoints:
    GET    /api/farm-summary                -> farm with fields + stats
    GET    /api/fields                       -> list all fields
    POST   /api/fields                       -> create a field
    PUT    /api/fields/{field_id}            -> update a field
    DELETE /api/fields/{field_id}            -> delete a field
    GET    /api/fields/{field_id}/cycles     -> list crop cycles
    POST   /api/fields/{field_id}/cycles     -> create a crop cycle
    PUT    /api/cycles/{cycle_id}            -> update a crop cycle
    DELETE /api/cycles/{cycle_id}            -> delete a crop cycle
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from config.settings import settings
from dependencies.auth import get_optional_user
from schemas.field import (
    FieldResponse,
    FieldCreateRequest,
    FieldUpdateRequest,
    CropCycleResponse,
    CropCycleCreateRequest,
    CropCycleUpdateRequest,
    FarmWithFieldsResponse,
)
from services.field_service import field_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["fields"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_user_id(user: dict | None) -> str | None:
    """
    Extract the authenticated user_id or raise 401 in live mode.
    DEMO_MODE → returns None (service will use demo data).
    """
    if settings.demo_mode:
        return None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to manage your fields.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user["user_id"]


# ---------------------------------------------------------------------------
# Farm summary
# ---------------------------------------------------------------------------

@router.get("/farm-summary", response_model=FarmWithFieldsResponse)
def get_farm_summary(
    user: dict | None = Depends(get_optional_user),
) -> FarmWithFieldsResponse:
    """Return farm overview with all fields and crop distribution."""
    user_id = _resolve_user_id(user)
    try:
        summary = field_service.get_farm_summary(user_id=user_id)
        return FarmWithFieldsResponse(**summary)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to load farm summary")
        raise HTTPException(
            status_code=500,
            detail="Failed to load farm summary. Please try again.",
        ) from exc


# ---------------------------------------------------------------------------
# Fields CRUD
# ---------------------------------------------------------------------------

@router.get("/fields", response_model=list[FieldResponse])
def list_fields(
    user: dict | None = Depends(get_optional_user),
) -> list[FieldResponse]:
    """Return all fields for the farmer's farm."""
    user_id = _resolve_user_id(user)
    try:
        fields = field_service.list_fields(user_id=user_id)
        return [FieldResponse(**f) for f in fields]
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to list fields")
        raise HTTPException(
            status_code=500, detail="Failed to load fields."
        ) from exc


@router.post(
    "/fields",
    response_model=FieldResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_field(
    payload: FieldCreateRequest,
    user: dict | None = Depends(get_optional_user),
) -> FieldResponse:
    """Create a new field on the farmer's farm."""
    user_id = _resolve_user_id(user)
    try:
        data = payload.model_dump(exclude_unset=True)
        field = field_service.create_field(user_id=user_id, data=data)
        return FieldResponse(**field)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to create field")
        raise HTTPException(
            status_code=500, detail="Failed to create field."
        ) from exc


@router.put("/fields/{field_id}", response_model=FieldResponse)
def update_field(
    field_id: str,
    payload: FieldUpdateRequest,
    user: dict | None = Depends(get_optional_user),
) -> FieldResponse:
    """Update an existing field (partial update)."""
    user_id = _resolve_user_id(user)
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400, detail="No fields provided to update."
        )

    try:
        field = field_service.update_field(
            user_id=user_id, field_id=field_id, updates=updates
        )
        return FieldResponse(**field)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to update field")
        raise HTTPException(
            status_code=500, detail="Failed to update field."
        ) from exc


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field(
    field_id: str,
    user: dict | None = Depends(get_optional_user),
) -> None:
    """Delete a field and all its crop cycles."""
    user_id = _resolve_user_id(user)
    try:
        field_service.delete_field(user_id=user_id, field_id=field_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to delete field")
        raise HTTPException(
            status_code=500, detail="Failed to delete field."
        ) from exc


# ---------------------------------------------------------------------------
# Crop Cycles CRUD
# ---------------------------------------------------------------------------

@router.get(
    "/fields/{field_id}/cycles",
    response_model=list[CropCycleResponse],
)
def list_crop_cycles(
    field_id: str,
    user: dict | None = Depends(get_optional_user),
) -> list[CropCycleResponse]:
    """Return all crop cycles for a specific field."""
    user_id = _resolve_user_id(user)
    try:
        cycles = field_service.list_crop_cycles(
            user_id=user_id, field_id=field_id
        )
        return [CropCycleResponse(**c) for c in cycles]
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to list crop cycles")
        raise HTTPException(
            status_code=500, detail="Failed to load crop cycles."
        ) from exc


@router.post(
    "/fields/{field_id}/cycles",
    response_model=CropCycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_crop_cycle(
    field_id: str,
    payload: CropCycleCreateRequest,
    user: dict | None = Depends(get_optional_user),
) -> CropCycleResponse:
    """Create a new crop cycle on a field."""
    user_id = _resolve_user_id(user)
    try:
        data = payload.model_dump(exclude_unset=True)
        cycle = field_service.create_crop_cycle(
            user_id=user_id, field_id=field_id, data=data
        )
        return CropCycleResponse(**cycle)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to create crop cycle")
        raise HTTPException(
            status_code=500, detail="Failed to create crop cycle."
        ) from exc


@router.put("/cycles/{cycle_id}", response_model=CropCycleResponse)
def update_crop_cycle(
    cycle_id: str,
    payload: CropCycleUpdateRequest,
    user: dict | None = Depends(get_optional_user),
) -> CropCycleResponse:
    """Update an existing crop cycle (partial update)."""
    user_id = _resolve_user_id(user)
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400, detail="No fields provided to update."
        )

    try:
        cycle = field_service.update_crop_cycle(
            user_id=user_id, cycle_id=cycle_id, updates=updates
        )
        return CropCycleResponse(**cycle)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to update crop cycle")
        raise HTTPException(
            status_code=500, detail="Failed to update crop cycle."
        ) from exc


@router.delete(
    "/cycles/{cycle_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_crop_cycle(
    cycle_id: str,
    user: dict | None = Depends(get_optional_user),
) -> None:
    """Delete a crop cycle."""
    user_id = _resolve_user_id(user)
    try:
        field_service.delete_crop_cycle(user_id=user_id, cycle_id=cycle_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to delete crop cycle")
        raise HTTPException(
            status_code=500, detail="Failed to delete crop cycle."
        ) from exc
