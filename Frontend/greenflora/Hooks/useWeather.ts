/**
 * Hooks/useWeather.ts
 *
 * Loads weather data from Open-Meteo for the given coordinates.
 * Follows the same loading/error/refresh pattern as useFarmer.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWeatherData } from "@/services/WeatherAPI";
import type { WeatherData } from "@/types/weather";

interface UseWeatherResult {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeather(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (latitude == null || longitude == null) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchWeatherData(latitude, longitude);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load weather data. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}
