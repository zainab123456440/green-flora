/**
 * components/weather/CurrentWeatherHero.tsx
 *
 * The hero section of the weather page showing current conditions.
 * Features a large animated weather icon, prominent temperature,
 * and a gradient background that adapts to the weather condition.
 */

import { MapPin, RefreshCw, Navigation } from "lucide-react";
import type { CurrentWeather } from "@/types/weather";
import type { LocationSource } from "@/Hooks/useLocation";
import { WeatherIcon } from "./WeatherIcons";
import { getWeatherInfo } from "@/lib/weatherUtils";
import Button from "@/components/ui/Button";

interface CurrentWeatherHeroProps {
  current: CurrentWeather;
  /** Always a resolved location name (never null at render time). */
  locationName: string;
  locationSource: LocationSource;
  onRefresh: () => void;
  onChangeLocation: () => void;
}

export default function CurrentWeatherHero({
  current,
  locationName,
  locationSource,
  onRefresh,
  onChangeLocation,
}: CurrentWeatherHeroProps) {
  const weatherInfo = getWeatherInfo(current.weatherCode);
  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${weatherInfo.bgGradient} p-6 sm:p-8`}
    >
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/8" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        {/* Left side — icon + temperature */}
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <WeatherIcon
              category={weatherInfo.category}
              isDay={current.isDay}
              size={96}
            />
          </div>
          <div>
            <p className="text-5xl sm:text-6xl font-bold text-neutral-900 tracking-tight">
              {Math.round(current.temperature)}°
            </p>
            <p className="mt-1 text-lg font-medium text-neutral-700">
              {weatherInfo.label}
            </p>
            <p className="text-sm text-neutral-500">
              Feels like {Math.round(current.feelsLike)}°C
            </p>
          </div>
        </div>

        {/* Right side — location + actions */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          {/* Location indicator — always resolved to a real place name */}
          <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
            <MapPin className="h-3.5 w-3.5 text-primary-600" />
            <span>{locationName}</span>
          </div>

          {/* Location source badge */}
          <span className="text-[11px] text-neutral-400">
            {locationSource === "farmer"
              ? "From your farm profile"
              : locationSource === "device"
                ? "From your device"
                : ""}
          </span>

          <p className="text-sm text-neutral-500">{today}</p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeLocation}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              Change location
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
