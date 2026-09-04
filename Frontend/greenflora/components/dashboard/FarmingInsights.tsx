/**
 * components/dashboard/FarmingInsights.tsx
 *
 * A row of three insight cards at the top of the dashboard: weather,
 * crops, and market. Every sentence is derived from real data that is
 * already loaded on the dashboard (weather API, farm summary, AMIS
 * market prices) — when a source is missing, the card shows a quiet
 * fallback instead of inventing information.
 */

import Link from "next/link";
import { CloudSun, Droplets, MapPin, Sprout, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { WeatherIcon } from "@/components/weather/WeatherIcons";
import { getWeatherInfo } from "@/lib/weatherUtils";
import { formatMarketDate, formatPKRWithUnit } from "@/lib/marketUtils";
import type { MarketCommodity } from "@/types/market";
import type { FarmSummary } from "@/types/field";
import type { WeatherData } from "@/types/weather";

interface FarmingInsightsProps {
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError?: string | null;
  hasLocation: boolean;
  summary: FarmSummary | null;
  commodity: MarketCommodity | null;
  marketLoading: boolean;
  dataAvailable?: boolean;
}

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
    return `Highs of ${Math.round(today.tempMax)}° expected today. Check soil moisture and irrigate early morning or evening if crops look dry.`;
  }
  return `Mild conditions today at ${Math.round(weather.current.temperature)}° with a ${rainChance}% chance of rain — good weather for field work.`;
}

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

function buildMarketInsight(commodity: MarketCommodity | null): string {
  if (!commodity) {
    return "Market prices aren't available right now — they update daily once AMIS data is collected.";
  }
  if (commodity.latest_price == null) {
    return `No recent price recorded for ${commodity.name} yet.`;
  }

  // FIX: Swap "/" for " per " so Google Translate uses "فی" (fee) to prevent RTL formatting bugs
  const price = formatPKRWithUnit(commodity.latest_price, commodity.unit).replace("/", " per ");
  const markets = `${commodity.markets_reporting} ${
    commodity.markets_reporting === 1 ? "market" : "markets"
  }`;
  const date = commodity.latest_date
    ? ` as of ${formatMarketDate(commodity.latest_date)}`
    : "";
  return `${commodity.name} is trading around ${price} across ${markets}${date}.`;
}

function InsightCardShell({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-neutral-200 bg-surface-card p-4 shadow-card transition-all duration-200 hover:border-primary-200 hover:shadow-elevated">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="h-7 w-24 rounded bg-neutral-200 animate-gf-pulse" />
      <div className="h-3.5 w-full rounded bg-neutral-100 animate-gf-pulse" />
      <div className="h-3.5 w-2/3 rounded bg-neutral-100 animate-gf-pulse" />
    </div>
  );
}

function WeatherInsightCard({
  weather,
  weatherLoading,
  weatherError,
  hasLocation,
}: {
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError?: string | null;
  hasLocation: boolean;
}) {
  const insightText =
    weatherLoading && hasLocation ? null : buildWeatherInsight(weather, hasLocation);

  let body: ReactNode;

  if (!hasLocation) {
    body = (
      <div className="flex items-start gap-2.5 py-1">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
        <p className="text-sm leading-relaxed text-neutral-500">
          Set your farm location in your{" "}
          <Link
            href="/profile"
            className="font-medium text-primary-700 hover:underline"
          >
            profile
          </Link>{" "}
          to see local weather.
        </p>
      </div>
    );
  } else if (weatherLoading) {
    body = <InsightSkeleton />;
  } else if (weatherError || !weather) {
    body = (
      <p className="text-sm leading-relaxed text-neutral-500">
        {insightText}
      </p>
    );
  } else {
    const info = getWeatherInfo(weather.current.weatherCode);
    const today = weather.daily[0];

    body = (
      <>
        <div className="flex items-center gap-3">
          <WeatherIcon
            category={info.category}
            isDay={weather.current.isDay}
            size={40}
          />
          <div className="min-w-0">
            <p
              className="text-2xl font-bold tracking-tight text-neutral-900 notranslate"
              translate="no"
            >
              {Math.round(weather.current.temperature)}°
            </p>
            <p className="truncate text-xs text-neutral-500">{info.label}</p>
          </div>
        </div>
        {today && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className="inline-block notranslate" translate="no">
              H {Math.round(today.tempMax)}° - L {Math.round(today.tempMin)}°
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-info-500" />
              {today.precipitationProbabilityMax}% rain
            </span>
          </div>
        )}
        {insightText && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {insightText}
          </p>
        )}
      </>
    );
  }

  return (
    <InsightCardShell icon={<CloudSun className="h-4 w-4" />} title="Weather">
      {body}
    </InsightCardShell>
  );
}

