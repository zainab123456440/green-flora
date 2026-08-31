"""
auth.py (schemas)

Request/response schemas for authentication endpoints.

Follows the same separation pattern as schemas/farmer.py: these are
the EXTERNAL shapes exposed over the API.  The internal auth logic
lives in services/auth_service.py.

The ``contact`` field in signup/login accepts either an email address
or a phone number.  The service layer decides which Supabase auth
method to call based on whether the value contains an ``@``.
"""

import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Rough check — not a full E.164 validator, but catches obvious junk.
_PHONE_RE = re.compile(r"^\+?[\d\s\-()]{7,20}$")


def is_email(value: str) -> bool:
    """Return True if the value looks like an email (contains @)."""
    return "@" in value


def is_phone(value: str) -> bool:
    """Return True if the value looks like a phone number."""
    return bool(_PHONE_RE.match(value.strip()))


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    """Payload for POST /api/auth/signup."""

    name: str = Field(min_length=1, max_length=100)
    contact: str = Field(
        min_length=3,
        max_length=100,
        description="Email address or phone number.",
    )
    password: str = Field(min_length=8, max_length=128)

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value: str) -> str:
        value = value.strip()
        if not is_email(value) and not is_phone(value):
            raise ValueError("Enter a valid email address or phone number.")
        return value


class LoginRequest(BaseModel):
    """Payload for POST /api/auth/login."""

    contact: str = Field(
        min_length=3,
        max_length=100,
        description="Email address or phone number used at signup.",
    )
    password: str = Field(min_length=1)


class TokenRefreshRequest(BaseModel):
    """Payload for POST /api/auth/refresh."""

    refresh_token: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class AuthResponse(BaseModel):
    """Successful authentication response."""

    access_token: str
    refresh_token: str
    user_id: str
    name: Optional[str] = None
    is_new: bool = False


class AuthUserResponse(BaseModel):
    """Response for GET /api/auth/me — current user info."""

    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
