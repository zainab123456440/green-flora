/**
 * services/CropDoctorAPI.ts
 *
 * Calls the backend Crop Doctor endpoint for image analysis.
 * The image is sent as multipart/form-data; the Gemini API key
 * stays on the backend and is never exposed here.
 */

import type { CropDoctorResponse } from "@/types/cropDoctor";
import { getStoredAccessToken } from "@/services/AuthAPI";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 60000; // 60s — Gemini can be slow

export class CropDoctorApiError extends Error {
  status: number;
  type: "network" | "timeout" | "validation" | "server" | "unknown";

  constructor(
    message: string,
    status: number,
    type: CropDoctorApiError["type"] = "unknown"
  ) {
    super(message);
    this.name = "CropDoctorApiError";
    this.status = status;
    this.type = type;
  }
}

function classifyError(status: number): CropDoctorApiError["type"] {
  if (status === 0) return "network";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 400 && status < 500) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

/**
 * Send a crop image to the backend for Gemini-powered analysis.
 *
 * @param file - The image File object (JPEG/PNG/WebP).
 * @returns The full CropDoctorResponse from the backend.
 */
export async function analyseCropImage(
  file: File
): Promise<CropDoctorResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const authToken = getStoredAccessToken();
    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    // Do NOT set Content-Type — FormData sets it with the correct boundary.

    const response = await fetch(`${API_BASE_URL}/api/crop-doctor/analyse`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // Ignore parse errors for error responses
      }
      throw new CropDoctorApiError(
        detail,
        response.status,
        classifyError(response.status)
      );
    }

    return (await response.json()) as CropDoctorResponse;
  } catch (err) {
    if (err instanceof CropDoctorApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new CropDoctorApiError(
        "Analysis timed out. Please try again with a smaller image.",
        408,
        "timeout"
      );
    }

    throw new CropDoctorApiError(
      "Couldn't reach the Crop Doctor service. Check your internet connection.",
      0,
      "network"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
