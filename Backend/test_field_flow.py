"""Test field creation via the service layer (bypasses HTTP auth)."""
from services.field_service import field_service
from config.settings import settings

print(f"Demo mode: {settings.demo_mode}")

# Use a known user_id that has a farm (Muhammad Asif has 'Asif Farm')
USER_ID = "cc8ca6ef-3b2c-4ed7-8fc7-3041476bf066"

# Step 1: Test farm summary before creating a field
print("\n=== Farm summary BEFORE ===")
try:
    summary = field_service.get_farm_summary(user_id=USER_ID)
    print(f"Farm: {summary['farm_name']}")
    print(f"Total area: {summary['total_area_acres']}")
    print(f"Fields: {summary['total_fields']}")
    print(f"Field area: {summary['total_field_area_acres']}")
    for f in summary['fields']:
        print(f"  - {f['name']}: {f.get('area_acres')} acres, status={f['status']}")
except Exception as e:
    print(f"ERROR: {e}")

# Step 2: Create a field
print("\n=== Creating field 'Wheat Field' ===")
try:
    data = {
        "name": "Wheat Field",
        "area_acres": 4.0,
        "latitude": 31.1234,
        "longitude": 74.1234,
        "status": "active",
    }
    field = field_service.create_field(user_id=USER_ID, data=data)
    print(f"SUCCESS! Created field:")
    print(f"  id: {field['id']}")
    print(f"  name: {field['name']}")
    print(f"  area_acres: {field.get('area_acres')}")
    print(f"  farm_id: {field['farm_id']}")
    print(f"  status: {field['status']}")
    field_id = field['id']
except Exception as e:
    print(f"FAILED: {e}")
    field_id = None

# Step 3: Create a crop cycle on the field
if field_id:
    print(f"\n=== Creating crop cycle for field {field_id} ===")
    try:
        cycle_data = {
            "crop_name": "Wheat",
            "status": "active",
        }
        cycle = field_service.create_crop_cycle(
            user_id=USER_ID, field_id=field_id, data=cycle_data
        )
        print(f"SUCCESS! Created crop cycle:")
        print(f"  id: {cycle['id']}")
        print(f"  crop_name: {cycle.get('crop_name')}")
        print(f"  status: {cycle['status']}")
    except Exception as e:
        print(f"Crop cycle creation FAILED: {e}")

# Step 4: Farm summary AFTER
print("\n=== Farm summary AFTER ===")
try:
    summary = field_service.get_farm_summary(user_id=USER_ID)
    print(f"Farm: {summary['farm_name']}")
    print(f"Total area: {summary['total_area_acres']}")
    print(f"Fields: {summary['total_fields']}")
    print(f"Field area: {summary['total_field_area_acres']}")
    print(f"Crop distribution: {summary['crop_distribution']}")
    for f in summary['fields']:
        cycle = f.get('active_crop_cycle')
        crop_name = cycle['crop_name'] if cycle else None
        print(f"  - {f['name']}: {f.get('area_acres')} acres, crop={crop_name}")
except Exception as e:
    print(f"ERROR: {e}")

# Step 5: Clean up - delete the test field
if field_id:
    print(f"\n=== Cleaning up: deleting field {field_id} ===")
    try:
        field_service.delete_field(user_id=USER_ID, field_id=field_id)
        print("Deleted successfully")
    except Exception as e:
        print(f"Cleanup FAILED: {e}")
