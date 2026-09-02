/**
 * types/support.ts
 *
 * TypeScript shapes for the Government Farmer Support feature.
 * Mirrors the backend schemas in Backend/schemas/support.py.
 * All values originate from the Supabase `government_support`
 * table — fields are null/empty when the underlying data is missing.
 */

/** The active official government support service for farmers. */
export interface GovernmentSupportInfo {
  id: number;
  /** Service name, e.g. "Punjab Agriculture Helpline". */
  name: string;
  /** Official organization, e.g. "Agriculture Department, Government of Punjab". */
  organization: string;
  /** Helpline phone number as stored in the database. */
  phone: string;
  description: string | null;
  /** Availability hours, e.g. "8:00 AM - 8:00 PM". */
  hours: string | null;
}

/** Response of GET /api/support/government. */
export interface GovernmentSupportResponse {
  support: GovernmentSupportInfo | null;
  /** False when the database is not configured (no record could be read). */
  data_available: boolean;
}
