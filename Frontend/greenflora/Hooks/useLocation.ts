/**
 * Hooks/useLocation.ts
 *
 * Manages the weather page's location resolution:
 *  1. Uses farmer profile coordinates when available.
 *  2. Falls back to browser/device geolocation when the farmer
 *     hasn't set a farm location yet.
 *  3. Reverse-geocodes coordinates to a readable place name using
 *     Nominatim (OpenStreetMap).
 *  4. Exposes a `requestDeviceLocation` action that re-prompts
 *     the browser (used by "Change Location" button).
 *
 * Key design decisions:
 *  - `isResolvingName` is true while reverse geocoding is in flight,
 *    so the page can wait for the name before showing weather data.
 *  - When geocoding fails, `locationName` falls back to a coordinate-
 *    based string rather than a generic "Your area" label.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocode } from "@/services/WeatherAPI";

export type LocationSource = "farmer" | "device" | "none";

interface UseLocationResult {
  latitude: number | null;
  longitude: number | null;
  /** Resolved human-readable location name, or coordinate fallback. */
  locationName: string | null;
  source: LocationSource;
  /** True while geolocation or reverse geocoding is in progress. */
  isLoading: boolean;
  /** True specifically while reverse geocoding is running. */
  isResolvingName: boolean;
  error: string | null;
  /** Re-prompt for device location (used by "Change Location"). */
  requestDeviceLocation: () => void;
}

/** Format coordinates as a rough fallback when geocoding fails. */
function coordsToLabel(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

export function useLocation(
  farmerLat: number | null | undefined,
  farmerLon: number | null | undefined,
  farmerLocationName: string | null | undefined
): UseLocationResult {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [source, setSource] = useState<LocationSource>("none");
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest geocode request to avoid stale results
  const geocodeIdRef = useRef(0);

  // Reverse-geocode and update name
  const resolveName = useCallback(
    async (lat: number, lon: number): Promise<void> => {
      const myId = ++geocodeIdRef.current;
      setIsResolvingName(true);

      try {
        const geo = await reverseGeocode(lat, lon);

        // Only update if this is still the latest request
        if (geocodeIdRef.current !== myId) return;

        if (geo && geo.displayName) {
          setLocationName(geo.displayName);
        } else {
          // Geocoding failed — use coordinate fallback
          setLocationName(coordsToLabel(lat, lon));
        }
      } catch {
        if (geocodeIdRef.current !== myId) return;
        setLocationName(coordsToLabel(lat, lon));
      } finally {
        if (geocodeIdRef.current === myId) {
          setIsResolvingName(false);
        }
      }
    },
    []
  );

  // Request browser geolocation
  const requestDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location services.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    // Clear old name immediately so UI doesn't flash stale data
    setLocationName(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        setSource("device");

        // Reverse-geocode the new coordinates
        await resolveName(lat, lon);
        setIsLoading(false);
      },
      (geoError) => {
        setIsLoading(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            "Location permission was denied. Please enable it in your browser settings, or set your farm location in your profile."
          );
        } else {
          setError("Couldn't determine your location. Please try again.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [resolveName]);

  // Main effect: resolve location on mount
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    // Priority 1: Farmer profile coordinates
    if (farmerLat != null && farmerLon != null) {
      setLatitude(farmerLat);
      setLongitude(farmerLon);
      setSource("farmer");

      // Use farmer's readable name if available, otherwise reverse-geocode
      if (farmerLocationName) {
        setLocationName(farmerLocationName);
        setIsLoading(false);
      } else {
        // Need to resolve name from coordinates
        setIsLoading(true);
        resolveName(farmerLat, farmerLon).then(() => {
          setIsLoading(false);
        });
      }
      return;
    }

    // Priority 2: Browser geolocation
    requestDeviceLocation();
  }, [farmerLat, farmerLon, farmerLocationName, resolveName, requestDeviceLocation]);

  return {
    latitude,
    longitude,
    locationName,
    source,
    isLoading,
    isResolvingName,
    error,
    requestDeviceLocation,
  };
}
