/**
 * lib/weatherUtils.ts
 *
 * Utilities for mapping WMO weather codes to human-readable labels,
 * formatting weather values, and other presentation helpers.
 */

import type { WeatherConditionInfo, WeatherCategory } from "@/types/weather";

/**
 * Map a WMO weather code (0–99) to a human-readable condition.
 * See: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
export function getWeatherInfo(code: number): WeatherConditionInfo {
  const map: Record<number, WeatherConditionInfo> = {
    0: {
      label: "Clear sky",
      category: "clear",
      color: "text-amber-500",
      bgGradient: "from-amber-50 to-primary-50",
    },
    1: {
      label: "Mainly clear",
      category: "clear",
      color: "text-amber-500",
      bgGradient: "from-amber-50 to-primary-50",
    },
    2: {
      label: "Partly cloudy",
      category: "partly_cloudy",
      color: "text-neutral-500",
      bgGradient: "from-neutral-50 to-primary-50",
    },
    3: {
      label: "Overcast",
      category: "cloudy",
      color: "text-neutral-500",
      bgGradient: "from-neutral-100 to-neutral-50",
    },
    45: {
      label: "Foggy",
      category: "fog",
      color: "text-neutral-400",
      bgGradient: "from-neutral-100 to-neutral-50",
    },
    48: {
      label: "Rime fog",
      category: "fog",
      color: "text-neutral-400",
      bgGradient: "from-neutral-100 to-neutral-50",
    },
    51: {
      label: "Light drizzle",
      category: "drizzle",
      color: "text-info-500",
      bgGradient: "from-info-50 to-primary-50",
    },
    53: {
      label: "Moderate drizzle",
      category: "drizzle",
      color: "text-info-500",
      bgGradient: "from-info-50 to-primary-50",
    },
    55: {
      label: "Heavy drizzle",
      category: "drizzle",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    56: {
      label: "Freezing drizzle",
      category: "drizzle",
      color: "text-info-500",
      bgGradient: "from-info-50 to-primary-50",
    },
    57: {
      label: "Freezing drizzle",
      category: "drizzle",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    61: {
      label: "Light rain",
      category: "rain",
      color: "text-info-500",
      bgGradient: "from-info-50 to-primary-50",
    },
    63: {
      label: "Moderate rain",
      category: "rain",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    65: {
      label: "Heavy rain",
      category: "heavy_rain",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    66: {
      label: "Freezing rain",
      category: "rain",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    67: {
      label: "Freezing rain",
      category: "heavy_rain",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    71: {
      label: "Light snow",
      category: "snow",
      color: "text-info-500",
      bgGradient: "from-info-50 to-neutral-50",
    },
    73: {
      label: "Moderate snow",
      category: "snow",
      color: "text-info-500",
      bgGradient: "from-info-100 to-neutral-50",
    },
    75: {
      label: "Heavy snow",
      category: "snow",
      color: "text-info-600",
      bgGradient: "from-info-100 to-neutral-100",
    },
    77: {
      label: "Snow grains",
      category: "snow",
      color: "text-info-500",
      bgGradient: "from-info-50 to-neutral-50",
    },
    80: {
      label: "Light showers",
      category: "rain",
      color: "text-info-500",
      bgGradient: "from-info-50 to-primary-50",
    },
    81: {
      label: "Moderate showers",
      category: "rain",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    82: {
      label: "Heavy showers",
      category: "heavy_rain",
      color: "text-info-600",
      bgGradient: "from-info-100 to-info-50",
    },
    85: {
      label: "Snow showers",
      category: "snow",
      color: "text-info-500",
      bgGradient: "from-info-50 to-neutral-50",
    },
    86: {
      label: "Heavy snow showers",
      category: "snow",
      color: "text-info-600",
      bgGradient: "from-info-100 to-neutral-100",
    },
    95: {
      label: "Thunderstorm",
      category: "thunderstorm",
      color: "text-amber-600",
      bgGradient: "from-amber-50 to-neutral-100",
    },
    96: {
      label: "Thunderstorm with hail",
      category: "thunderstorm",
      color: "text-amber-600",
      bgGradient: "from-amber-50 to-neutral-100",
    },
    99: {
      label: "Severe thunderstorm",
      category: "thunderstorm",
      color: "text-danger-600",
      bgGradient: "from-danger-50 to-neutral-100",
    },
  };

  return (
    map[code] ?? {
      label: "Unknown",
      category: "cloudy" as WeatherCategory,
      color: "text-neutral-500",
      bgGradient: "from-neutral-50 to-neutral-100",
    }
  );
}

/** Convert wind degrees to compass direction label. */
export function getWindDirection(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/** Format an ISO time string to a short time like "6:30 AM". */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format an ISO date string to a short day name like "Mon", "Tue". */
export function formatDayName(isoDate: string, short = true): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-PK", {
    weekday: short ? "short" : "long",
  });
}

/** Return "Today", "Tomorrow", or the day name for a date string. */
export function formatDayLabel(isoDate: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return formatDayName(isoDate, false);
}

/** Format an ISO hour string to just the hour like "2 PM". */
export function formatHour(isoTime: string): string {
  const date = new Date(isoTime);
  return date.toLocaleTimeString("en-PK", {
    hour: "numeric",
    hour12: true,
  });
}

/** Get a human-readable UV index label. */
export function getUVLabel(uvIndex: number): {
  label: string;
  color: string;
  variant: "success" | "warning" | "danger";
} {
  if (uvIndex <= 2) return { label: "Low", color: "text-success-600", variant: "success" };
  if (uvIndex <= 5) return { label: "Moderate", color: "text-amber-600", variant: "warning" };
  if (uvIndex <= 7) return { label: "High", color: "text-amber-600", variant: "warning" };
  if (uvIndex <= 10) return { label: "Very High", color: "text-danger-600", variant: "danger" };
  return { label: "Extreme", color: "text-danger-600", variant: "danger" };
}

/** Get soil moisture label based on volumetric water content (m³/m³). */
export function getSoilMoistureLabel(moisture: number): {
  label: string;
  color: string;
} {
  // Open-Meteo returns soil moisture in m³/m³ (0 to ~0.5)
  if (moisture < 0.1) return { label: "Very dry", color: "text-amber-600" };
  if (moisture < 0.2) return { label: "Dry", color: "text-amber-500" };
  if (moisture < 0.35) return { label: "Moist", color: "text-primary-600" };
  if (moisture < 0.45) return { label: "Wet", color: "text-info-600" };
  return { label: "Saturated", color: "text-info-600" };
}

/** Convert soil moisture (m³/m³) to a percentage for display. */
export function soilMoistureToPercent(moisture: number): number {
  // Approximate: 0.5 m³/m³ = 100% (field capacity varies, but 0.5 is a safe max)
  return Math.min(Math.round(moisture * 200), 100);
}
