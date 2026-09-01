/**
 * components/weather/DailyForecast.tsx
 *
 * 7-day forecast displayed as a vertical list.
 * Each row shows day name, weather icon, min-max temperature bar,
 * and precipitation probability badge.
 */

import { Droplets } from "lucide-react";
import type { DailyForecastEntry } from "@/types/weather";
import { SmallWeatherIcon } from "./WeatherIcons";
import { formatDayLabel, getWeatherInfo } from "@/lib/weatherUtils";
import Card from "@/components/ui/Card";

interface DailyForecastProps {
  daily: DailyForecastEntry[];
}

export default function DailyForecast({ daily }: DailyForecastProps) {
  if (daily.length === 0) return null;

  // Find global min/max across all days for the temperature bar range
  const globalMin = Math.min(...daily.map((d) => d.tempMin));
  const globalMax = Math.max(...daily.map((d) => d.tempMax));
  const tempRange = globalMax - globalMin || 1;

  return (
    <Card className="animate-gf-fade-in">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">
        7-day forecast
      </h2>

      <div className="space-y-1">
        {daily.map((day, index) => {
          const isToday = index === 0;
          const weatherInfo = getWeatherInfo(day.weatherCode);

          // Calculate bar positions
          const leftPercent = ((day.tempMin - globalMin) / tempRange) * 100;
          const widthPercent =
            ((day.tempMax - day.tempMin) / tempRange) * 100;

          return (
            <div
              key={day.date}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors
                ${isToday ? "bg-primary-50/60" : "hover:bg-neutral-50"}`}
            >
              {/* Day name */}
              <span
                className={`w-24 shrink-0 text-sm ${
                  isToday
                    ? "font-semibold text-primary-700"
                    : "font-medium text-neutral-700"
                }`}
              >
                {formatDayLabel(day.date, index)}
              </span>

              {/* Weather icon */}
              <div className="shrink-0" title={weatherInfo.label}>
                <SmallWeatherIcon code={day.weatherCode} size={28} />
              </div>

              {/* Min temp */}
              <span className="w-10 shrink-0 text-right text-sm text-neutral-500">
                {Math.round(day.tempMin)}°
              </span>

              {/* Temperature bar */}
              <div className="relative mx-2 h-2 flex-1 rounded-full bg-neutral-100">
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(widthPercent, 8)}%`,
                    background: `linear-gradient(to right, #93C5FD, #F59E0B)`,
                  }}
                />
              </div>

              {/* Max temp */}
              <span className="w-10 shrink-0 text-sm font-medium text-neutral-900">
                {Math.round(day.tempMax)}°
              </span>

              {/* Rain probability */}
              <div className="flex w-14 shrink-0 items-center justify-end gap-1">
                {day.precipitationProbabilityMax > 0 && (
                  <>
                    <Droplets className="h-3 w-3 text-info-500" />
                    <span className="text-xs text-info-600 font-medium">
                      {day.precipitationProbabilityMax}%
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
