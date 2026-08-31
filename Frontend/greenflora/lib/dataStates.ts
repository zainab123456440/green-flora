/**
 * lib/dataStates.ts
 *
 * Reusable patterns for progressive data architecture.
 * Green Flora must never crash or show a broken page because
 * farmer data is missing, partial, loading, or failing.
 */

export type DataState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string }
  | { status: "empty"; hint?: string };

/**
 * Safely display a value or a fallback for null/undefined.
 */
export function displayValue(
  value: string | number | null | undefined,
  fallback = "Not set"
): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

/**
 * Safely format a currency value.
 */
export function formatCurrency(
  value: number | null | undefined,
  currency = "PKR"
): string {
  if (value === null || value === undefined) return "Not set";
  return `${currency} ${value.toLocaleString()}`;
}

/**
 * Calculate profile completeness as a percentage.
 * Takes an object and an array of field keys to check.
 * Returns 0–100 based on how many fields have non-null values.
 */
export function calculateCompleteness(
  data: Record<string, unknown>,
  fields: string[]
): number {
  if (fields.length === 0) return 0;
  const filled = fields.filter((key) => {
    const val = data[key];
    return val !== null && val !== undefined && val !== "";
  }).length;
  return Math.round((filled / fields.length) * 100);
}
