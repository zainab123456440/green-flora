/**
 * services/farmerApi.ts
 *
 * The single place the frontend talks to the backend's farmer
 * endpoints. Components/hooks should call these functions rather than
 * calling `fetch` directly, so there's one spot to update if the API
 * base URL, error handling, or auth headers ever change.
 */

import type { Farmer, FarmerUpdate, DashboardSummary } from "@/types/farmer";
import { getStoredAccessToken } from "@/services/AuthAPI";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  type: "network" | "timeout" | "validation" | "server" | "unknown";

  constructor(
    message: string,
    status: number,
    type: ApiError["type"] = "unknown"
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
  }
}

function classifyError(status: number): ApiError["type"] {
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
      throw new ApiError(
        detail || response.statusText,
        response.status,
        classifyError(response.status)
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Please check your connection.",
        408,
        "timeout"
      );
    }

    throw new ApiError(
      "Network error. Please check your connection.",
      0,
      "network"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** GET /api/farmer — fetch the current farmer's full profile. */
export function getFarmer(): Promise<Farmer> {
  return request<Farmer>("/api/farmer");
}

/** PUT /api/farmer — save a partial update to the farmer profile. */
export function updateFarmer(updates: FarmerUpdate): Promise<Farmer> {
  return request<Farmer>("/api/farmer", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/** GET /api/dashboard-summary — fetch the lightweight dashboard overview. */
export function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>("/api/dashboard-summary");
}
