/**
 * types/farmer.ts
 *
 * TypeScript shapes for a Farmer, kept in sync with the backend's
 * schemas/farmer.py. If a field is added or renamed on the backend,
 * update it here too so the whole frontend gets type-checked against
 * the real API contract.
 */

export type PreferredLanguage = "ur" | "en" | "pa" | "sd";

export type IrrigationMethod =
  | "canal"
  | "tubewell"
  | "drip"
  | "sprinkler"
  | "rainfed"
  | null;

export type OwnershipStatus = "owned" | "leased" | "shared" | null;

/** Full farmer profile, matching FarmerResponse on the backend. */
export interface Farmer {
  id: string;
  name: string;
  phone_number: string | null;
  preferred_language: PreferredLanguage;
  location: string | null;
  farm_name: string | null;
  farm_area_acres: number | null;
  soil_type: string | null;
  irrigation_method: IrrigationMethod;
  ownership_status: OwnershipStatus;
  current_crop: string | null;
  crop_stage: string | null;
  budget_pkr: number | null;
  farm_latitude: number | null;
  farm_longitude: number | null;
  is_demo: boolean;
}

/**
 * Partial update payload, matching FarmerUpdateRequest on the backend.
 * Every field is optional — only send what actually changed.
 */
export type FarmerUpdate = Partial<Omit<Farmer, "id" | "is_demo">>;

/** Lightweight overview for the dashboard, matching DashboardSummaryResponse. */
export interface DashboardSummary {
  farmer_name: string;
  location: string | null;
  farm_area_acres: number | null;
  current_crop: string | null;
  crop_stage: string | null;
  is_demo: boolean;
}

/**
 * Fields considered for profile completeness calculation.
 * Core fields that every farmer should ideally fill in.
 */
export const PROFILE_FIELDS = [
  "name",
  "phone_number",
  "location",
  "farm_name",
  "farm_area_acres",
  "soil_type",
  "irrigation_method",
  "ownership_status",
  "current_crop",
  "crop_stage",
  "budget_pkr",
] as const;
