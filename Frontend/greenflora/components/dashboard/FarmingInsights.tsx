/**
 * components/dashboard/FarmingInsights.tsx
 *
 * A small row of three insight cards at the bottom of the dashboard:
 * weather, crops, and market. Every sentence is derived from real data
 * that is already loaded on the dashboard (weather API, farm summary,
 * AMIS market prices) — when a source is missing, the card shows a
 * quiet fallback instead of inventing information.
 */

import { CloudSun, Sprout, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { formatMarketDate, formatPKRWithUnit } from "@/lib/marketUtils";
import type { MarketCommodity } from "@/types/market";
import type { FarmSummary } from "@/types/field";
import type { WeatherData } from "@/types/weather";

interface FarmingInsightsProps {
  weather: WeatherData | null;
  weatherLoading: boolean;
  /** True when the farmer has saved farm coordinates. */
  hasLocation: boolean;
  summary: FarmSummary | null;
  commodity: MarketCommodity | null;
  marketLoading: boolean;
}

/**
 * Weather insight — converts today's forecast into a soft, actionable
 * note. Rain probability and high temperatures are the two signals
 * farmers most need to plan irrigation and spraying around.
 */
function buildWeatherInsight(
  weather: WeatherData | null,
  hasLocation: boolean
): string {
  if (!hasLocation) {
    return "Set your farm location in your profile to get weather insights for your area.";
  }
  if (!weather) {
    return "Weather data is unavailable right now — check again later.";
  }

  const today = weather.daily[0];
  const rainChance = today?.precipitationProbabilityMax ?? 0;

  if (rainChance >= 50) {
    return `Rain is likely today (${rainChance}% chance). You can hold off irrigation, and consider delaying any spraying until it passes.`;
  }
  if (today && today.tempMax >= 35) {
    return `Highs of ${Math.round(today.tempMax)}°C expected today. Check soil moisture and irrigate early morning or evening if crops look dry.`;
  }
  return `Mild conditions today at ${Math.round(weather.current.temperature)}°C with a ${rainChance}% chance of rain — good weather for field work.`;
}

/** Crop/farm insight — what is growing where, from the field summary. */
function buildFarmInsight(summary: FarmSummary | null): string {
  if (!summary) {
    return "Your farm details will appear here once your profile loads.";
  }
  if (summary.total_fields === 0) {
    return "You haven't added any fields yet. Add your first field in My Farm to start tracking crops.";
  }

  const fieldsLabel = `${summary.total_fields} field${
    summary.total_fields !== 1 ? "s" : ""
  }`;
  const areaLabel =
    summary.total_field_area_acres > 0
      ? ` (${summary.total_field_area_acres.toFixed(1)} acres)`
      : "";
  const crops = Object.keys(summary.crop_distribution);

  if (crops.length > 0) {
    const cropList =
      crops.length <= 2
        ? crops.join(" and ")
        : `${crops.slice(0, 2).join(", ")} and ${crops.length - 2} more`;
    return `You are growing ${cropList} across ${fieldsLabel}${areaLabel}.`;
  }
  return `${fieldsLabel} recorded${areaLabel}, with no active crop cycle yet. Add a crop cycle in My Farm to track growth.`;
}

/** Market insight — latest price signal for the farmer's crop. */
function buildMarketInsight(commodity: MarketCommodity | null): string {
  if (!commodity) {
    return "Market prices aren't available right now — they update daily once AMIS data is collected.";
  }
  if (commodity.latest_price == null) {
    return `No recent price recorded for ${commodity.name} yet.`;
  }

  const price = formatPKRWithUnit(commodity.latest_price, commodity.unit);
  const markets = `${commodity.markets_reporting} ${
    commodity.markets_reporting === 1 ? "market" : "markets"
  }`;
  const date = commodity.latest_date
    ? ` as of ${formatMarketDate(commodity.latest_date)}`
    : "";
  return `${commodity.name} is trading around ${price} across ${markets}${date}.`;
}

function InsightCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string | null;
}) {
  return (
    <div className="rounded-card border border-neutral-200 bg-surface-card p-4 shadow-card transition-all duration-200 hover:border-primary-200 hover:shadow-elevated">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
      {text ? (
        <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
          {text}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-full rounded bg-neutral-100 animate-gf-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-neutral-100 animate-gf-pulse" />
        </div>
      )}
    </div>
  );
}

export default function FarmingInsights({
  weather,
  weatherLoading,
  hasLocation,
  summary,
  commodity,
  marketLoading,
}: FarmingInsightsProps) {
  // While a source is still loading, show a shimmer instead of text.
  const weatherText =
    weatherLoading && hasLocation ? null : buildWeatherInsight(weather, hasLocation);
  const farmText = summary ? buildFarmInsight(summary) : null;
  const marketText = marketLoading ? null : buildMarketInsight(commodity);

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">
        Today&apos;s insights
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={<CloudSun className="h-4 w-4" />}
          title="Weather"
          text={weatherText}
        />
        <InsightCard
          icon={<Sprout className="h-4 w-4" />}
          title="Crops"
          text={farmText}
        />
        <InsightCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="Market"
          text={marketText}
        />
      </div>
    </section>
  );
}
