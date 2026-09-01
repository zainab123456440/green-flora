/**
 * Hooks/useMarket.ts
 *
 * Loads AMIS market data from the backend for the Market
 * Intelligence page. Follows the same loading/error/refresh pattern
 * as useWeather and useFields.
 *
 * The overview is fetched once per (crop, market filter) with the
 * maximum 180-day window; the UI slices 7D/30D/3M/6M client-side so
 * period switching is instant.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMarketCommodities,
  getMarketOverview,
} from "@/services/MarketAPI";
import type {
  MarketCommodity,
  MarketOverview,
} from "@/types/market";

interface UseMarketCommoditiesResult {
  commodities: MarketCommodity[];
  dataAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMarketCommodities(): UseMarketCommoditiesResult {
  const [commodities, setCommodities] = useState<MarketCommodity[]>([]);
  const [dataAvailable, setDataAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMarketCommodities();
      setCommodities(result.commodities);
      setDataAvailable(result.data_available);
    } catch {
      setError("Couldn't load market crops. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    commodities,
    dataAvailable,
    isLoading,
    error,
    refresh: load,
  };
}

interface UseMarketOverviewResult {
  overview: MarketOverview | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// A finished fetch for one (crop, market) filter pair.
interface OverviewResult {
  key: string;
  overview: MarketOverview | null;
  error: string | null;
}

export function useMarketOverview(
  commodityId: string | null,
  marketId: string | null
): UseMarketOverviewResult {
  // Identifies the current (crop, market) filter pair.
  const key = commodityId ? `${commodityId}|${marketId ?? "all"}` : "";

  const [result, setResult] = useState<OverviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Guards against out-of-order responses when filters change quickly.
  const requestIdRef = useRef(0);

  // Only expose the result that belongs to the current filters so the
  // UI shows skeletons instead of the previous crop's numbers.
  const isCurrent = result !== null && result.key === key;
  const overview = isCurrent ? result.overview : null;
  const error = isCurrent ? result.error : null;

  const load = useCallback(async () => {
    if (!commodityId) {
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const fetched = await getMarketOverview({
        commodityId,
        days: 180,
        marketId,
      });
      if (requestId !== requestIdRef.current) return; // superseded
      setResult({ key, overview: fetched, error: null });
    } catch {
      if (requestId !== requestIdRef.current) return; // superseded
      setResult({
        key,
        overview: null,
        error: "Couldn't load market data for this crop. Please try again.",
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [commodityId, key, marketId]);

  useEffect(() => {
    load();
  }, [load]);

  return { overview, isLoading, error, refresh: load };
}
