/**
 * services/MarketAPI.ts
 *
 * The single place the frontend talks to the backend's market
 * endpoints. Reuses the same request pattern as FieldAPI.
 *
 * Market endpoints are public (AMIS government reference data),
 * so requests work with or without an auth token.
 */

import type {
  MarketCommoditiesResponse,
  MarketOverview,
} from "@/types/market";
import { getStoredAccessToken } from "@/services/AuthAPI";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 30000;

export class MarketApiError extends Error {
  status: number;
  type: "network" | "timeout" | "validation" | "server" | "unknown";

  constructor(
    message: string,
    status: number,
    type: MarketApiError["type"] = "unknown"
  ) {
    super(message);
    this.name = "MarketApiError";
    this.status = status;
    this.type = type;
  }
}

function classifyError(status: number): MarketApiError["type"] {
  if (status === 0) return "network";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 400 && status < 500) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const authToken = getStoredAccessToken();
    const mergedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      mergedHeaders["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: mergedHeaders,
      signal: controller.signal,
      ...init,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new MarketApiError(
        detail || response.statusText,
        response.status,
        classifyError(response.status)
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof MarketApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new MarketApiError(
        "Request timed out. Please check your connection.",
        408,
        "timeout"
      );
    }

    throw new MarketApiError(
      "Network error. Please check your connection.",
      0,
      "network"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Commodities (crop selector)
// ---------------------------------------------------------------------------

export function getMarketCommodities(): Promise<MarketCommoditiesResponse> {
  return request<MarketCommoditiesResponse>("/api/market/commodities");
}

// ---------------------------------------------------------------------------
// Market overview (single crop)
// ---------------------------------------------------------------------------

export interface MarketOverviewParams {
  commodityId: string;
  /** History window in days (7 / 30 / 90 / 180). */
  days?: number;
  /** Optional market UUID to scope the trend series. */
  marketId?: string | null;
}

export function getMarketOverview(
  params: MarketOverviewParams
): Promise<MarketOverview> {
  const search = new URLSearchParams({
    commodity_id: params.commodityId,
    days: String(params.days ?? 180),
  });
  if (params.marketId) {
    search.set("market_id", params.marketId);
  }
  return request<MarketOverview>(`/api/market/overview?${search.toString()}`);
}
