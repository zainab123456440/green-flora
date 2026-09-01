/**
 * types/cropDoctor.ts
 *
 * TypeScript shapes for the Crop Doctor API response, kept in sync
 * with the backend's schemas/crop_doctor.py.
 */

export type ProblemType =
  | "Disease"
  | "Pest/Insect"
  | "Nutrient Deficiency"
  | "Weed"
  | "Environmental/Physical Stress"
  | "Unknown";

export type Severity = "Low" | "Moderate" | "High" | "Unknown";

/** AI-generated crop diagnosis from Gemini. */
export interface Diagnosis {
  crop: string;
  problem: string;
  problem_type: ProblemType;
  confidence: number;
  severity: Severity;
  symptoms: string;
  explanation: string;
}

/** A product from the agricultural_products database. */
export interface ProductRecommendation {
  id: string;
  category: string;
  local_problem_target: string | null;
  scientific_target_action: string | null;
  best_local_brand: string;
  company: string | null;
  formulation_active_ingredient: string | null;
  dosage_per_acre: string | null;
  approx_price_pkr: number | null;
  min_price_pkr: number | null;
  max_price_pkr: number | null;
  fits_budget: boolean;
}

/** Budget context returned with the response. */
export interface BudgetContext {
  budget_pkr: number;
  within_budget: boolean;
}

/** Low-cost action suggestion. */
export interface LowCostAction {
  action: string;
}

/** Full Crop Doctor API response. */
export interface CropDoctorResponse {
  diagnosis: Diagnosis;
  products: ProductRecommendation[];
  budget: BudgetContext;
  low_cost_actions: LowCostAction[];
  disclaimer: string;
}
