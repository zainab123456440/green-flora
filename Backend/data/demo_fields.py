"""
demo_fields.py

Seeded demo fields and crop cycles for the hackathon MVP.

All coordinates are in Punjab, Pakistan near Faisalabad (31.4°N, 73.1°E),
close together so they visually represent one farm on the map.

This is intentionally plain data — no DB calls, no external requests.
"""

import copy

# Farm center — near Faisalabad, Punjab
DEMO_FARM_CENTER = {
    "latitude": 31.4180,
    "longitude": 73.0800,
}

DEMO_FIELDS = [
    {
        "id": "demo-field-001",
        "farm_id": "demo-farm-001",
        "name": "Wheat Field (North)",
        "area_acres": 4.5,
        "latitude": 31.4205,
        "longitude": 73.0780,
        "boundary_geojson": None,
        "soil_type": "Loamy",
        "irrigation_method": "canal",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-field-002",
        "farm_id": "demo-farm-001",
        "name": "Rice Paddy",
        "area_acres": 3.0,
        "latitude": 31.4190,
        "longitude": 73.0825,
        "boundary_geojson": None,
        "soil_type": "Clay",
        "irrigation_method": "tubewell",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-field-003",
        "farm_id": "demo-farm-001",
        "name": "Cotton Field",
        "area_acres": 2.5,
        "latitude": 31.4165,
        "longitude": 73.0760,
        "boundary_geojson": None,
        "soil_type": "Sandy Loam",
        "irrigation_method": "canal",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-field-004",
        "farm_id": "demo-farm-001",
        "name": "Vegetable Plot",
        "area_acres": 1.0,
        "latitude": 31.4175,
        "longitude": 73.0815,
        "boundary_geojson": None,
        "soil_type": "Loamy",
        "irrigation_method": "drip",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-field-005",
        "farm_id": "demo-farm-001",
        "name": "Sugarcane Field",
        "area_acres": 1.0,
        "latitude": 31.4155,
        "longitude": 73.0795,
        "boundary_geojson": None,
        "soil_type": "Loamy",
        "irrigation_method": "canal",
        "status": "fallow",
        "is_demo": True,
    },
]

DEMO_CROP_CYCLES = [
    {
        "id": "demo-cycle-001",
        "field_id": "demo-field-001",
        "crop_name": "Wheat",
        "variety": "FSD-08",
        "crop_stage": "Vegetative",
        "planting_date": "2025-11-15",
        "expected_harvest_date": "2026-04-20",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-cycle-002",
        "field_id": "demo-field-002",
        "crop_name": "Rice",
        "variety": "Basmati-385",
        "crop_stage": "Flowering",
        "planting_date": "2025-07-01",
        "expected_harvest_date": "2025-11-15",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-cycle-003",
        "field_id": "demo-field-003",
        "crop_name": "Cotton",
        "variety": "BT-121",
        "crop_stage": "Boll formation",
        "planting_date": "2025-05-10",
        "expected_harvest_date": "2025-10-30",
        "status": "active",
        "is_demo": True,
    },
    {
        "id": "demo-cycle-004",
        "field_id": "demo-field-004",
        "crop_name": "Tomato",
        "variety": "Roma",
        "crop_stage": "Fruiting",
        "planting_date": "2025-09-01",
        "expected_harvest_date": "2026-01-15",
        "status": "active",
        "is_demo": True,
    },
]


def get_demo_fields() -> list[dict]:
    """Return deep copies of the demo fields list."""
    return copy.deepcopy(DEMO_FIELDS)


def get_demo_crop_cycles() -> list[dict]:
    """Return deep copies of the demo crop cycles list."""
    return copy.deepcopy(DEMO_CROP_CYCLES)


def get_demo_farm_center() -> dict:
    """Return a copy of the demo farm center coordinates."""
    return dict(DEMO_FARM_CENTER)
