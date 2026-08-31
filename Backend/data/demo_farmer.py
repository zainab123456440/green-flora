"""
demo_farmer.py

Seeded/demo farmer used for the hackathon MVP.

Per project-context.md (Section 23 - Demo Farmer) and the Zero-Budget /
Demo Mode strategy (Section 22), Green Flora must never crash or show an
empty screen just because a real database record isn't available yet.

This module provides a single, consistent demo farmer that services can
fall back to when:
  - DEMO_MODE is enabled, or
  - Supabase/PostgreSQL is unreachable, or
  - No farmer record exists yet for the current session.

This is intentionally plain data - no DB calls, no external requests.
"""

DEMO_FARMER = {
    "id": "demo-farmer-001",
    "name": "Muhammad Asif",
    "phone_number": "+92-300-0000000",
    "preferred_language": "ur",  # Urdu
    "location": "Punjab, Pakistan",
    "farm_name": "Asif Farm",
    "farm_area_acres": 12,
    "soil_type": "Loamy",
    "irrigation_method": "canal",
    "ownership_status": "owned",
    "current_crop": "Wheat",
    "crop_stage": "Vegetative",
    "budget_pkr": 150000,
    "farm_latitude": 31.4180,
    "farm_longitude": 73.0800,
    "is_demo": True,
}


def get_demo_farmer() -> dict:
    """
    Return a copy of the seeded demo farmer.

    Returns a copy (not the original dict) so callers can freely modify
    the result without mutating this module's shared constant.
    """
    return dict(DEMO_FARMER)
