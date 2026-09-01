/**
 * types/market.ts
 *
 * TypeScript shapes for the Market Intelligence feature.
 * Mirrors the backend schemas in Backend/schemas/market.py.
 * All values originate from the AMIS-ingested Supabase data —
 * fields are null/empty when the underlying data is missing.
 */

/** One selectable crop with its latest known price snapshot. */
export interface MarketCommodity {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  /** Most recent date (ISO) this crop had any reported price. */
  latest_date: string | null;
  /** Representative price (FQP-based) on latest_date. */
  latest_price: number | null;
  /** How many markets reported a price on latest_date. */
  markets_reporting: number;
}

/** Response of GET /api/market/commodities. */
export interface MarketCommoditiesResponse {
  commodities: MarketCommodity[];
  total: number;
  /** False when the AMIS pipeline has not ingested any data yet. */
  data_available: boolean;
}

/** Price of one crop in one market on the latest date. */
export interface MarketComparisonEntry {
  market_id: string;
  name: string;
  price: number;
  min_price: number | null;
  max_price: number | null;
  quantity: number | null;
  date: string | null;
}

/** One point of the daily price trend series. */
export interface MarketTrendPoint {
  date: string;
  price: number;
}

/** Share of total arrivals (quantity) for one market. */
export interface MarketDistributionEntry {
  market_id: string;
  name: string;
  quantity: number;
  share_pct: number;
}

/** Arrivals distribution across markets for the latest date. */
export interface MarketDistribution {
  entries: MarketDistributionEntry[];
  total_quantity: number;
}

/** Simple data-driven price signal. */
export type MarketSignal =
  | "rising"
  | "falling"
  | "stable"
  | "insufficient_data";

/** How the representative current price was derived. */
export type PriceBasis = "weighted" | "average" | "single" | "unknown";

/** Response of GET /api/market/overview. */
export interface MarketOverview {
  commodity_id: string;
  commodity_name: string;
  category: string | null;
  /** Price unit, e.g. "Rs/100Kg". */
  unit: string | null;

  // Data coverage
  latest_date: string | null;
  first_date: string | null;
  /** Number of distinct dates with price data in the fetched window. */
  days_of_data: number;
  markets_reporting: number;

  // Summary cards
  current_price: number | null;
  price_basis: PriceBasis;
  change_pct: number | null;
  change_period_days: number | null;
  signal: MarketSignal;
  highest_market: MarketComparisonEntry | null;
  lowest_market: MarketComparisonEntry | null;
  spread_abs: number | null;
  spread_pct: number | null;

  // Charts
  trend: MarketTrendPoint[];
  /** Market the trend is scoped to; null means all-market average. */
  trend_market_id: string | null;
  market_comparison: MarketComparisonEntry[];
  distribution: MarketDistribution | null;

  // Farmer insights
  insights: string[];
}

/** Available time-period filters for the trend chart. */
export type MarketPeriod = "7D" | "30D" | "3M" | "6M";

/** Number of days each period filter spans (matches backend window). */
export const PERIOD_DAYS: Record<MarketPeriod, number> = {
  "7D": 7,
  "30D": 30,
  "3M": 90,
  "6M": 180,
};
