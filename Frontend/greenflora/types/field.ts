/**
 * types/field.ts
 *
 * TypeScript shapes for Fields, Crop Cycles, and Farm Summary.
 * Kept in sync with the backend's schemas/field.py.
 */

/** A crop cycle attached to a field. */
export interface CropCycle {
  id: string;
  field_id: string;
  crop_name: string;
  variety: string | null;
  crop_stage: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: "active" | "harvested" | "cancelled";
  is_demo: boolean;
}

/** A single field within a farm. */
export interface Field {
  id: string;
  farm_id: string;
  name: string;
  area_acres: number | null;
  latitude: number | null;
  longitude: number | null;
  boundary_geojson: string | null;
  soil_type: string | null;
  irrigation_method: string | null;
  status: "active" | "fallow" | "inactive";
  is_demo: boolean;
  active_crop_cycle: CropCycle | null;
}

/** Payload for creating a new field. */
export interface FieldCreate {
  name: string;
  area_acres?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  boundary_geojson?: string | null;
  soil_type?: string | null;
  irrigation_method?: string | null;
  status?: "active" | "fallow" | "inactive";
}

/** Partial update payload for a field. */
export type FieldUpdate = Partial<Omit<FieldCreate, "farm_id">>;

/** Payload for creating a new crop cycle. */
export interface CropCycleCreate {
  crop_name: string;
  variety?: string | null;
  crop_stage?: string | null;
  planting_date?: string | null;
  expected_harvest_date?: string | null;
  status?: "active" | "harvested" | "cancelled";
}

/** Partial update payload for a crop cycle. */
export type CropCycleUpdate = Partial<Omit<CropCycleCreate, "field_id">>;

/** Farm summary with fields — used by dashboard + map. */
export interface FarmSummary {
  farm_id: string;
  farm_name: string | null;
  location: string | null;
  farm_latitude: number | null;
  farm_longitude: number | null;
  total_area_acres: number | null;
  fields: Field[];
  total_fields: number;
  total_field_area_acres: number;
  crop_distribution: Record<string, number>;
}
