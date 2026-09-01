/**
 * lib/marketUtils.ts
 *
 * Formatting helpers and crop-specific visual accents for the
 * Market Intelligence feature. Pure presentation logic — all numbers
 * shown in the UI come from the API (AMIS data), never from here.
 */

import type {
  MarketCommodity,
  MarketOverview,
  MarketPeriod,
  MarketTrendPoint,
} from "@/types/market";
import { PERIOD_DAYS } from "@/types/market";

// ---------------------------------------------------------------------------
// PKR formatting
// ---------------------------------------------------------------------------

const pkrFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
});

const pkrDecimalFormatter = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Compact PKR for chart axes, e.g. 12500 -> "12.5k". */
export function formatPKRCompact(value: number): string {
  if (Math.abs(value) >= 100000) {
    return `${(value / 100000).toFixed(1).replace(/\.0$/, "")}lakh`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return pkrFormatter.format(value);
}

/** "Rs 4,850" (whole rupees when the value is effectively whole). */
export function formatPKR(
  value: number | null | undefined,
  fallback = "—"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 0.005) {
    return `Rs ${pkrFormatter.format(rounded)}`;
  }
  return `Rs ${pkrDecimalFormatter.format(value)}`;
}

/** "Rs 4,850 / 100Kg" style label including the trading unit. */
export function formatPKRWithUnit(
  value: number | null | undefined,
  unit: string | null | undefined
): string {
  const price = formatPKR(value);
  if (!unit) return price;
  // unit looks like "Rs/100Kg" → append as "/100Kg"
  const suffix = unit.startsWith("Rs/") ? unit.slice(2) : ` ${unit}`;
  return `${price}${suffix}`;
}

const pkrPerKgFormatter = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "Rs 43.50" — per-kilogram price always shows 2 decimals. */
export function formatPKRPerKg(
  value: number | null | undefined,
  fallback = "—"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return `Rs ${pkrPerKgFormatter.format(value)}`;
}

/** "+4.2%" / "−3.1%" / null-safe formatting for change values. */
export function formatChangePct(
  value: number | null | undefined
): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/** "1 Sep 2026" from an ISO date string. */
export function formatMarketDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Short axis label: "1 Sep". */
export function formatAxisDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

/** Month-only axis label for long periods: "Sep". */
export function formatAxisMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PK", { month: "short" });
}

// ---------------------------------------------------------------------------
// Trend period slicing (client-side, instant filter switching)
// ---------------------------------------------------------------------------

/**
 * Slice a full trend series to the requested period.  The overview is
 * fetched once with the maximum window, so switching periods is instant.
 */
export function sliceTrendForPeriod(
  trend: MarketTrendPoint[],
  period: MarketPeriod
): MarketTrendPoint[] {
  const days = PERIOD_DAYS[period];
  if (trend.length <= 1) return trend;
  const anchor = new Date(`${trend[trend.length - 1].date}T00:00:00`);
  const cutoff = anchor.getTime() - (days - 1) * 24 * 60 * 60 * 1000;
  return trend.filter(
    (p) => new Date(`${p.date}T00:00:00`).getTime() >= cutoff
  );
}

// ---------------------------------------------------------------------------
// Crop-specific visual accents
// ---------------------------------------------------------------------------

export interface CropAccent {
  /** Primary chart color (hex). */
  chart: string;
  /** Softer fill for areas/gradients (hex). */
  chartSoft: string;
  /** Tailwind classes for a tinted icon chip background. */
  chipBg: string;
  /** Tailwind text color class matching the chart color. */
  text: string;
  /** Tailwind gradient classes for hero/highlight surfaces. */
  gradient: string;
}

const DEFAULT_ACCENT: CropAccent = {
  chart: "#2D6A4F",
  chartSoft: "#95D5B2",
  chipBg: "bg-primary-50",
  text: "text-primary-700",
  gradient: "from-primary-700 to-primary-600",
};

/**
 * Keyword → accent mapping.  Falls back to the Green Flora primary
 * green for crops without a specific identity.  Purely visual —
 * no data involved.
 */
