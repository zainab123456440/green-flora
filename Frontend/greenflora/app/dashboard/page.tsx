/**
 * app/dashboard/page.tsx
 *
 * The dashboard is the farmer's central overview — the Green Flora AI
 * assistant is the heart of the page, framed by glanceable data:
 *
 *   1. Greeting hero (AI-generated, localized, time-aware)
 *   2. Today's Insight — a single block of data-driven insight cards
 *      (weather, market, crop) built from FarmingInsights alone; no
 *      separate Weather/Market summary row above it
 *   3. Green Flora AI assistant — chat + voice, the central experience
 *   4. My Farm snapshot (fields, area, crops, budget)
 *   5. Government farmer support (official helpline from Supabase)
 *
 * Detailed field/crop management lives on My Farm; full forecasts on
 * Weather; full price analysis on Market.
 */

"use client";

import Link from "next/link";
import {
  MapPin,
  Ruler,
  Sprout,
  Wallet,
  LayoutGrid,
  ArrowRight,
  Leaf,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AssistantPanel from "@/components/assistant/AssistantPanel";
import StatCard from "@/components/dashboard/StatCard";
import GovernmentSupportCard from "@/components/dashboard/GovernmentSupportCard";
import FarmingInsights from "@/components/dashboard/FarmingInsights";
import { StatCardSkeleton, CardSkeleton } from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

import { useFarmer } from "@/Hooks/useFarmer";
import { useFields } from "@/Hooks/useFields";
import { useWeather } from "@/Hooks/useWeather";
import { useMarketCommodities } from "@/Hooks/useMarket";
import { useGreeting } from "@/Hooks/useAssistant";
import { pickDefaultCommodity } from "@/lib/marketUtils";

export default function DashboardPage() {
  const {
    farmer,
    isLoading: farmerLoading,
    error: farmerError,
    refresh: refreshFarmer,
  } = useFarmer();
  const { summary, isLoading: fieldsLoading, error: fieldsError } = useFields();

  // AI greeting for the hero — localized and time-of-day aware. Falls
  // back to a static greeting internally, so it can never break the page.
  const {
    greeting: aiGreeting,
    isLoading: greetingLoading,
  } = useGreeting();

  // Weather for the farmer's saved farm location. The dashboard never
  // prompts for device geolocation — the full Weather page handles that.
  const hasFarmLocation =
    farmer?.farm_latitude != null && farmer?.farm_longitude != null;
  const {
    data: weather,
    isLoading: weatherLoading,
  } = useWeather(farmer?.farm_latitude, farmer?.farm_longitude);

  // Market: feature the crop the farmer actually grows, when we know it.
  const {
    commodities,
    isLoading: marketLoading,
  } = useMarketCommodities();
  const activeCropNames = summary
    ? Object.keys(summary.crop_distribution)
    : farmer?.current_crop
      ? [farmer.current_crop]
      : [];
  const featuredCommodity = pickDefaultCommodity(commodities, activeCropNames);

  const isLoading = farmerLoading || fieldsLoading;
  const error = farmerError || fieldsError;
  const refresh = () => {
    refreshFarmer();
  };

  return (
    <AuthGuard>
      <AppShell title="Dashboard">
        {/* Loading */}
        {isLoading && (
          <>
            <div className="mb-6 h-28 rounded-2xl bg-neutral-100 animate-gf-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </>
        )}

        {/* Error */}
        {error && !isLoading && (
          <ErrorState message={error} onRetry={refresh} />
        )}

        {/* Success */}
        {!isLoading && !error && farmer && (
          <div className="animate-gf-fade-in">
            {/* Language Toggle Button */}
            <div className="mb-4 flex justify-end">
              <LanguageSwitcher />
            </div>

            <DashboardHeader
              farmerName={farmer.name}
              greeting={greetingLoading ? null : aiGreeting.greeting}
              isDemo={farmer.is_demo}
            />

            {/* Today's Insight */}
            <section className="mt-6">
              <FarmingInsights
                weather={weather}
                weatherLoading={weatherLoading}
                hasLocation={hasFarmLocation}
                summary={summary}
                commodity={featuredCommodity}
                marketLoading={marketLoading}
              />
            </section>

            {/* Green Flora AI */}
            <section id="assistant" className="mt-6 scroll-mt-24">
              <AssistantPanel />
            </section>

            {/* My Farm snapshot */}
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-4.5 w-4.5 shrink-0 text-primary-600" />
                  <h2 className="truncate text-base font-semibold text-neutral-900">
                    {summary?.farm_name ?? "My Farm"}
                  </h2>
                  {summary?.location && (
                    <span className="hidden truncate text-sm text-neutral-400 sm:inline">
                      · {summary.location}
                    </span>
                  )}
                </div>
                <Link href="/my-farm" className="shrink-0">
                  <Button variant="ghost" size="sm">
                    View My Farm
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Fields"
                  value={summary ? `${summary.total_fields}` : "—"}
                  icon={<LayoutGrid className="h-5 w-5" />}
                />
                <StatCard
                  label="Field Area"
                  value={
                    summary && summary.total_field_area_acres > 0
                      ? `${summary.total_field_area_acres.toFixed(1)} acres`
                      : farmer.farm_area_acres
                        ? `${farmer.farm_area_acres} acres`
                        : "Not set"
                  }
                  icon={<Ruler className="h-5 w-5" />}
                />
                <StatCard
                  label="Crops"
                  value={
                    summary
                      ? `${Object.keys(summary.crop_distribution).length} crop${
                          Object.keys(summary.crop_distribution).length !== 1
                            ? "s"
                            : ""
                        }`
                      : farmer.current_crop ?? "Not set"
                  }
                  icon={<Sprout className="h-5 w-5" />}
                />
                <StatCard
                  label="Budget"
                  value={
                    farmer.budget_pkr
                      ? `PKR ${farmer.budget_pkr.toLocaleString()}`
                      : "Not set"
                  }
                  icon={<Wallet className="h-5 w-5" />}
                />
              </div>
            </section>

            {/* Government Farmer Support */}
            <section id="government-support" className="mt-6 scroll-mt-24">
              <GovernmentSupportCard />
            </section>
          </div>
        )}

        {/* Empty — no farmer data at all */}
        {!isLoading && !error && !farmer && (
          <EmptyState
            icon={<Leaf className="h-5 w-5" />}
            title="No farm profile found"
            description="Complete your farm profile to see your dashboard."
            action={
              <Link href="/profile">
                <Button variant="primary" size="sm">
                  Set up your profile
                </Button>
              </Link>
            }
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}