function CropInsightCard({ summary }: { summary: FarmSummary | null }) {
  if (!summary) {
    return (
      <InsightCardShell icon={<Sprout className="h-4 w-4" />} title="Crops">
        <InsightSkeleton />
      </InsightCardShell>
    );
  }

  const insightText = buildFarmInsight(summary);
  const hasFields = summary.total_fields > 0;

  return (
    <InsightCardShell icon={<Sprout className="h-4 w-4" />} title="Crops">
      {hasFields && (
        <p className="text-2xl font-bold tracking-tight text-neutral-900">
          {summary.total_fields} field{summary.total_fields !== 1 ? "s" : ""}
        </p>
      )}
      <p
        className={
          hasFields
            ? "mt-3 text-sm leading-relaxed text-neutral-600"
            : "text-sm leading-relaxed text-neutral-500"
        }
      >
        {insightText}
      </p>
    </InsightCardShell>
  );
}

function MarketInsightCard({
  commodity,
  marketLoading,
  dataAvailable,
}: {
  commodity: MarketCommodity | null;
  marketLoading: boolean;
  dataAvailable: boolean;
}) {
  const insightText = marketLoading ? null : buildMarketInsight(commodity);

  let body: ReactNode;

  if (marketLoading) {
    body = <InsightSkeleton />;
  } else if (!dataAvailable || !commodity) {
    body = (
      <p className="text-sm leading-relaxed text-neutral-500">
        {insightText}
      </p>
    );
  } else {
    const marketsLabel = `${commodity.markets_reporting} ${
      commodity.markets_reporting === 1 ? "market" : "markets"
    }`;

    // FIX: Swap "/" for " per " here as well for the big card numbers
    const safePrice = commodity.latest_price != null
      ? formatPKRWithUnit(commodity.latest_price, commodity.unit).replace("/", " per ")
      : "No recent price";

    body = (
      <>
        <p className="text-xs font-medium text-neutral-500">
          {commodity.name}
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
          {safePrice}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {commodity.latest_date ? formatMarketDate(commodity.latest_date) : "—"}{" "}
          · {marketsLabel} reporting
        </p>
        {insightText && (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {insightText}
          </p>
        )}
      </>
    );
  }

  return (
    <InsightCardShell icon={<TrendingUp className="h-4 w-4" />} title="Market">
      {body}
    </InsightCardShell>
  );
}

export default function FarmingInsights({
  weather,
  weatherLoading,
  weatherError = null,
  hasLocation,
  summary,
  commodity,
  marketLoading,
  dataAvailable = true,
}: FarmingInsightsProps) {
  return (
    <>
      <h2 className="mb-3 text-base font-semibold text-neutral-900">
        Today&apos;s Insight
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <WeatherInsightCard
          weather={weather}
          weatherLoading={weatherLoading}
          weatherError={weatherError}
          hasLocation={hasLocation}
        />
        <CropInsightCard summary={summary} />
        <MarketInsightCard
          commodity={commodity}
          marketLoading={marketLoading}
          dataAvailable={dataAvailable}
        />
      </div>
    </>
  );
}