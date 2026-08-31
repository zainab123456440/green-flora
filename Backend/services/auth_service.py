"""
auth_service.py

Business logic for authentication via Supabase Auth.

This is the ONLY module that talks to Supabase Auth directly.  Routes
call these methods and never touch the Supabase client themselves.

When Supabase is not configured (fresh clone, demo mode), signup and
login return a ``ServiceUnavailableError`` so the route layer can
respond with a friendly message instead of crashing.
"""

import logging
from typing import Optional

from config.settings import settings
from config.supabase_client import supabase
from schemas.auth import is_email

logger = logging.getLogger(__name__)


class ServiceUnavailableError(Exception):
    """Raised when Supabase is not configured or unreachable."""


class AuthError(Exception):
    """Raised when authentication fails for a known reason."""


class AuthService:
    """Handles signup, login, token refresh, and user lookup."""

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_client(self):
        """Raise if the Supabase client was never initialised."""
        if supabase is None:
            raise ServiceUnavailableError(
                "Authentication service is not configured. "
                "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY."
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def signup(self, name: str, contact: str, password: str) -> dict:
        """
        Create a new Supabase Auth user.

        Returns a dict with keys: access_token, refresh_token, user_id,
        name, is_new.
        """
        self._ensure_client()

        options = {"data": {"name": name}}  # stored in user_metadata

        try:
            if is_email(contact):
                response = supabase.auth.sign_up(
                    {"email": contact, "password": password, "options": options}
                )
            else:
                response = supabase.auth.sign_up(
                    {"phone": contact, "password": password, "options": options}
                )
        except Exception as exc:
            logger.warning("Supabase signup failed: %s", exc)
            message = str(exc)
            if "already registered" in message.lower() or "already" in message.lower():
                raise AuthError("An account with this contact already exists.")
            raise AuthError("Could not create account. Please try again.")

        session = response.session
        if session is None:
            # Email confirmation might be enabled — still return useful info.
            user = response.user
            raise AuthError(
                "Account created. Please check your email/phone to confirm."
            )

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user_id": session.user.id,
            "name": name,
            "is_new": True,
        }

    def login(self, contact: str, password: str) -> dict:
        """
        Authenticate an existing user.

        Returns the same dict shape as signup().
        """
        self._ensure_client()

        try:
            if is_email(contact):
                response = supabase.auth.sign_in_with_password(
                    {"email": contact, "password": password}
                )
            else:
                response = supabase.auth.sign_in_with_password(
                    {"phone": contact, "password": password}
                )
        except Exception as exc:
            logger.warning("Supabase login failed: %s", exc)
            raise AuthError("Invalid credentials. Please try again.")

        session = response.session
        user = session.user
        name = (user.user_metadata or {}).get("name")

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user_id": user.id,
            "name": name,
            "is_new": False,
        }

    def refresh(self, refresh_token: str) -> dict:
        """
        Exchange a refresh token for a new session.

        Returns the standard auth dict.
        """
        self._ensure_client()

        try:
            response = supabase.auth.refresh_session(refresh_token)
        except Exception as exc:
            logger.warning("Supabase token refresh failed: %s", exc)
            raise AuthError("Session expired. Please sign in again.")

        session = response.session
        if session is None:
            raise AuthError("Session expired. Please sign in again.")

        user = session.user
        name = (user.user_metadata or {}).get("name")

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user_id": user.id,
            "name": name,
            "is_new": False,
        }

    def get_user_from_token(self, access_token: str) -> dict:
        """
        Verify a JWT access token and return user info.

        Returns a dict with: user_id, name, email, phone.
        """
        self._ensure_client()

        try:
            response = supabase.auth.get_user(access_token)
        except Exception as exc:
            logger.warning("Supabase get_user failed: %s", exc)
            raise AuthError("Invalid or expired token.")

        user = response.user
        metadata = user.user_metadata or {}

        return {
            "user_id": user.id,
            "name": metadata.get("name"),
            "email": user.email,
            "phone": user.phone,
        }

    def logout(self, access_token: str) -> None:
        """Sign out the user associated with the given token."""
        self._ensure_client()

        try:
            supabase.auth.sign_out(access_token)
        except Exception as exc:
            # Logout is best-effort — don't raise on failure.
            logger.warning("Supabase logout failed (non-critical): %s", exc)


# Single shared instance.
auth_service = AuthService()
