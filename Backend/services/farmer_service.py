"""
farmer_service.py

Business logic for farmer data.

This is the ONLY place in the backend that decides where farmer data
actually comes from: Supabase PostgreSQL, or the seeded demo farmer.
Routes should never talk to the database (or DEMO_FARMER) directly —
they call this service instead.  That keeps ``routes/farmer.py`` thin
and makes the data layer easy to swap or extend.

Demo-mode behavior (project-context.md, Section 22):
  - DEMO_MODE=true  → always return the seeded demo farmer.
  - DEMO_MODE=false → query Supabase; raise on failure (never silently
    fall back to demo data for an authenticated user).

Auto-provisioning:
  When an authenticated user hits GET /api/farmer for the first time,
  a ``farmer_profiles`` row is created from their Supabase Auth
  metadata.  A ``farms`` row is created lazily — only when the user
  actually submits farm-specific data via PUT /api/farmer.
"""

import logging
from typing import Optional

from config.settings import settings
from config.supabase_client import supabase
from data.demo_farmer import get_demo_farmer
from models.farmer import Farmer

logger = logging.getLogger(__name__)

# Column names belonging to each DB table.  Used to split an incoming
# flat update dict into the right per-table UPDATE statements.
_PROFILE_FIELDS = {"name", "phone_number", "preferred_language"}
_FARM_FIELDS = {
    "farm_name",
    "location",
    "farm_area_acres",
    "soil_type",
    "irrigation_method",
    "ownership_status",
    "budget_pkr",
    "farm_latitude",
    "farm_longitude",
}
_CROP_FIELDS = {"current_crop", "crop_stage"}


