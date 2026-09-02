"""
services/support_service.py

Business logic for the Government Farmer Support feature.

Reads ONLY from the Supabase table:
    government_support

Data-integrity rules (project rules #15 / #17):
  - Never fabricate helpline numbers, organizations, or hours.
  - Green Flora does not maintain an individual expert directory; the
    single active government support record is returned as-is.
  - If no active record exists, ``None`` is returned so the UI can
    render an honest fallback state.

Government support contact data is public reference information, so no
farmer-scoped ownership checks apply here.

Caching:
  The active record changes at most a few times per year, so it is
  cached in memory with a short TTL (mirroring the market service).
"""

import logging
import time
from typing import Optional

from config.supabase_client import supabase

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tunables
# ---------------------------------------------------------------------------

_CACHE_TTL_SECONDS = 600          # 10 minutes


class SupportService:
    """Serves the active government support record for the dashboard."""

    def __init__(self) -> None:
        # (timestamp, payload) cache — payload is the record dict or None.
        self._support_cache: Optional[tuple[float, Optional[dict]]] = None

    # ------------------------------------------------------------------
    # Public: active government support record
    # ------------------------------------------------------------------

    def get_active_support(self) -> tuple[Optional[dict], bool]:
        """
        Return the active government support record.

        Returns ``(support, data_available)``.  ``support`` is ``None``
        when no active record exists; ``data_available`` is False when
        Supabase is not configured at all.

        Raises:
            RuntimeError — database failures.
        """
        if supabase is None:
            return None, False

        now = time.monotonic()
        if (
            self._support_cache
            and now - self._support_cache[0] < _CACHE_TTL_SECONDS
        ):
            return self._support_cache[1], True

        try:
            result = (
                supabase.table("government_support")
                .select("id, name, organization, phone, description, hours")
                .eq("is_active", True)
                .order("id", desc=False)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            logger.exception("Failed to load government support record")
            raise RuntimeError(
                "Could not load government support information."
            ) from exc

        rows = result.data or []
        support = rows[0] if rows else None
        self._support_cache = (now, support)
        return support, True


# Single shared instance.
support_service = SupportService()