const ACCENT_RULES: Array<{ keywords: string[]; accent: CropAccent }> = [
  {
    keywords: ["wheat", "barley", "oat"],
    accent: {
      chart: "#D97706",
      chartSoft: "#FCD34D",
      chipBg: "bg-amber-50",
      text: "text-amber-600",
      gradient: "from-amber-600 to-amber-500",
    },
  },
  {
    keywords: ["rice", "paddy", "basmati", "irri", "kainat"],
    accent: {
      chart: "#52B788",
      chartSoft: "#B7E4C7",
      chipBg: "bg-primary-100",
      text: "text-primary-700",
      gradient: "from-primary-600 to-primary-500",
    },
  },
  {
    keywords: ["maize", "corn", "millet", "sorghum", "bajra"],
    accent: {
      chart: "#EAB308",
      chartSoft: "#FDE68A",
      chipBg: "bg-amber-50",
      text: "text-amber-600",
      gradient: "from-amber-500 to-amber-400",
    },
  },
  {
    keywords: ["cotton", "banola", "seed cotton", "phutti"],
    accent: {
      chart: "#A07855",
      chartSoft: "#D4B896",
      chipBg: "bg-earth-100",
      text: "text-earth-700",
      gradient: "from-earth-700 to-earth-500",
    },
  },
  {
    keywords: ["sugar", "sugarcane", "jaggery", "gur", "beet"],
    accent: {
      chart: "#0EA5E9",
      chartSoft: "#BAE6FD",
      chipBg: "bg-info-50",
      text: "text-info-600",
      gradient: "from-info-600 to-info-500",
    },
  },
  {
    keywords: ["potato"],
    accent: {
      chart: "#A07855",
      chartSoft: "#EAD9C5",
      chipBg: "bg-earth-100",
      text: "text-earth-700",
      gradient: "from-earth-700 to-earth-500",
    },
  },
  {
    keywords: ["onion", "garlic", "ginger"],
    accent: {
      chart: "#8B5CF6",
      chartSoft: "#DDD6FE",
      chipBg: "bg-violet-50",
      text: "text-violet-600",
      gradient: "from-violet-600 to-violet-500",
    },
  },
  {
    keywords: ["tomato", "chilli", "chili", "pepper", "capsicum"],
    accent: {
      chart: "#DC2626",
      chartSoft: "#FECACA",
      chipBg: "bg-danger-50",
      text: "text-danger-600",
      gradient: "from-danger-600 to-danger-500",
    },
  },
  {
    keywords: ["mango"],
    accent: {
      chart: "#F59E0B",
      chartSoft: "#FDE68A",
      chipBg: "bg-amber-50",
      text: "text-amber-600",
      gradient: "from-amber-500 to-amber-400",
    },
  },
  {
    keywords: ["apple", "peach", "plum", "apricot", "pear", "loquat", "persimmon"],
    accent: {
      chart: "#E11D48",
      chartSoft: "#FECDD3",
      chipBg: "bg-rose-50",
      text: "text-rose-600",
      gradient: "from-rose-600 to-rose-500",
    },
  },
  {
    keywords: ["orange", "kinnow", "lemon", "citrus", "musambi", "grapefruit"],
    accent: {
      chart: "#F97316",
      chartSoft: "#FED7AA",
      chipBg: "bg-orange-50",
      text: "text-orange-600",
      gradient: "from-orange-500 to-orange-400",
    },
  },
  {
    keywords: ["banana"],
    accent: {
      chart: "#CA8A04",
      chartSoft: "#FEF08A",
      chipBg: "bg-yellow-50",
      text: "text-yellow-600",
      gradient: "from-yellow-600 to-yellow-500",
    },
  },
  {
    keywords: ["gram", "moong", "mash", "masoor", "lentil", "pulse", "peas"],
    accent: {
      chart: "#65A30D",
      chartSoft: "#D9F99D",
      chipBg: "bg-lime-50",
      text: "text-lime-700",
      gradient: "from-lime-600 to-lime-500",
    },
  },
  {
    keywords: ["grapes", "date", "pomegranate", "guava", "jamun", "jaman"],
    accent: {
      chart: "#7C3AED",
      chartSoft: "#EDE9FE",
      chipBg: "bg-violet-50",
      text: "text-violet-600",
      gradient: "from-violet-600 to-violet-500",
    },
  },
];

/** Get the visual accent for a crop name (case-insensitive keywords). */
export function getCropAccent(name: string | null | undefined): CropAccent {
  if (!name) return DEFAULT_ACCENT;
  const lower = name.toLowerCase();
  for (const rule of ACCENT_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.accent;
    }
  }
  return DEFAULT_ACCENT;
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/** Human label for how the representative price was computed. */
export function priceBasisLabel(
  basis: string | null | undefined,
  overview: MarketOverview | null
): string | null {
  switch (basis) {
    case "weighted":
      return "Quantity-weighted average across markets";
    case "average":
      return `Average of ${overview?.markets_reporting ?? 0} markets`;
    case "single":
      return "Single reporting market";
    default:
      return null;
  }
}

/**
 * Pick the default crop for the farmer: the commodity matching one of
 * their active crops (exact, then prefix match), else the first item.
 */
export function pickDefaultCommodity(
  commodities: MarketCommodity[],
  activeCropNames: string[]
): MarketCommodity | null {
  if (commodities.length === 0) return null;
  const crops = activeCropNames
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  if (crops.length > 0) {
    // Exact match first
    for (const crop of crops) {
      const exact = commodities.find(
        (c) => c.name.trim().toLowerCase() === crop
      );
      if (exact) return exact;
    }
    // Then prefix match ("Wheat" matches "Wheat Straw")
    for (const crop of crops) {
      const prefix = commodities.find((c) =>
        c.name.trim().toLowerCase().startsWith(crop)
      );
      if (prefix) return prefix;
    }
  }
  return commodities[0];
}
