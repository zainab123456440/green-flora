/**
 * components/dashboard/MarketSummaryCard.tsx
 *
 * Compact dashboard card showing the latest AMIS price for the crop the
 * farmer actually grows (falling back to the first commodity with data).
 * Deep links to the full Market Intelligence page.
 *
 * All values come from the backend (AMIS-ingested Supabase data) —
 * nothing is hardcoded here.
 */

import { TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import FeatureCard from "@/components/dashboard/FeatureCard";
import { formatMarketDate, formatPKRWithUnit } from "@/lib/marketUtils";
import type { MarketCommodity } from "@/types/market";

interface MarketSummaryCardProps {
  commodity: MarketCommodity | null;
  isLoading: boolean;
  /** False when the AMIS pipeline hasn't ingested any data yet. */
  dataAvailable: boolean;
}

/** Shimmer placeholder while market data loads. */
function MarketSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="h-4 w-24 rounded bg-neutral-200 animate-gf-pulse" />
      <div className="h-7 w-36 max-w-full rounded bg-neutral-200 animate-gf-pulse" />
      <div className="h-3.5 w-44 max-w-full rounded bg-neutral-100 animate-gf-pulse" />
    </div>
  );
}

export default function MarketSummaryCard({
  commodity,
  isLoading,
  dataAvailable,
}: MarketSummaryCardProps) {
  let content: ReactNode;

  if (isLoading) {
    content = <MarketSkeleton />;
  } else if (!dataAvailable || !commodity) {
    content = (
      <div className="flex items-start gap-3 py-1">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
        <p className="text-sm leading-relaxed text-neutral-500">
          No market prices available yet — they appear automatically once
          daily AMIS data is collected.
        </p>
      </div>
    );
  } else {
    const marketsLabel = `${commodity.markets_reporting} ${
      commodity.markets_reporting === 1 ? "market" : "markets"
    }`;

    content = (
      <>
        <p className="text-sm font-medium text-neutral-700">
          {commodity.name}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
          {commodity.latest_price != null
            ? formatPKRWithUnit(commodity.latest_price, commodity.unit)
            : "No recent price"}
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          {commodity.latest_date ? formatMarketDate(commodity.latest_date) : "—"}{" "}
          · {marketsLabel} reporting
        </p>
      </>
    );
  }

  return (
    <FeatureCard
      title="Market Prices"
      icon={<TrendingUp className="h-4.5 w-4.5" />}
      href="/market"
      linkLabel="View market"
    >
      {content}
    </FeatureCard>
  );
}
