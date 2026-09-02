/**
 * app/market/page.tsx
 *
 * Market Intelligence page for Green-Flora.
 *
 * Shows AMIS wholesale price intelligence for the selected crop:
 * current price + market signal, summary cards, interactive price
 * trend, market comparison, arrivals distribution, and short
 * farmer-friendly insights.
 *
 * Every number on this page comes from the Supabase AMIS tables via
 * the backend /api/market endpoints — no fabricated data.  Crops with
 * limited or missing history get honest empty states instead of
 * misleading charts.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { Store, TrendingUp } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import Card from "@/components/ui/Card";
import {
  CardSkeleton,
  StatCardSkeleton,
} from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Select from "@/components/ui/Select";

import CropSelector from "@/components/market/CropSelector";
import MarketSummaryCards from "@/components/market/MarketSummaryCards";
import PriceTrendChart from "@/components/market/PriceTrendChart";
import MarketComparisonChart from "@/components/market/MarketComparisonChart";
import MarketDistributionCard from "@/components/market/MarketDistributionCard";
import FarmerInsights from "@/components/market/FarmerInsights";

import { useFields } from "@/Hooks/useFields";
import {
  useMarketCommodities,
  useMarketOverview,
} from "@/Hooks/useMarket";
import { pickDefaultCommodity } from "@/lib/marketUtils";

export default function MarketPage() {
  const {
    commodities,
    dataAvailable,
    isLoading: commoditiesLoading,
    error: commoditiesError,
    refresh: refreshCommodities,
  } = useMarketCommodities();

  // Farmer's active crops — used only to pre-select the most relevant
  // commodity.  Failures fall back to the first crop in the list.
  const { summary: farmSummary } = useFields();

  const [selectedCommodityId, setSelectedCommodityId] = useState<
    string | null
  >(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");

  // Default crop: the farmer's active crop when it has AMIS prices,
  // otherwise the first commodity.  Derived so it can settle once farm
  // data arrives; a manual selection always takes precedence.
  const activeCrops = useMemo(
    () =>
      (farmSummary?.fields ?? [])
        .map((f) => f.active_crop_cycle?.crop_name)
        .filter((n): n is string => Boolean(n)),
    [farmSummary]
  );
  const defaultCommodity = useMemo(
    () => pickDefaultCommodity(commodities, activeCrops),
    [commodities, activeCrops]
  );
  const effectiveCommodityId =
    selectedCommodityId ?? defaultCommodity?.id ?? null;

  // Selecting a crop resets the market filter, since market options
  // belong to the selected crop.
  const handleCropChange = useCallback((id: string) => {
    setSelectedCommodityId(id);
    setSelectedMarketId("");
  }, []);

  const {
    overview,
    isLoading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useMarketOverview(
    effectiveCommodityId,
    selectedMarketId || null
  );

  const trendMarketName = useMemo(() => {
    if (!selectedMarketId || !overview) return null;
    return (
      overview.market_comparison.find(
        (m) => m.market_id === selectedMarketId
      )?.name ?? null
    );
  }, [selectedMarketId, overview]);

  const marketOptions = useMemo(
    () => [
      { value: "", label: "All markets (average)" },
      ...(overview?.market_comparison ?? []).map((m) => ({
        value: m.market_id,
        label: m.name,
      })),
    ],
    [overview]
  );

  const showOverviewLoading = overviewLoading && !overview;

  return (
    <AuthGuard>
      <AppShell title="Market">
        {/* ---------------------------------------------------------------
            Commodities list states
        ---------------------------------------------------------------- */}
        {commoditiesLoading && (
          <div className="animate-gf-fade-in space-y-4">
            <CardSkeleton />
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {!commoditiesLoading && commoditiesError && (
          <ErrorState
            message={commoditiesError}
            onRetry={refreshCommodities}
          />
        )}

        {!commoditiesLoading &&
          !commoditiesError &&
          (!dataAvailable || commodities.length === 0) && (
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="No market prices yet"
              description="No AMIS market data has been collected yet. Daily prices appear automatically once the data pipeline runs — usually by mid-morning."
              action={
                <button
                  onClick={refreshCommodities}
                  className="text-xs font-medium text-primary-700 hover:underline"
                >
                  Check again
                </button>
              }
            />
          )}

        {/* ---------------------------------------------------------------
            Market Intelligence
        ---------------------------------------------------------------- */}
        {!commoditiesLoading && !commoditiesError && commodities.length > 0 && (
          <div className="animate-gf-fade-in space-y-6">
            {/* Filter bar */}
            <Card padding="sm">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <CropSelector
                  commodities={commodities}
                  value={effectiveCommodityId}
                  onChange={handleCropChange}
                />
                <Select
                  id="market-filter"
                  label="Market"
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  options={marketOptions}
                />
              </div>
            </Card>

            {/* Overview loading */}
            {showOverviewLoading && (
              <div className="space-y-4">
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                  ))}
                </div>
                <CardSkeleton />
                <CardSkeleton />
              </div>
            )}

            {/* Overview error */}
            {!showOverviewLoading && overviewError && (
              <ErrorState message={overviewError} onRetry={refreshOverview} />
            )}

            {/* Overview loaded */}
            {!showOverviewLoading && !overviewError && overview && (
              <>
                {/* 1. Summary cards (price, change, signal, high/low, spread) */}
                <MarketSummaryCards overview={overview} />

                {/* 2. Interactive price trend */}
                <PriceTrendChart
                  overview={overview}
                  trendMarketName={trendMarketName}
                />

                {/* 3. Market comparison + distribution */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <MarketComparisonChart overview={overview} />
                  <MarketDistributionCard overview={overview} />
                </div>

                {/* 4. Farmer insights */}
                <FarmerInsights overview={overview} />
              </>
            )}
          </div>
        )}

        {/* Attribution */}
        {commodities.length > 0 && (
          <p className="mt-6 pb-4 text-center text-xs text-neutral-400">
            <Store className="mr-1 inline h-3 w-3" />
            Market data from{" "}
            <a
              href="http://www.amis.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              AMIS Punjab
            </a>{" "}
            (Punjab Agriculture Marketing), updated daily.
          </p>
        )}
      </AppShell>
    </AuthGuard>
  );
}
