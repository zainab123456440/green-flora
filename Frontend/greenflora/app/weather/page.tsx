/**
 * app/weather/page.tsx
 *
 * Weather Intelligence page for Green-Flora.
 * Shows current conditions, forecasts, and farm-environment data
 * using real-time Open-Meteo data for the farmer's location.
 *
 * Location resolution priority:
 *  1. Farmer profile coordinates (reverse-geocoded if no name)
 *  2. Browser/device geolocation (with permission prompt)
 *
 * The page waits for the location name to resolve before showing
 * weather data, so the displayed name always matches the coordinates.
 */

"use client";

import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  CardSkeleton,
  StatCardSkeleton,
} from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

import CurrentWeatherHero from "@/components/weather/CurrentWeatherHero";
import WeatherDetailCards from "@/components/weather/WeatherDetailCards";
import HourlyForecast from "@/components/weather/HourlyForecast";
import DailyForecast from "@/components/weather/DailyForecast";
import SoilSection from "@/components/weather/SoilSection";

import { useFarmer } from "@/Hooks/useFarmer";
import { useWeather } from "@/Hooks/useWeather";
import { useLocation } from "@/Hooks/useLocation";

export default function WeatherPage() {
  const { farmer, isLoading: farmerLoading } = useFarmer();

  // Resolve location: farmer coords → device geolocation
  const {
    latitude,
    longitude,
    locationName,
    source: locationSource,
    isLoading: locationLoading,
    isResolvingName,
    error: locationError,
    requestDeviceLocation,
  } = useLocation(
    farmer?.farm_latitude,
    farmer?.farm_longitude,
    farmer?.location ?? farmer?.farm_name
  );

  // Fetch weather for the resolved coordinates
  const {
    data: weather,
    isLoading: weatherLoading,
    error: weatherError,
    refresh: refreshWeather,
  } = useWeather(latitude, longitude);

  // Consider loading until location name is also resolved
  const isLoading =
    farmerLoading || locationLoading || isResolvingName || weatherLoading;
  const hasCoords = latitude != null && longitude != null;

  return (
    <AuthGuard>
      <AppShell title="Weather">
        {/* Loading state — location or weather fetching */}
        {isLoading && (
          <div className="animate-gf-fade-in space-y-4">
            {/* Location resolving indicator */}
            {(locationLoading || isResolvingName) && (
              <div className="flex items-center gap-3 rounded-card border border-neutral-200 bg-surface-card px-5 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" />
                <p className="text-sm text-neutral-600">
                  {isResolvingName
                    ? "Resolving your location..."
                    : hasCoords
                      ? "Loading weather data..."
                      : "Detecting your location..."}
                </p>
              </div>
            )}
            <CardSkeleton />
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Location error — permission denied or unavailable */}
        {!isLoading && !hasCoords && locationError && (
          <EmptyState
            icon={<Navigation className="h-5 w-5" />}
            title="Location needed"
            description={locationError}
            action={
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={requestDeviceLocation}
                >
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  Use my location
                </Button>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    Set farm location in profile
                  </Button>
                </Link>
              </div>
            }
          />
        )}

        {/* No coordinates at all (no farmer coords, no device permission, no error) */}
        {!isLoading && !hasCoords && !locationError && (
          <EmptyState
            icon={<MapPin className="h-5 w-5" />}
            title="Where is your farm?"
            description="Share your location so we can show accurate weather for your area."
            action={
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={requestDeviceLocation}
                >
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  Use my current location
                </Button>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    Set farm location in profile
                  </Button>
                </Link>
              </div>
            }
          />
        )}

        {/* Weather API error */}
        {!isLoading && hasCoords && weatherError && (
          <ErrorState message={weatherError} onRetry={refreshWeather} />
        )}

        {/* Weather data loaded — location name is always resolved at this point */}
        {!isLoading && weather && locationName && (
          <div className="animate-gf-fade-in space-y-6">
            {/* Current weather hero */}
            <CurrentWeatherHero
              current={weather.current}
              locationName={locationName}
              locationSource={locationSource}
              onRefresh={refreshWeather}
              onChangeLocation={requestDeviceLocation}
            />

            {/* Weather detail cards */}
            <WeatherDetailCards
              current={weather.current}
              todayForecast={weather.daily[0]}
            />

            {/* Hourly forecast */}
            <HourlyForecast hourly={weather.hourly} />

            {/* 7-day forecast */}
            <DailyForecast daily={weather.daily} />

            {/* Farm environment (soil) */}
            <SoilSection soil={weather.soil} />

            {/* Footer attribution */}
            <p className="text-center text-xs text-neutral-400 pb-4">
              Weather data provided by{" "}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Open-Meteo
              </a>
              {" · "}
              Location by{" "}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                OpenStreetMap
              </a>
            </p>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
