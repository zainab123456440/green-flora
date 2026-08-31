/**
 * components/farm/FarmLandView.tsx
 *
 * Static farm-land visualization — shown after the farmer has set their
 * location. NOT an interactive map. Replaces the Leaflet world-map as
 * the primary "My Farm" visual.
 *
 * The canvas divides the farm's total area into proportional segments,
 * one per field, each showing the crop icon, crop name, and area.
 * If no total area is set on the farm, it falls back to the sum of
 * field areas.
 */

"use client";

import Link from "next/link";
import type { Field } from "@/types/field";

// ---------------------------------------------------------------------------
// Crop emoji/icon lookup
// ---------------------------------------------------------------------------

const CROP_EMOJI: Record<string, string> = {
  Wheat:      "🌾",
  Rice:       "🌾",
  Cotton:     "🌿",
  Sugarcane:  "🎋",
  Maize:      "🌽",
  Corn:       "🌽",
  Tomato:     "🍅",
  Potato:     "🥔",
  Onion:      "🧅",
  Chili:      "🌶️",
  Okra:       "🫑",
  Mango:      "🥭",
  Citrus:     "🍊",
  Orange:     "🍊",
  Lemon:      "🍋",
  Sunflower:  "🌻",
  Mustard:    "🌻",
  Soybean:    "🫘",
  Chickpea:   "🫘",
  Lentil:     "🫘",
};

function getCropEmoji(cropName: string): string {
  // Exact match first, then prefix match.
  if (CROP_EMOJI[cropName]) return CROP_EMOJI[cropName];
  const key = Object.keys(CROP_EMOJI).find((k) =>
    cropName.toLowerCase().startsWith(k.toLowerCase())
  );
  return key ? CROP_EMOJI[key] : "🌱";
}

// ---------------------------------------------------------------------------
// Colour palette — one per segment
// ---------------------------------------------------------------------------

const SEGMENT_PALETTES = [
  { bg: "bg-emerald-50",   border: "border-emerald-300",  text: "text-emerald-800",  dot: "bg-emerald-500" },
  { bg: "bg-amber-50",     border: "border-amber-300",    text: "text-amber-800",    dot: "bg-amber-500" },
  { bg: "bg-sky-50",       border: "border-sky-300",      text: "text-sky-800",      dot: "bg-sky-500" },
  { bg: "bg-violet-50",    border: "border-violet-300",   text: "text-violet-800",   dot: "bg-violet-500" },
  { bg: "bg-rose-50",      border: "border-rose-300",     text: "text-rose-800",     dot: "bg-rose-500" },
  { bg: "bg-teal-50",      border: "border-teal-300",     text: "text-teal-800",     dot: "bg-teal-500" },
  { bg: "bg-orange-50",    border: "border-orange-300",   text: "text-orange-800",   dot: "bg-orange-500" },
  { bg: "bg-lime-50",      border: "border-lime-300",     text: "text-lime-800",     dot: "bg-lime-500" },
];