class FarmerService:
    """Handles reading and updating farmer profiles."""

    # ------------------------------------------------------------------
    # Demo-mode cache
    # ------------------------------------------------------------------

    def __init__(self) -> None:
        # In-memory cache used ONLY in demo mode so edits persist for
        # the running session.  Live mode is stateless — every call
        # hits Supabase directly.
        self._demo_farmer: Optional[Farmer] = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_farmer(self, user_id: Optional[str] = None) -> Farmer:
        """
        Return the farmer profile for *user_id*.

        * DEMO_MODE → seeded demo farmer (cached in memory).
        * Live mode → Supabase lookup; auto-provisions if the user has
          no ``farmer_profiles`` row yet.  Raises ``RuntimeError`` if
          the database is unavailable or the query fails.
        """
        if settings.demo_mode:
            if self._demo_farmer is None:
                self._demo_farmer = Farmer(**get_demo_farmer())
            return self._demo_farmer

        # Live mode — always go to the database.
        if not user_id:
            raise RuntimeError("user_id is required in live mode.")
        if supabase is None:
            raise RuntimeError(
                "Database is not configured. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_KEY."
            )

        farmer_data = self._fetch_from_db(user_id)
        if farmer_data is None:
            farmer_data = self._auto_provision(user_id)

        return Farmer(**farmer_data)

    def update_farmer(
        self, user_id: Optional[str], updates: dict
    ) -> Farmer:
        """
        Apply a partial update and return the refreshed profile.

        * DEMO_MODE → merges into the cached demo farmer.
        * Live mode → splits the flat *updates* dict into per-table
          writes (farmer_profiles, farms, crops) and persists to
          Supabase.
        """
        if settings.demo_mode:
            return self._update_demo(updates)

        if not user_id:
            raise RuntimeError("user_id is required in live mode.")
        if supabase is None:
            raise RuntimeError("Database is not configured.")

        return self._update_in_db(user_id, updates)

    # ------------------------------------------------------------------
    # Demo-mode helpers
    # ------------------------------------------------------------------

    def _update_demo(self, updates: dict) -> Farmer:
        """Merge *updates* into the cached demo farmer."""
        current = self.get_farmer()
        updated_data = current.model_dump()
        updated_data.update({k: v for k, v in updates.items() if v is not None})
        self._demo_farmer = Farmer(**updated_data)
        return self._demo_farmer

    # ------------------------------------------------------------------
    # Live-mode: read
    # ------------------------------------------------------------------

    def _fetch_from_db(self, user_id: str) -> Optional[dict]:
        """
        Load a farmer profile from Supabase.

        Returns a flat dict matching the ``Farmer`` model, or ``None``
        if no ``farmer_profiles`` row exists for *user_id*.
        """
        profile = self._get_profile_by_user_id(user_id)
        if profile is None:
            return None

        profile_id = profile["id"]

        # Load the farmer's farm (one per farmer for Phase 3).
        farm = self._get_farm_by_farmer_id(profile_id)

        # Load the latest crop for this farmer/farm.
        crop = self._get_latest_crop(profile_id, farm["id"] if farm else None)

        return self._flatten(profile, farm, crop)

    # ------------------------------------------------------------------
    # Live-mode: update
    # ------------------------------------------------------------------

    def _update_in_db(self, user_id: str, updates: dict) -> Farmer:
        """
        Persist a partial update across the normalised tables and
        return the refreshed flat profile.
        """
        profile = self._get_profile_by_user_id(user_id)
        if profile is None:
            # Profile vanished between GET and PUT — re-provision.
            profile = self._create_profile(user_id)

        profile_id = profile["id"]

        # Split the flat updates into per-table dicts.
        profile_updates = self._translate_profile_updates(updates)
        farm_updates = self._translate_farm_updates(updates)
        crop_updates = self._translate_crop_updates(updates)

        # --- farmer_profiles ---
        if profile_updates:
            supabase.table("farmer_profiles").update(profile_updates).eq(
                "id", profile_id
            ).execute()

        # --- farms ---
        farm = self._get_farm_by_farmer_id(profile_id)

        if farm_updates:
            if farm is None:
                farm_name = farm_updates.pop("farm_name", None) or "My Farm"
                farm = self._create_farm(profile_id, farm_name, farm_updates)
            else:
                farm_updates.pop("farm_name", None)  # name rarely changes
                if farm_updates:
                    supabase.table("farms").update(farm_updates).eq(
                        "id", farm["id"]
                    ).execute()

        # --- crops ---
        if crop_updates:
            if farm is None:
                # Need a farm to attach the crop to.
                farm = self._create_farm(profile_id, "My Farm")

            self._upsert_latest_crop(profile_id, farm["id"], crop_updates)

        # Re-read the full profile after all writes.
        refreshed = self._fetch_from_db(user_id)
        if refreshed is None:
            raise RuntimeError("Profile disappeared after update.")
        return Farmer(**refreshed)

    # ------------------------------------------------------------------
    # Auto-provisioning
    # ------------------------------------------------------------------

    def _auto_provision(self, user_id: str) -> dict:
        """
        Create a ``farmer_profiles`` row for a first-time user.

        Pulls name and phone from Supabase Auth metadata when available.
        Sets ``preferred_language`` to ``'ur'`` explicitly (overriding
        the DB default of ``'en'``).

        Does NOT create a ``farms`` row — that happens lazily when the
        user saves farm-specific fields.
        """
        metadata = self._get_user_metadata(user_id)

        insert_data = {
            "user_id": user_id,
            "full_name": metadata.get("name") or "Farmer",
            "phone": metadata.get("phone"),
            "preferred_language": "ur",
        }

        result = (
            supabase.table("farmer_profiles")
            .insert(insert_data)
            .execute()
        )
        new_profile = result.data[0]
        logger.info("Auto-provisioned farmer profile %s for user %s",
                     new_profile["id"], user_id)

        # Return a flat dict with no farm / no crop.
        return self._flatten(new_profile, farm=None, crop=None)

    # ------------------------------------------------------------------
    # Low-level Supabase helpers
    # ------------------------------------------------------------------

    def _get_profile_by_user_id(self, user_id: str) -> Optional[dict]:
        """Fetch farmer_profiles row by auth user_id."""
        result = (
            supabase.table("farmer_profiles")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def _get_farm_by_farmer_id(self, profile_id: str) -> Optional[dict]:
        """Fetch the first farm for a farmer."""
        result = (
            supabase.table("farms")
            .select("*")
            .eq("farmer_id", profile_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def _get_latest_crop(
        self, profile_id: str, farm_id: Optional[str] = None
    ) -> Optional[dict]:
        """Fetch the most recently created crop for a farmer."""
        query = (
            supabase.table("crops")
            .select("*")
            .eq("farmer_id", profile_id)
            .order("created_at", desc=True)
            .limit(1)
        )
        if farm_id:
            query = query.eq("farm_id", farm_id)
        result = query.execute()
        return result.data[0] if result.data else None

    def _create_profile(self, user_id: str) -> dict:
        """Insert a bare farmer_profiles row."""
        metadata = self._get_user_metadata(user_id)
        result = (
            supabase.table("farmer_profiles")
            .insert(
                {
                    "user_id": user_id,
                    "full_name": metadata.get("name") or "Farmer",
                    "phone": metadata.get("phone"),
                    "preferred_language": "ur",
                }
            )
            .execute()
        )
        return result.data[0]

    def _create_farm(
        self,
        profile_id: str,
        farm_name: str = "My Farm",
        extra: Optional[dict] = None,
    ) -> dict:
        """Insert a farms row with optional initial values."""
        farm_data: dict = {
            "farmer_id": profile_id,
            "farm_name": farm_name,
        }
        if extra:
            farm_data.update(extra)
        result = supabase.table("farms").insert(farm_data).execute()
        return result.data[0]

    def _upsert_latest_crop(
        self, profile_id: str, farm_id: str, crop_updates: dict
    ) -> None:
        """
        Update the latest crop record, or insert a new one.

        If the latest crop's ``crop_name`` matches the incoming
        ``current_crop`` value, the record is updated in place.
        Otherwise a brand-new crop row is inserted.
        """
        latest = self._get_latest_crop(profile_id, farm_id)

        if latest is not None:
            new_name = crop_updates.get("current_crop")
            # If the crop name is unchanged (or not being updated),
            # patch the existing record.
            if new_name is None or new_name == latest.get("crop_name"):
                db_fields: dict = {}
                if "crop_stage" in crop_updates:
                    db_fields["crop_stage"] = crop_updates["crop_stage"]
                if "current_crop" in crop_updates:
                    db_fields["crop_name"] = crop_updates["current_crop"]
                if db_fields:
                    supabase.table("crops").update(db_fields).eq(
                        "id", latest["id"]
                    ).execute()
                return

        # Either no crop exists or the name changed → insert new row.
        insert_data: dict = {
            "farmer_id": profile_id,
            "farm_id": farm_id,
            "crop_name": crop_updates.get("current_crop", "Unknown"),
        }
        if "crop_stage" in crop_updates:
            insert_data["crop_stage"] = crop_updates["crop_stage"]
        supabase.table("crops").insert(insert_data).execute()

    # ------------------------------------------------------------------
    # Update translation helpers  (flat API → normalised tables)
    # ------------------------------------------------------------------

    @staticmethod
    def _translate_profile_updates(updates: dict) -> dict:
        """Map flat API field names to farmer_profiles columns."""
        mapping = {
            "name": "full_name",
            "phone_number": "phone",
            "preferred_language": "preferred_language",
        }
        result: dict = {}
        for api_key, db_col in mapping.items():
            if api_key in updates and updates[api_key] is not None:
                result[db_col] = updates[api_key]
        return result

    @staticmethod
    def _translate_farm_updates(updates: dict) -> dict:
        """Map flat API field names to farms columns."""
        mapping = {
            "farm_name": "farm_name",
            "location": "location",
            "farm_area_acres": "total_area_acres",
            "soil_type": "soil_type",
            "irrigation_method": "irrigation_method",
            "ownership_status": "ownership_status",
            "budget_pkr": "budget_pkr",
            "farm_latitude": "latitude",
            "farm_longitude": "longitude",
        }
        result: dict = {}
        for api_key, db_col in mapping.items():
            if api_key in updates and updates[api_key] is not None:
                result[db_col] = updates[api_key]
        return result

    @staticmethod
    def _translate_crop_updates(updates: dict) -> dict:
        """Extract crop-related fields from the flat update dict."""
        result: dict = {}
        if "current_crop" in updates and updates["current_crop"] is not None:
            result["current_crop"] = updates["current_crop"]
        if "crop_stage" in updates and updates["crop_stage"] is not None:
            result["crop_stage"] = updates["crop_stage"]
        return result

    # ------------------------------------------------------------------
    # Flattening  (normalised rows → flat Farmer dict)
    # ------------------------------------------------------------------

    @staticmethod
    def _flatten(
        profile: dict,
        farm: Optional[dict],
        crop: Optional[dict],
    ) -> dict:
        """
        Merge normalised DB rows into the flat dict shape expected by
        the ``Farmer`` Pydantic model.
        """
        return {
            # Identity — from farmer_profiles
            "id": str(profile["id"]),
            "name": profile.get("full_name") or "Farmer",
            "phone_number": profile.get("phone"),
            "preferred_language": profile.get("preferred_language", "ur"),
            # Farm — from farms (may be absent)
            "farm_name": farm.get("farm_name") if farm else None,
            "location": farm.get("location") if farm else None,
            "farm_area_acres": (
                float(farm["total_area_acres"])
                if farm and farm.get("total_area_acres") is not None
                else None
            ),
            "soil_type": farm.get("soil_type") if farm else None,
            "irrigation_method": (
                farm.get("irrigation_method") if farm else None
            ),
            "ownership_status": (
                farm.get("ownership_status") if farm else None
            ),
            "budget_pkr": (
                float(farm["budget_pkr"])
                if farm and farm.get("budget_pkr") is not None
                else None
            ),
            "farm_latitude": (
                float(farm["latitude"])
                if farm and farm.get("latitude") is not None
                else None
            ),
            "farm_longitude": (
                float(farm["longitude"])
                if farm and farm.get("longitude") is not None
                else None
            ),
            # Crop — from crops (may be absent)
            "current_crop": crop.get("crop_name") if crop else None,
            "crop_stage": crop.get("crop_stage") if crop else None,
            # Metadata
            "is_demo": False,
        }

    # ------------------------------------------------------------------
    # Supabase Auth helper
    # ------------------------------------------------------------------

    @staticmethod
    def _get_user_metadata(user_id: str) -> dict:
        """
        Fetch user_metadata from Supabase Auth for auto-provisioning.

        Returns an empty dict if the lookup fails (best-effort).
        """
        try:
            response = supabase.auth.admin.get_user_by_id(user_id)
            user = response.user
            if user and user.user_metadata:
                return user.user_metadata
        except Exception as exc:
            logger.warning(
                "Could not fetch auth metadata for user %s: %s",
                user_id,
                exc,
            )
        return {}


# Single shared instance used across the app.
farmer_service = FarmerService()
