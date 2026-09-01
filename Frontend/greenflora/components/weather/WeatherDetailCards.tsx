/**
 * components/weather/WeatherDetailCards.tsx
 *
 * A grid of weather detail cards with visual indicators for
 * humidity, rain chance, wind, cloud cover, UV index, and sunrise/sunset.
 */

import {
  Droplets,
  CloudRain,
  Wind,
  Cloud,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import type { CurrentWeather, DailyForecastEntry } from "@/types/weather";
import {
  getWindDirection,
  formatTime,
  getUVLabel,
} from "@/lib/weatherUtils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface WeatherDetailCardsProps {
  current: CurrentWeather;
  todayForecast: DailyForecastEntry | undefined;
}

export default function WeatherDetailCards({
  current,
  todayForecast,
}: WeatherDetailCardsProps) {
  const uvInfo = todayForecast
    ? getUVLabel(todayForecast.uvIndexMax)
    : null;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
      {/* Humidity */}
      <Card padding="sm" className="animate-gf-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-500">
            <Droplets className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">Humidity</p>
            <p className="mt-0.5 text-xl font-semibold text-neutral-900">
              {current.humidity}%
            </p>
            {/* Visual moisture bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-info-500 transition-all duration-700"
                style={{ width: `${current.humidity}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Rain Chance */}
      <Card padding="sm" className="animate-gf-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-500">
            <CloudRain className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">Rain chance</p>
            <p className="mt-0.5 text-xl font-semibold text-neutral-900">
              {todayForecast?.precipitationProbabilityMax ?? 0}%
            </p>
            {/* Rain probability bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-info-500 transition-all duration-700"
                style={{
                  width: `${todayForecast?.precipitationProbabilityMax ?? 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Wind */}
      <Card padding="sm" className="animate-gf-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <div
              className="animate-gf-wind"
              style={{
                transform: `rotate(${current.windDirection}deg)`,
              }}
            >
              <Wind className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">Wind</p>
            <p className="mt-0.5 text-xl font-semibold text-neutral-900">
              {Math.round(current.windSpeed)}{" "}
              <span className="text-sm font-normal text-neutral-500">km/h</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {getWindDirection(current.windDirection)}
            </p>
          </div>
        </div>
      </Card>

      {/* Cloud Cover */}
      <Card padding="sm" className="animate-gf-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
            <Cloud className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">Cloud cover</p>
            <p className="mt-0.5 text-xl font-semibold text-neutral-900">
              {current.cloudCover}%
            </p>
            {/* Cloud fill bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-neutral-300 transition-all duration-700"
                style={{ width: `${current.cloudCover}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* UV Index */}
      <Card padding="sm" className="animate-gf-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <Sun className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">UV Index</p>
            <p className="mt-0.5 text-xl font-semibold text-neutral-900">
              {todayForecast?.uvIndexMax != null
                ? Math.round(todayForecast.uvIndexMax)
                : "—"}
            </p>
            {uvInfo && (
              <Badge variant={uvInfo.variant} className="mt-1">
                {uvInfo.label}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Sunrise / Sunset */}
      <Card padding="sm" className="animate-gf-fade-in">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <Sunrise className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">Sun</p>
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Sunrise className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-sm font-medium text-neutral-900">
                  {todayForecast ? formatTime(todayForecast.sunrise) : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sunset className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-sm font-medium text-neutral-900">
                  {todayForecast ? formatTime(todayForecast.sunset) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
