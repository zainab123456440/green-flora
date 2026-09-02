/**
 * services/SupportAPI.ts
 *
 * The single place the frontend talks to the backend's government
 * support endpoint. Reuses the same request pattern as MarketAPI.
 *
 * Government support contact data is public reference information,
 * so requests work with or without an auth token.
 */

import type {
  GovernmentSupportResponse,
} from "@/types/support";
import { getStoredAccessToken } from "@/services/AuthAPI";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 30000;

export class SupportApiError extends Error {
  status: number;
  type: "network" | "timeout" | "validation" | "server" | "unknown";

  constructor(
    message: string,
    status: number,
    type: SupportApiError["type"] = "unknown"
  ) {
    super(message);
    this.name = "SupportApiError";
    this.status = status;
    this.type = type;
  }
}

function classifyError(status: number): SupportApiError["type"] {
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
      throw new SupportApiError(
        detail || response.statusText,
        response.status,
        classifyError(response.status)
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof SupportApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SupportApiError(
        "Request timed out. Please check your connection.",
        408,
        "timeout"
      );
    }

    throw new SupportApiError(
      "Network error. Please check your connection.",
      0,
      "network"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Government support (dashboard card)
// ---------------------------------------------------------------------------

export function getGovernmentSupport(): Promise<GovernmentSupportResponse> {
  return request<GovernmentSupportResponse>("/api/support/government");
}
