/**
 * components/weather/HourlyForecast.tsx
 *
 * Horizontal scrollable strip showing the next 24 hours.
 * Each hour displays time, a small weather icon, temperature,
 * and a rain probability indicator.
 */

import type { HourlyForecastEntry } from "@/types/weather";
import { SmallWeatherIcon } from "./WeatherIcons";
import { formatHour } from "@/lib/weatherUtils";
import Card from "@/components/ui/Card";

interface HourlyForecastProps {
  hourly: HourlyForecastEntry[];
}

export default function HourlyForecast({ hourly }: HourlyForecastProps) {
  if (hourly.length === 0) return null;

  return (
    <Card className="animate-gf-fade-in">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">
        Hourly forecast
      </h2>

      <div className="gf-scrollbar -mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex gap-1 min-w-max">
          {hourly.map((hour, index) => {
            const isNow = index === 0;
            const rainProb = hour.precipitationProbability;

            return (
              <div
                key={hour.time}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 min-w-[64px] transition-colors
                  ${
                    isNow
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-neutral-50"
                  }`}
              >
                {/* Time label */}
                <span
                  className={`text-[11px] font-medium ${
                    isNow ? "text-primary-700" : "text-neutral-500"
                  }`}
                >
                  {isNow ? "Now" : formatHour(hour.time)}
                </span>

                {/* Weather icon */}
                <SmallWeatherIcon code={hour.weatherCode} size={28} />

                {/* Temperature */}
                <span className="text-sm font-semibold text-neutral-900">
                  {Math.round(hour.temperature)}°
                </span>

                {/* Rain probability indicator */}
                <div className="h-6 w-1.5 rounded-full bg-neutral-100 overflow-hidden flex flex-col-reverse">
                  <div
                    className="w-full rounded-full bg-info-500 transition-all duration-500"
                    style={{ height: `${rainProb}%` }}
                  />
                </div>
                {rainProb > 0 && (
                  <span className="text-[9px] text-info-600 font-medium">
                    {rainProb}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
