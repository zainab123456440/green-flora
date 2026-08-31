"""
routes/auth.py

Authentication endpoints: signup, login, refresh, logout, and /me.

Routes stay thin: they validate input via schemas, delegate to
``auth_service``, and shape the response.  No business logic lives
here (project-context.md, Section 28, rule 6).

Endpoints:
    POST /api/auth/signup   -> create a new account
    POST /api/auth/login    -> authenticate
    POST /api/auth/refresh  -> refresh an expired token
    POST /api/auth/logout   -> sign out (protected)
    GET  /api/auth/me       -> current user info (protected)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_user
from schemas.auth import (
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    SignupRequest,
    TokenRefreshRequest,
)
from services.auth_service import (
    auth_service,
    AuthError,
    ServiceUnavailableError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _exc_to_http(exc: Exception) -> HTTPException:
    """Map service-layer exceptions to the right HTTP status code."""
    if isinstance(exc, AuthError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    if isinstance(exc, ServiceUnavailableError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    logger.exception("Unexpected auth error")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred. Please try again.",
    )


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest) -> AuthResponse:
    """Create a new Green Flora account."""
    try:
        result = auth_service.signup(payload.name, payload.contact, payload.password)
    except Exception as exc:
        raise _exc_to_http(exc)

    return AuthResponse(**result)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    """Authenticate with email/phone + password."""
    try:
        result = auth_service.login(payload.contact, payload.password)
    except Exception as exc:
        raise _exc_to_http(exc)

    return AuthResponse(**result)


@router.post("/refresh", response_model=AuthResponse)
def refresh(payload: TokenRefreshRequest) -> AuthResponse:
    """Exchange a refresh token for a new session."""
    try:
        result = auth_service.refresh(payload.refresh_token)
    except Exception as exc:
        raise _exc_to_http(exc)

    return AuthResponse(**result)


# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------

@router.post("/logout")
def logout(user: dict = Depends(get_current_user)):
    """
    Sign out the current user.

    Requires a valid Bearer token.  Logout is best-effort — returns
    200 even if the Supabase sign_out call fails.
    """
    token = user.get("_access_token", "")
    if token:
        try:
            auth_service.logout(token)
        except Exception:
            pass  # best-effort

    return {"detail": "Signed out successfully."}


@router.get("/me", response_model=AuthUserResponse)
def me(user: dict = Depends(get_current_user)) -> AuthUserResponse:
    """Return info about the currently authenticated user."""
    return AuthUserResponse(
        user_id=user["user_id"],
        name=user.get("name"),
        email=user.get("email"),
        phone=user.get("phone"),
    )
