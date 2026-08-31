/**
 * types/weather.ts
 *
 * TypeScript shapes for Open-Meteo weather data.
 * Maps the raw API response to clean, typed interfaces used
 * throughout the Green-Flora weather feature.
 */

/** Current weather conditions at the farm location. */
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
}

/** A single hour in the 24-hour forecast. */
export interface HourlyForecastEntry {
  time: string;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
}

/** A single day in the 7-day forecast. */
export interface DailyForecastEntry {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
}

/** Soil conditions at the farm location. */
export interface SoilData {
  temperature: number;
  moisture: number;
}

/** Complete weather data bundle for the farm. */
export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecastEntry[];
  daily: DailyForecastEntry[];
  soil: SoilData;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** Human-readable weather condition info derived from WMO code. */
export interface WeatherConditionInfo {
  label: string;
  category: WeatherCategory;
  color: string;
  bgGradient: string;
}

/** Broad weather categories for icon/animation selection. */
export type WeatherCategory =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy_rain"
  | "snow"
  | "thunderstorm";

/** Raw Open-Meteo API response shape (only fields we request). */
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
  soil_temperature_0cm: { time: string[]; soil_temperature_0cm: number[] };
  soil_moisture_0_to_7cm: {
    time: string[];
    soil_moisture_0_to_7cm: number[];
  };
}
