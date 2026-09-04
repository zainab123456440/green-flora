/**
 * components/dashboard/WeatherSummaryCard.tsx
 *
 * Compact dashboard card with the current weather at the farmer's saved
 * farm location, plus today's high/low and rain chance. Deep links to
 * the full Weather Intelligence page.
 */

import Link from "next/link";
import { CloudSun, Droplets, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import FeatureCard from "@/components/dashboard/FeatureCard";
import { WeatherIcon } from "@/components/weather/WeatherIcons";
import { getWeatherInfo } from "@/lib/weatherUtils";
import type { WeatherData } from "@/types/weather";

interface WeatherSummaryCardProps {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  hasLocation: boolean;
}

function WeatherSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 shrink-0 rounded-full bg-neutral-100 animate-gf-pulse" />
      <div className="space-y-2">
        <div className="h-7 w-20 rounded bg-neutral-200 animate-gf-pulse" />
        <div className="h-4 w-28 rounded bg-neutral-100 animate-gf-pulse" />
      </div>
    </div>
  );
}

export default function WeatherSummaryCard({
  weather,
  isLoading,
  error,
  hasLocation,
}: WeatherSummaryCardProps) {
  let content: ReactNode;

  if (!hasLocation) {
    content = (
      <div className="flex items-start gap-3 py-1">
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
  } else if (isLoading) {
    content = <WeatherSkeleton />;
  } else if (error || !weather) {
    content = (
      <div className="flex items-start gap-3 py-1">
        <CloudSun className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
        <p className="text-sm leading-relaxed text-neutral-500">
          Weather is unavailable right now.{" "}
          <Link
            href="/weather"
            className="font-medium text-primary-700 hover:underline"
          >
            Open the weather page
          </Link>{" "}
          to retry.
        </p>
      </div>
    );
  } else {
    const info = getWeatherInfo(weather.current.weatherCode);
    const today = weather.daily[0];

    content = (
      <>
        <div className="flex items-center gap-4">
          <WeatherIcon
            category={info.category}
            isDay={weather.current.isDay}
            size={52}
          />
          <div className="min-w-0">
            {/* Removed the 'C', just kept the degree symbol. 'notranslate' keeps the layout safe */}
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 notranslate">
              {Math.round(weather.current.temperature)}°
            </p>
            <p className="truncate text-sm text-neutral-500">{info.label}</p>
          </div>
        </div>
        {today && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            {/* Replaced the dot with a dash, kept just the degree symbols */}
            <span className="inline-block notranslate">
              H {Math.round(today.tempMax)}° - L {Math.round(today.tempMin)}°
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-info-500" />
              {today.precipitationProbabilityMax}% rain chance
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <FeatureCard
      title="Weather"
      icon={<CloudSun className="h-4.5 w-4.5" />}
      href="/weather"
      linkLabel="View forecast"
    >
      {content}
    </FeatureCard>
  );
}