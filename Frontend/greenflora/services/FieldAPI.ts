/**
 * services/FieldAPI.ts
 *
 * The single place the frontend talks to the backend's field and
 * crop-cycle endpoints. Reuses the same request pattern as FarmerAPI.
 */

import type {
  Field,
  FieldCreate,
  FieldUpdate,
  CropCycle,
  CropCycleCreate,
  CropCycleUpdate,
  FarmSummary,
} from "@/types/field";
import { getStoredAccessToken } from "@/services/AuthAPI";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 15000;

export class FieldApiError extends Error {
  status: number;
  type: "network" | "timeout" | "validation" | "server" | "unknown";

  constructor(
    message: string,
    status: number,
    type: FieldApiError["type"] = "unknown"
  ) {
    super(message);
    this.name = "FieldApiError";
    this.status = status;
    this.type = type;
  }
}

function classifyError(status: number): FieldApiError["type"] {
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
      throw new FieldApiError(
        detail || response.statusText,
        response.status,
        classifyError(response.status)
      );
    }

    // 204 No Content — return undefined.
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof FieldApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FieldApiError(
        "Request timed out. Please check your connection.",
        408,
        "timeout"
      );
    }

    throw new FieldApiError(
      "Network error. Please check your connection.",
      0,
      "network"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Farm summary
// ---------------------------------------------------------------------------

export function getFarmSummary(): Promise<FarmSummary> {
  return request<FarmSummary>("/api/farm-summary");
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export function listFields(): Promise<Field[]> {
  return request<Field[]>("/api/fields");
}

export function createField(data: FieldCreate): Promise<Field> {
  return request<Field>("/api/fields", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateField(
  fieldId: string,
  updates: FieldUpdate
): Promise<Field> {
  return request<Field>(`/api/fields/${fieldId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function deleteField(fieldId: string): Promise<void> {
  return request<void>(`/api/fields/${fieldId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Crop Cycles
// ---------------------------------------------------------------------------

export function listCropCycles(fieldId: string): Promise<CropCycle[]> {
  return request<CropCycle[]>(`/api/fields/${fieldId}/cycles`);
}

export function createCropCycle(
  fieldId: string,
  data: CropCycleCreate
): Promise<CropCycle> {
  return request<CropCycle>(`/api/fields/${fieldId}/cycles`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCropCycle(
  cycleId: string,
  updates: CropCycleUpdate
): Promise<CropCycle> {
  return request<CropCycle>(`/api/cycles/${cycleId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function deleteCropCycle(cycleId: string): Promise<void> {
  return request<void>(`/api/cycles/${cycleId}`, { method: "DELETE" });
}
