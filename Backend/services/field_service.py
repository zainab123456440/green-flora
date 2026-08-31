"""
field_service.py

Business logic for fields and crop cycles.

This is the ONLY place in the backend that decides where field data
comes from: Supabase or seeded demo data. Routes call this service
and never touch the database directly.

Demo-mode behavior:
  - DEMO_MODE=true  → return in-memory demo fields/crop cycles.
  - DEME_MODE=false → query Supabase; enforce farm ownership.

Relationship chain:
    farmer_profiles → farms → fields → crop_cycles
"""

import json
import logging
import uuid
from typing import Optional

from config.settings import settings
from config.supabase_client import supabase
from data.demo_fields import (
    get_demo_fields,
    get_demo_crop_cycles,
    get_demo_farm_center,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Column-name translation between the API contract and the actual DB schema.
#
# The fields table uses ``area`` rather than ``area_acres`` and currently
# lacks ``soil_type`` / ``irrigation_method``.  The crop_cycles table
# currently lacks ``crop_name`` / ``crop_stage``.  These mappings let the
# service adapt gracefully until the columns are added.
# ---------------------------------------------------------------------------

_FIELD_API_TO_DB = {
    "area_acres": "area",
}

_FIELD_DB_TO_API = {v: k for k, v in _FIELD_API_TO_DB.items()}

# Columns the fields table actually has (discovered from the live DB).
_FIELD_DB_COLS = {
    "id", "farm_id", "name", "area", "area_unit",
    "latitude", "longitude", "boundary_geojson",
    "status", "notes", "created_at", "updated_at",
}

_CYCLE_API_TO_DB: dict[str, str] = {}

_CYCLE_DB_TO_API: dict[str, str] = {}

# Columns the crop_cycles table actually has.
_CYCLE_DB_COLS = {
    "id", "field_id", "variety",
    "planting_date", "expected_harvest_date",
    "status", "created_at",
}


def _translate_to_db(
    data: dict,
    api_to_db: dict[str, str],
    known_cols: set[str],
) -> dict:
    """Rename API keys → DB columns, drop keys the DB doesn't have."""
    out: dict[str, object] = {}
    for key, val in data.items():
        db_key = api_to_db.get(key, key)
        if db_key in known_cols:
            out[db_key] = val
    return out


def _translate_from_db(
    row: dict,
    db_to_api: dict[str, str],
) -> dict:
    """Rename DB columns → API keys."""
    return {db_to_api.get(k, k): v for k, v in row.items()}


class FieldService:
    """Handles CRUD for fields, crop cycles, and farm summaries."""

    def __init__(self) -> None:
        # In-memory cache for demo mode only.
        self._demo_fields: Optional[list[dict]] = None
        self._demo_crop_cycles: Optional[list[dict]] = None

    # ------------------------------------------------------------------
    # Demo-mode helpers
    # ------------------------------------------------------------------

    def _ensure_demo_data(self):
        if self._demo_fields is None:
            self._demo_fields = get_demo_fields()
        if self._demo_crop_cycles is None:
            self._demo_crop_cycles = get_demo_crop_cycles()

    # ------------------------------------------------------------------
    # Farm ownership check
    # ------------------------------------------------------------------

    def _get_farm_for_user(self, user_id: str) -> dict:
        """
        Get the farm belonging to this user.

        Auto-provisions a farmer_profiles row and a farms row if
        either is missing, so first-time users can add fields
        without having to visit the profile page first.

        Raises RuntimeError only if Supabase is down or the
        insert/select queries fail unexpectedly.
        """
        if supabase is None:
            raise RuntimeError(
                "Database is not configured. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_KEY."
            )

        # --- Farmer profile (auto-provision if missing) ---
        profile = (
            supabase.table("farmer_profiles")
            .select("id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if not profile.data:
            logger.info(
                "Auto-provisioning farmer profile for user %s", user_id
            )
            result = (
                supabase.table("farmer_profiles")
                .insert({
                    "user_id": user_id,
                    "full_name": "Farmer",
                    "preferred_language": "ur",
                })
                .execute()
            )
            if not result.data:
                raise RuntimeError(
                    "Could not create farmer profile. Please try again."
                )
            farmer_id = result.data[0]["id"]
        else:
            farmer_id = profile.data[0]["id"]

        # --- Farm (auto-provision if missing) ---
        farm = (
            supabase.table("farms")
            .select("*")
            .eq("farmer_id", farmer_id)
            .limit(1)
            .execute()
        )
        if not farm.data:
            logger.info(
                "Auto-provisioning farm for farmer %s", farmer_id
            )
            result = (
                supabase.table("farms")
                .insert({
                    "farmer_id": farmer_id,
                    "farm_name": "My Farm",
                })
                .execute()
            )
            if not result.data:
                raise RuntimeError(
                    "Could not create farm. Please try again."
                )
            return result.data[0]

        return farm.data[0]

    def _verify_field_ownership(self, field_id: str, farm_id: str) -> dict:
        """Ensure the field belongs to this user's farm.

        Returns the raw DB row (DB column names).
        """
        result = (
            supabase.table("fields")
            .select("*")
            .eq("id", field_id)
            .eq("farm_id", farm_id)
            .limit(1)
            .execute()
        )
        if not result.data:
            raise RuntimeError(
                "Field not found or does not belong to your farm."
            )
        return result.data[0]

    def _verify_cycle_ownership(
        self, cycle_id: str, farm_id: str
    ) -> dict:
        """Ensure the crop cycle belongs to a field in this farm."""
        result = (
            supabase.table("crop_cycles")
            .select("*, fields!inner(farm_id)")
            .eq("id", cycle_id)
            .eq("fields.farm_id", farm_id)
            .limit(1)
            .execute()
        )
        if not result.data:
            raise RuntimeError(
                "Crop cycle not found or does not belong to your farm."
            )
        return result.data[0]

    # ==================================================================
    # FIELDS
    # ==================================================================

    def list_fields(self, user_id: Optional[str] = None) -> list[dict]:
        """Return all fields for the farmer's farm."""
        if settings.demo_mode:
            self._ensure_demo_data()
            return self._attach_demo_cycles(self._demo_fields)

        farm = self._get_farm_for_user(user_id)
        return self._list_fields_db(farm["id"])

    def create_field(
        self, user_id: str, data: dict
    ) -> dict:
        """Create a new field on the farmer's farm."""
        if settings.demo_mode:
            self._ensure_demo_data()
            new_field = {
                "id": f"demo-field-{uuid.uuid4().hex[:6]}",
                "farm_id": "demo-farm-001",
                "name": data.get("name", "New Field"),
                "area_acres": data.get("area_acres"),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "boundary_geojson": data.get("boundary_geojson"),
                "soil_type": data.get("soil_type"),
                "irrigation_method": data.get("irrigation_method"),
                "status": data.get("status", "active"),
                "is_demo": True,
            }
            self._demo_fields.append(new_field)
            return {**new_field, "active_crop_cycle": None}

        farm = self._get_farm_for_user(user_id)
        return self._create_field_db(farm["id"], data)

    def update_field(
        self, user_id: str, field_id: str, updates: dict
    ) -> dict:
        """Update an existing field (partial update)."""
        if settings.demo_mode:
            self._ensure_demo_data()
            for field in self._demo_fields:
                if field["id"] == field_id:
                    field.update(
                        {k: v for k, v in updates.items() if v is not None}
                    )
                    return {**field, "active_crop_cycle": None}
            raise RuntimeError("Field not found.")

        farm = self._get_farm_for_user(user_id)
        self._verify_field_ownership(field_id, farm["id"])
        return self._update_field_db(field_id, updates)

    def delete_field(self, user_id: str, field_id: str) -> None:
        """Delete a field and its crop cycles."""
        if settings.demo_mode:
            self._ensure_demo_data()
            self._demo_fields = [
                f for f in self._demo_fields if f["id"] != field_id
            ]
            self._demo_crop_cycles = [
                c
                for c in self._demo_crop_cycles
                if c["field_id"] != field_id
            ]
            return

        farm = self._get_farm_for_user(user_id)
        self._verify_field_ownership(field_id, farm["id"])
        self._delete_field_db(field_id)

    # ==================================================================
    # CROP CYCLES
    # ==================================================================

    def list_crop_cycles(
        self, user_id: str, field_id: str
    ) -> list[dict]:
        """Return all crop cycles for a specific field."""
        if settings.demo_mode:
            self._ensure_demo_data()
            return [
                c
                for c in self._demo_crop_cycles
                if c["field_id"] == field_id
            ]

        farm = self._get_farm_for_user(user_id)
        self._verify_field_ownership(field_id, farm["id"])
        return self._list_cycles_db(field_id)

    def create_crop_cycle(
        self, user_id: str, field_id: str, data: dict
    ) -> dict:
        """Create a new crop cycle on a field."""
        if settings.demo_mode:
            self._ensure_demo_data()
            # Verify field exists in demo data.
            if not any(f["id"] == field_id for f in self._demo_fields):
                raise RuntimeError("Field not found.")
            new_cycle = {
                "id": f"demo-cycle-{uuid.uuid4().hex[:6]}",
                "field_id": field_id,
                "crop_name": data.get("crop_name", "Unknown"),
                "variety": data.get("variety"),
                "crop_stage": data.get("crop_stage"),
                "planting_date": data.get("planting_date"),
                "expected_harvest_date": data.get("expected_harvest_date"),
                "status": data.get("status", "active"),
                "is_demo": True,
            }
            self._demo_crop_cycles.append(new_cycle)
            return new_cycle

        farm = self._get_farm_for_user(user_id)
        self._verify_field_ownership(field_id, farm["id"])
        return self._create_cycle_db(field_id, data)

    def update_crop_cycle(
        self, user_id: str, cycle_id: str, updates: dict
    ) -> dict:
        """Update an existing crop cycle (partial)."""
        if settings.demo_mode:
            self._ensure_demo_data()
            for cycle in self._demo_crop_cycles:
                if cycle["id"] == cycle_id:
                    cycle.update(
                        {k: v for k, v in updates.items() if v is not None}
                    )
                    return cycle
            raise RuntimeError("Crop cycle not found.")

        farm = self._get_farm_for_user(user_id)
        self._verify_cycle_ownership(cycle_id, farm["id"])
        return self._update_cycle_db(cycle_id, updates)

    def delete_crop_cycle(self, user_id: str, cycle_id: str) -> None:
        """Delete a crop cycle."""
        if settings.demo_mode:
            self._ensure_demo_data()
            self._demo_crop_cycles = [
                c for c in self._demo_crop_cycles if c["id"] != cycle_id
            ]
            return

        farm = self._get_farm_for_user(user_id)
        self._verify_cycle_ownership(cycle_id, farm["id"])
        self._delete_cycle_db(cycle_id)

    # ==================================================================
    # FARM SUMMARY (for dashboard + map)
    # ==================================================================

    def get_farm_summary(
        self, user_id: Optional[str] = None
    ) -> dict:
        """
        Return a farm summary with all fields, crop distribution,
        and totals — used by both the map page and dashboard.
        """
        if settings.demo_mode:
            self._ensure_demo_data()
            fields = self._attach_demo_cycles(self._demo_fields)
            center = get_demo_farm_center()
            total_area = sum(
                f.get("area_acres", 0) or 0 for f in fields
            )
            crop_dist: dict[str, float] = {}
            for field in fields:
                cycle = field.get("active_crop_cycle")
                if cycle:
                    crop = cycle.get("crop_name")
                    if crop:
                        crop_dist[crop] = crop_dist.get(crop, 0) + (
                            field.get("area_acres", 0) or 0
                        )
            return {
                "farm_id": "demo-farm-001",
                "farm_name": "Asif Farm",
                "location": "Punjab, Pakistan",
                "farm_latitude": center["latitude"],
                "farm_longitude": center["longitude"],
                "total_area_acres": 12.0,
                "fields": fields,
                "total_fields": len(fields),
                "total_field_area_acres": total_area,
                "crop_distribution": crop_dist,
            }

        farm = self._get_farm_for_user(user_id)
        fields = self._list_fields_db(farm["id"])
        total_area = sum(
            f.get("area_acres", 0) or 0 for f in fields
        )
        crop_dist = {}
        for field in fields:
            cycle = field.get("active_crop_cycle")
            if cycle:
                crop = cycle.get("crop_name")
                if crop:
                    crop_dist[crop] = crop_dist.get(crop, 0) + (
                        field.get("area_acres", 0) or 0
                    )

        return {
            "farm_id": str(farm["id"]),
            "farm_name": farm.get("farm_name"),
            "location": farm.get("location"),
            "farm_latitude": farm.get("latitude"),
            "farm_longitude": farm.get("longitude"),
            "total_area_acres": (
                float(farm["total_area_acres"])
                if farm.get("total_area_acres")
                else None
            ),
            "fields": fields,
            "total_fields": len(fields),
            "total_field_area_acres": total_area,
            "crop_distribution": crop_dist,
        }

    # ==================================================================
    # Demo helpers
    # ==================================================================

    def _attach_demo_cycles(self, fields: list[dict]) -> list[dict]:
        """Attach the active crop cycle to each demo field."""
        result = []
        for field in fields:
            active_cycle = None
            for cycle in self._demo_crop_cycles:
                if (
                    cycle["field_id"] == field["id"]
                    and cycle["status"] == "active"
                ):
                    active_cycle = cycle
                    break
            result.append({**field, "active_crop_cycle": active_cycle})
        return result

    # ==================================================================
    # Supabase: Fields
    # ==================================================================

    def _list_fields_db(self, farm_id: str) -> list[dict]:
        """List all fields for a farm with active crop cycles.

        Each field dict uses **API** key names so the rest of the
        service and all schemas stay consistent.
        """
        result = (
            supabase.table("fields")
            .select("*")
            .eq("farm_id", farm_id)
            .order("created_at", desc=False)
            .execute()
        )
        fields = result.data or []

        enriched = []
        for raw in fields:
            field = _translate_from_db(raw, _FIELD_DB_TO_API)
            active = self._get_active_cycle_db(field["id"])
            enriched.append({**field, "active_crop_cycle": active})
        return enriched

    def _create_field_db(self, farm_id: str, data: dict) -> dict:
        """Insert a field, translating API names → DB columns."""
        insert_data = {"farm_id": farm_id, **data}
        # Remove None values so DB defaults apply.
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        # Translate API names to DB column names and drop unknown cols.
        db_data = _translate_to_db(insert_data, _FIELD_API_TO_DB, _FIELD_DB_COLS)
        result = supabase.table("fields").insert(db_data).execute()
        row = _translate_from_db(result.data[0], _FIELD_DB_TO_API)
        return {**row, "active_crop_cycle": None}

    def _update_field_db(self, field_id: str, updates: dict) -> dict:
        clean = {k: v for k, v in updates.items() if v is not None}
        if not clean:
            # Nothing to update, just return current.
            row = (
                supabase.table("fields")
                .select("*")
                .eq("id", field_id)
                .limit(1)
                .execute()
            )
            field = _translate_from_db(row.data[0], _FIELD_DB_TO_API)
            active = self._get_active_cycle_db(field_id)
            return {**field, "active_crop_cycle": active}

        db_updates = _translate_to_db(clean, _FIELD_API_TO_DB, _FIELD_DB_COLS)
        if not db_updates:
            # All updates were for columns the DB doesn't have yet.
            row = (
                supabase.table("fields")
                .select("*")
                .eq("id", field_id)
                .limit(1)
                .execute()
            )
            field = _translate_from_db(row.data[0], _FIELD_DB_TO_API)
            active = self._get_active_cycle_db(field_id)
            return {**field, "active_crop_cycle": active}

        result = (
            supabase.table("fields")
            .update(db_updates)
            .eq("id", field_id)
            .execute()
        )
        field = _translate_from_db(result.data[0], _FIELD_DB_TO_API)
        active = self._get_active_cycle_db(field_id)
        return {**field, "active_crop_cycle": active}

    def _delete_field_db(self, field_id: str) -> None:
        # Delete crop cycles first, then the field.
        supabase.table("crop_cycles").delete().eq("field_id", field_id).execute()
        supabase.table("fields").delete().eq("id", field_id).execute()

    # ==================================================================
    # Supabase: Crop Cycles
    # ==================================================================

    def _list_cycles_db(self, field_id: str) -> list[dict]:
        result = (
            supabase.table("crop_cycles")
            .select("*")
            .eq("field_id", field_id)
            .order("created_at", desc=True)
            .execute()
        )
        rows = result.data or []
        return [_translate_from_db(r, _CYCLE_DB_TO_API) for r in rows]

    def _get_active_cycle_db(self, field_id: str) -> Optional[dict]:
        """Get the most recent active crop cycle for a field."""
        result = (
            supabase.table("crop_cycles")
            .select("*")
            .eq("field_id", field_id)
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return _translate_from_db(result.data[0], _CYCLE_DB_TO_API)

    def _create_cycle_db(self, field_id: str, data: dict) -> dict:
        insert_data = {"field_id": field_id, **data}
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        db_data = _translate_to_db(insert_data, _CYCLE_API_TO_DB, _CYCLE_DB_COLS)
        result = supabase.table("crop_cycles").insert(db_data).execute()
        cycle = _translate_from_db(result.data[0], _CYCLE_DB_TO_API)
        # Ensure all API-expected keys exist (DB may lack some columns).
        for key in ("crop_name", "crop_stage"):
            cycle.setdefault(key, data.get(key))
        return cycle

    def _update_cycle_db(self, cycle_id: str, updates: dict) -> dict:
        clean = {k: v for k, v in updates.items() if v is not None}
        if not clean:
            row = (
                supabase.table("crop_cycles")
                .select("*")
                .eq("id", cycle_id)
                .limit(1)
                .execute()
            )
            cycle = _translate_from_db(row.data[0], _CYCLE_DB_TO_API)
            cycle.setdefault("crop_name", None)
            cycle.setdefault("crop_stage", None)
            return cycle

        db_updates = _translate_to_db(clean, _CYCLE_API_TO_DB, _CYCLE_DB_COLS)
        if not db_updates:
            row = (
                supabase.table("crop_cycles")
                .select("*")
                .eq("id", cycle_id)
                .limit(1)
                .execute()
            )
            cycle = _translate_from_db(row.data[0], _CYCLE_DB_TO_API)
            cycle.setdefault("crop_name", None)
            cycle.setdefault("crop_stage", None)
            return cycle

        result = (
            supabase.table("crop_cycles")
            .update(db_updates)
            .eq("id", cycle_id)
            .execute()
        )
        cycle = _translate_from_db(result.data[0], _CYCLE_DB_TO_API)
        cycle.setdefault("crop_name", updates.get("crop_name"))
        cycle.setdefault("crop_stage", updates.get("crop_stage"))
        return cycle

    def _delete_cycle_db(self, cycle_id: str) -> None:
        supabase.table("crop_cycles").delete().eq("id", cycle_id).execute()


# Single shared instance.
field_service = FieldService()
