/**
 * services/WeatherAPI.ts
 *
 * Calls the free Open-Meteo API (no key required) for weather data.
 * Uses a single request that fetches current, hourly, daily, and soil
 * data all at once to minimise round-trips.
 */

import type { WeatherData, OpenMeteoResponse } from "@/types/weather";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const REQUEST_TIMEOUT_MS = 15000;

/** Result from reverse geocoding. */
export interface GeocodedLocation {
  /** Best locality name (village, suburb, town, or city). */
  locality: string;
  /** District / county / tehsil when available. */
  district: string | null;
  /** Province / state. */
  province: string | null;
  /** Country. */
  country: string | null;
  /** Pre-formatted display string. */
  displayName: string;
}

/**
 * Reverse-geocode coordinates to a readable place name using Nominatim
 * (OpenStreetMap). Free, no API key required.
 *
 * Returns null if the lookup fails completely.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedLocation | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "json",
      "accept-language": "en",
      zoom: "14", // locality-level detail
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      signal: controller.signal,
      headers: {
        // Nominatim requires a User-Agent header
        "User-Agent": "GreenFlora/1.0 (smart-agriculture-platform)",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.address) return null;

    return parseNominatimAddress(data.address, data.display_name);
  } catch {
    return null;
  }
}

/**
 * Parse a Nominatim `address` object into a clean GeocodedLocation.
 *
 * Nominatim returns different address fields depending on the area:
 *  - village, suburb, hamlet, town, city, municipality
 *  - county, subdistrict, city_district, state_district
 *  - state, country
 *
 * We pick the most specific locality name available, then the
 * province/state as a broader region identifier.
 */
function parseNominatimAddress(
  addr: Record<string, string>,
  displayName?: string
): GeocodedLocation {
  // Pick the best locality: most specific → least specific
  const locality =
    addr.village ||
    addr.suburb ||
    addr.hamlet ||
    addr.town ||
    addr.city ||
    addr.municipality ||
    addr.county ||
    "";

  // District / tehsil / county level
  const district =
    addr.subdistrict ||
    addr.county ||
    addr.city_district ||
    addr.state_district ||
    null;

  // Province / state
  const province = addr.state || null;
  const country = addr.country || null;

  // Build a clean display name: "Locality, Province"
  // Avoid duplicating if locality === province
  const parts: string[] = [];
  if (locality) parts.push(locality);
  if (province && province !== locality) parts.push(province);
  else if (!province && country && country !== locality) parts.push(country);

  const formatted = parts.length > 0 ? parts.join(", ") : (displayName ?? (locality || ""));

  return {
    locality,
    district,
    province,
    country,
    displayName: formatted,
  };
}

export class WeatherApiError extends Error {
  type: "network" | "timeout" | "server" | "unknown";

  constructor(message: string, type: WeatherApiError["type"] = "unknown") {
    super(message);
    this.name = "WeatherApiError";
    this.type = type;
  }
}

/**
 * Fetch a complete weather bundle for the given coordinates.
 * Throws WeatherApiError on failure.
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    // Current conditions
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
      "is_day",
    ].join(","),
    // Hourly — next 24 h
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    // Daily — 7-day forecast
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_sum",
      "precipitation_probability_max",
    ].join(","),
    // Soil
    soil_temperature: "0cm",
    soil_moisture: "0-7cm",
    // Limit hourly to 24 entries starting from the current hour
    forecast_hours: "24",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPEN_METEO_URL}?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new WeatherApiError(
        detail || "Failed to fetch weather data",
        "server"
      );
    }

    const raw: OpenMeteoResponse = await response.json();
    return parseOpenMeteoResponse(raw);
  } catch (err) {
    if (err instanceof WeatherApiError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new WeatherApiError(
        "Weather request timed out. Please try again.",
        "timeout"
      );
    }

    throw new WeatherApiError(
      "Couldn't reach the weather service. Check your internet connection.",
      "network"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Transform the raw Open-Meteo response into our clean WeatherData shape. */
function parseOpenMeteoResponse(raw: OpenMeteoResponse): WeatherData {
  const { current, hourly, daily } = raw;

  // Current
  const currentWeather = {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    cloudCover: current.cloud_cover,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    isDay: current.is_day === 1,
  };

  // Hourly (up to 24 entries)
  const hourlyForecast = hourly.time.map((time, i) => ({
    time,
    temperature: hourly.temperature_2m[i],
    precipitationProbability: hourly.precipitation_probability[i],
    precipitation: hourly.precipitation[i],
    weatherCode: hourly.weather_code[i],
    windSpeed: hourly.wind_speed_10m[i],
  }));

  // Daily (7 entries)
  const dailyForecast = daily.time.map((date, i) => ({
    date,
    weatherCode: daily.weather_code[i],
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
    uvIndexMax: daily.uv_index_max[i],
    precipitationSum: daily.precipitation_sum[i],
    precipitationProbabilityMax: daily.precipitation_probability_max[i],
  }));

  // Soil — use the latest available reading; null if missing
  const soilTemp =
    raw.soil_temperature_0cm?.soil_temperature_0cm;
  const soilMoist =
    raw.soil_moisture_0_to_7cm?.soil_moisture_0_to_7cm;

  const lastValid = (arr: number[] | undefined): number | null => {
    if (!arr || arr.length === 0) return null;
    const last = arr[arr.length - 1];
    return last != null && !Number.isNaN(last) ? last : null;
  };

  const soil = {
    temperature: lastValid(soilTemp),
    moisture: lastValid(soilMoist),
  };

  return {
    current: currentWeather,
    hourly: hourlyForecast,
    daily: dailyForecast,
    soil,
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
  };
}
