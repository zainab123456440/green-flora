"""
common.py (schemas)

Standard API response structures used across all endpoints.
Provides consistent response shapes for the frontend to consume.
"""

from pydantic import BaseModel
from typing import Any, Optional


class ApiResponse(BaseModel):
    """Standard API response wrapper."""

    success: bool = True
    data: Optional[Any] = None
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response."""

    success: bool = False
    error: str
    detail: Optional[str] = None