function getPalette(index: number) {
  return SEGMENT_PALETTES[index % SEGMENT_PALETTES.length];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FarmLandViewProps {
  /** Farm name. */
  farmName: string | null;
  /** Human-readable farm location (e.g. "Punjab, Pakistan"). */
  location: string | null;
  /** Total farm area in acres (from farmer profile). */
  totalFarmAcres: number | null;
  /** All fields with optional active_crop_cycle. */
  fields: Field[];
  /** Called when the user presses "Add Field". */
  onAddField?: () => void;
  /** Whether to show the "Add Field" action. */
  showAddField?: boolean;
  /** Compact mode — smaller height, no location bar, used in dashboard. */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FarmLandView({
  farmName,
  location,
  totalFarmAcres,
  fields,
  onAddField,
  showAddField = true,
  compact = false,
}: FarmLandViewProps) {
  // Derive the effective total area to use for the canvas.
  const fieldAreaSum = fields.reduce(
    (sum, f) => sum + (f.area_acres ?? 0),
    0
  );
  const effectiveTotal =
    totalFarmAcres != null && totalFarmAcres > 0
      ? totalFarmAcres
      : fieldAreaSum > 0
        ? fieldAreaSum
        : null;

  const allocatedAcres = fieldAreaSum;
  const remainingAcres =
    effectiveTotal != null ? Math.max(0, effectiveTotal - allocatedAcres) : null;
  const overAllocated =
    effectiveTotal != null && allocatedAcres > effectiveTotal;

  // Build segments from fields that have an area (or at least a name).
  const segments = fields.map((field, idx) => {
    const crop = field.active_crop_cycle?.crop_name ?? null;
    const acres = field.area_acres ?? 0;
    const pct =
      effectiveTotal != null && effectiveTotal > 0
        ? (acres / effectiveTotal) * 100
        : fields.length > 0
          ? 100 / fields.length
          : 0;
    return { field, crop, acres, pct, palette: getPalette(idx) };
  });

  // If farm has total area and there is remaining/unallocated land, add a fallow segment.
  const hasUnallocated =
    remainingAcres != null && remainingAcres > 0.05;
  const unallocatedPct =
    effectiveTotal != null && effectiveTotal > 0
      ? (remainingAcres! / effectiveTotal) * 100
      : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">

      {/* ── Location bar (hidden in compact mode) ─────────────────────────── */}
      {!compact && (
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-primary-50 px-4 py-2.5">
          <span className="text-base">📍</span>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-primary-900">
              {farmName ?? "My Farm"}
            </span>
            {location && (
              <span className="ml-2 text-xs text-primary-600">{location}</span>
            )}
          </div>
          {effectiveTotal != null && (
            <span className="shrink-0 text-xs font-semibold text-primary-700">
              {effectiveTotal} Acres
            </span>
          )}
        </div>
      )}

      {/* ── Area stats bar ─────────────────────────────────────────────────── */}
      {effectiveTotal != null && !compact && (
        <div className="flex items-center gap-6 border-b border-neutral-100 bg-neutral-50 px-4 py-2">
          <StatPill
            label="Total"
            value={`${effectiveTotal} Ac`}
            color="text-neutral-700"
          />
          <StatPill
            label="Allocated"
            value={`${allocatedAcres.toFixed(1)} Ac`}
            color={overAllocated ? "text-danger-600" : "text-primary-700"}
          />
          {remainingAcres != null && (
            <StatPill
              label="Available"
              value={`${remainingAcres.toFixed(1)} Ac`}
              color={hasUnallocated ? "text-neutral-600" : "text-success-600"}
            />
          )}
          {overAllocated && (
            <span className="ml-auto text-xs font-medium text-danger-600">
              Over-allocated
            </span>
          )}
        </div>
      )}

      {/* ── Farm canvas ────────────────────────────────────────────────────── */}
      <div className={compact ? "p-3" : "p-4"}>
        {fields.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 text-5xl">🌾</div>
            <p className="text-sm font-medium text-neutral-600">
              No fields yet
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Add your first field to see the farm plan
            </p>
            {showAddField && onAddField && (
              <button
                onClick={onAddField}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 transition-colors"
              >
                <span className="text-base leading-none">+</span>
                Add Field
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Field grid — proportional widths via flex */}
            <div
              className={`flex overflow-hidden rounded-xl border-2 border-neutral-200 ${
                compact ? "h-20" : "h-44 sm:h-52"
              }`}
              style={{ boxShadow: "inset 0 1px 4px rgba(0,0,0,0.06)" }}
            >
              {segments.map(({ field, crop, acres, pct, palette }, i) => (
                <div
                  key={field.id}
                  className={`relative flex flex-col items-center justify-center overflow-hidden
                    ${palette.bg} border-r-2 ${palette.border}
                    transition-all duration-500 ease-in-out`}
                  style={{ width: `${pct}%`, minWidth: compact ? "32px" : "60px" }}
                  title={`${field.name}${acres > 0 ? ` — ${acres} acres` : ""}`}
                >
                  {compact ? (
                    /* Compact: just emoji */
                    <span className="text-lg leading-none select-none">
                      {crop ? getCropEmoji(crop) : "🌱"}
                    </span>
                  ) : (
                    /* Full: emoji + name + area */
                    <>
                      <span className="text-2xl sm:text-3xl leading-none select-none mb-1">
                        {crop ? getCropEmoji(crop) : "🌱"}
                      </span>
                      <span
                        className={`px-1 text-center font-semibold leading-tight ${palette.text} ${
                          pct < 12 ? "text-[9px]" : pct < 20 ? "text-[10px]" : "text-xs"
                        }`}
                      >
                        {crop ?? field.name}
                      </span>
                      {acres > 0 && (
                        <span
                          className={`mt-0.5 font-medium text-neutral-500 ${
                            pct < 12 ? "text-[8px]" : "text-[10px]"
                          }`}
                        >
                          {acres} Ac
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Unallocated land segment */}
              {hasUnallocated && (
                <div
                  className="relative flex flex-col items-center justify-center overflow-hidden
                    bg-neutral-50 border-r-2 border-neutral-200 transition-all duration-500"
                  style={{ width: `${unallocatedPct}%`, minWidth: compact ? "20px" : "40px" }}
                  title={`Unallocated — ${remainingAcres!.toFixed(1)} acres`}
                >
                  {!compact && (
                    <>
                      <span className="text-xl leading-none select-none mb-1 opacity-40">
                        🌿
                      </span>
                      {unallocatedPct > 10 && (
                        <span className="text-[9px] font-medium text-neutral-400 text-center px-1">
                          Available
                        </span>
                      )}
                      {unallocatedPct > 14 && (
                        <span className="text-[8px] text-neutral-400">
                          {remainingAcres!.toFixed(1)} Ac
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Legend row (hidden in compact) */}
            {!compact && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {segments.map(({ field, crop, acres, palette }) => (
                  <div key={field.id} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-sm ${palette.dot}`} />
                    <span className="text-xs text-neutral-600">
                      {crop ?? field.name}
                      {acres > 0 && (
                        <span className="ml-1 text-neutral-400">
                          {acres} Ac
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {hasUnallocated && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-neutral-300" />
                    <span className="text-xs text-neutral-400">
                      Available {remainingAcres!.toFixed(1)} Ac
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add field button footer (full mode only) ──────────────────────── */}
      {!compact && showAddField && onAddField && fields.length > 0 && (
        <div className="border-t border-neutral-100 px-4 py-3">
          <button
            onClick={onAddField}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200
              bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700
              hover:bg-primary-100 transition-colors"
          >
            <span className="text-sm leading-none">+</span>
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <span className={`text-sm font-semibold leading-tight ${color}`}>
        {value}
      </span>
    </div>
  );
}
