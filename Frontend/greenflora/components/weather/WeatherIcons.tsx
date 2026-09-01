/**
 * components/weather/WeatherIcons.tsx
 *
 * Animated inline SVG weather icons for each weather category.
 * Each icon is a React component with CSS-driven animations.
 */

import type { WeatherCategory } from "@/types/weather";

interface IconProps {
  size?: number;
  className?: string;
}

/* ─── Clear / Sunny ─────────────────────────────────────────────── */
export function SunnyIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Sun glow */}
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="#FDE68A"
        className="animate-gf-sun-glow"
        opacity="0.3"
      />
      {/* Sun body */}
      <circle cx="32" cy="32" r="14" fill="#F59E0B" />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 32 + Math.cos(rad) * 18;
        const y1 = 32 + Math.sin(rad) * 18;
        const x2 = 32 + Math.cos(rad) * 24;
        const y2 = 32 + Math.sin(rad) * 24;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-gf-sun-glow"
          />
        );
      })}
    </svg>
  );
}

/* ─── Partly Cloudy ─────────────────────────────────────────────── */
export function PartlyCloudyIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Sun behind */}
      <circle cx="42" cy="22" r="10" fill="#F59E0B" />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 42 + Math.cos(rad) * 13;
        const y1 = 22 + Math.sin(rad) * 13;
        const x2 = 42 + Math.cos(rad) * 17;
        const y2 = 22 + Math.sin(rad) * 17;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-gf-sun-glow"
          />
        );
      })}
      {/* Cloud */}
      <g className="animate-gf-cloud">
        <ellipse cx="28" cy="38" rx="16" ry="10" fill="white" />
        <ellipse cx="20" cy="38" rx="10" ry="8" fill="white" />
        <ellipse cx="38" cy="40" rx="10" ry="8" fill="white" />
        <ellipse cx="28" cy="34" rx="10" ry="8" fill="#F3F4F6" />
      </g>
    </svg>
  );
}

/* ─── Cloudy ────────────────────────────────────────────────────── */
export function CloudyIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <g className="animate-gf-cloud">
        <ellipse cx="30" cy="34" rx="18" ry="11" fill="#E5E7EB" />
        <ellipse cx="20" cy="34" rx="12" ry="9" fill="#F3F4F6" />
        <ellipse cx="40" cy="36" rx="12" ry="9" fill="#E5E7EB" />
        <ellipse cx="30" cy="28" rx="12" ry="9" fill="#F9FAFB" />
      </g>
    </svg>
  );
}

/* ─── Fog ───────────────────────────────────────────────────────── */
export function FogIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <g className="animate-gf-cloud">
        <ellipse cx="32" cy="24" rx="16" ry="10" fill="#E5E7EB" />
        <ellipse cx="24" cy="24" rx="10" ry="8" fill="#F3F4F6" />
        <ellipse cx="40" cy="26" rx="10" ry="8" fill="#E5E7EB" />
      </g>
      {/* Fog lines */}
      <line
        x1="14"
        y1="38"
        x2="50"
        y2="38"
        stroke="#D1D5DB"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="18"
        y1="44"
        x2="46"
        y2="44"
        stroke="#D1D5DB"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="22"
        y1="50"
        x2="42"
        y2="50"
        stroke="#D1D5DB"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/* ─── Drizzle ───────────────────────────────────────────────────── */
export function DrizzleIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Cloud */}
      <g>
        <ellipse cx="30" cy="24" rx="16" ry="10" fill="#D1D5DB" />
        <ellipse cx="22" cy="24" rx="10" ry="8" fill="#E5E7EB" />
        <ellipse cx="38" cy="26" rx="10" ry="8" fill="#D1D5DB" />
      </g>
      {/* Small drops */}
      <circle cx="24" cy="40" r="2" fill="#93C5FD" className="animate-gf-rain" />
      <circle
        cx="32"
        cy="44"
        r="2"
        fill="#93C5FD"
        className="animate-gf-rain"
        style={{ animationDelay: "0.3s" }}
      />
      <circle
        cx="40"
        cy="42"
        r="2"
        fill="#93C5FD"
        className="animate-gf-rain"
        style={{ animationDelay: "0.6s" }}
      />
    </svg>
  );
}

/* ─── Rain ──────────────────────────────────────────────────────── */
export function RainIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Cloud */}
      <g>
        <ellipse cx="30" cy="22" rx="17" ry="11" fill="#9CA3AF" />
        <ellipse cx="22" cy="22" rx="11" ry="9" fill="#D1D5DB" />
        <ellipse cx="40" cy="24" rx="11" ry="9" fill="#9CA3AF" />
      </g>
      {/* Rain drops */}
      {[
        { x: 20, delay: "0s" },
        { x: 28, delay: "0.2s" },
        { x: 36, delay: "0.4s" },
        { x: 44, delay: "0.1s" },
      ].map((drop, i) => (
        <line
          key={i}
          x1={drop.x}
          y1="36"
          x2={drop.x - 2}
          y2="48"
          stroke="#60A5FA"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-gf-rain"
          style={{ animationDelay: drop.delay }}
        />
      ))}
    </svg>
  );
}

/* ─── Heavy Rain ────────────────────────────────────────────────── */
export function HeavyRainIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Dark cloud */}
      <g>
        <ellipse cx="30" cy="20" rx="18" ry="12" fill="#6B7280" />
        <ellipse cx="20" cy="20" rx="12" ry="10" fill="#9CA3AF" />
        <ellipse cx="42" cy="22" rx="12" ry="10" fill="#6B7280" />
      </g>
      {/* Heavy drops */}
      {[
        { x: 18, delay: "0s" },
        { x: 26, delay: "0.15s" },
        { x: 34, delay: "0.3s" },
        { x: 42, delay: "0.05s" },
        { x: 22, delay: "0.25s" },
        { x: 38, delay: "0.4s" },
      ].map((drop, i) => (
        <line
          key={i}
          x1={drop.x}
          y1="34"
          x2={drop.x - 3}
          y2="50"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-gf-rain"
          style={{ animationDelay: drop.delay }}
        />
      ))}
    </svg>
  );
}

/* ─── Snow ──────────────────────────────────────────────────────── */
export function SnowIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Cloud */}
      <g>
        <ellipse cx="30" cy="22" rx="17" ry="11" fill="#D1D5DB" />
        <ellipse cx="22" cy="22" rx="11" ry="9" fill="#E5E7EB" />
        <ellipse cx="40" cy="24" rx="11" ry="9" fill="#D1D5DB" />
      </g>
      {/* Snowflakes */}
      {[
        { cx: 20, cy: 40, delay: "0s" },
        { cx: 28, cy: 44, delay: "0.4s" },
        { cx: 36, cy: 42, delay: "0.2s" },
        { cx: 44, cy: 40, delay: "0.6s" },
      ].map((flake, i) => (
        <g key={i} className="animate-gf-snow" style={{ animationDelay: flake.delay }}>
          <circle cx={flake.cx} cy={flake.cy} r="2.5" fill="white" stroke="#93C5FD" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

/* ─── Thunderstorm ──────────────────────────────────────────────── */
export function ThunderstormIcon({
  size = 64,
  className = "",
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Dark cloud */}
      <g>
        <ellipse cx="30" cy="20" rx="18" ry="12" fill="#4B5563" />
        <ellipse cx="20" cy="20" rx="12" ry="10" fill="#6B7280" />
        <ellipse cx="42" cy="22" rx="12" ry="10" fill="#4B5563" />
      </g>
      {/* Lightning bolt */}
      <polygon
        points="30,30 26,42 32,42 28,54 40,38 34,38 38,30"
        fill="#FBBF24"
        className="animate-gf-pulse"
      />
      {/* Rain */}
      <line
        x1="20"
        y1="36"
        x2="18"
        y2="48"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-gf-rain"
      />
      <line
        x1="44"
        y1="36"
        x2="42"
        y2="48"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-gf-rain"
        style={{ animationDelay: "0.2s" }}
      />
    </svg>
  );
}

/* ─── Night Clear ───────────────────────────────────────────────── */
export function NightClearIcon({ size = 64, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Moon */}
      <path
        d="M36 14C28 14 22 22 22 32C22 42 28 50 36 50C28 48 24 40 24 32C24 24 28 16 36 14Z"
        fill="#FDE68A"
      />
      {/* Stars */}
      <circle cx="44" cy="20" r="1.5" fill="#FDE68A" className="animate-gf-pulse" />
      <circle cx="50" cy="30" r="1" fill="#FDE68A" className="animate-gf-pulse" style={{ animationDelay: "0.5s" }} />
      <circle cx="46" cy="40" r="1.2" fill="#FDE68A" className="animate-gf-pulse" style={{ animationDelay: "1s" }} />
    </svg>
  );
}

/**
 * Get the appropriate weather icon component based on category.
 * Handles day/night for clear skies.
 */
export function WeatherIcon({
  category,
  isDay = true,
  size = 64,
  className = "",
}: {
  category: WeatherCategory;
  isDay?: boolean;
  size?: number;
  className?: string;
}) {
  const props = { size, className };
  switch (category) {
    case "clear":
      return isDay ? <SunnyIcon {...props} /> : <NightClearIcon {...props} />;
    case "partly_cloudy":
      return <PartlyCloudyIcon {...props} />;
    case "cloudy":
      return <CloudyIcon {...props} />;
    case "fog":
      return <FogIcon {...props} />;
    case "drizzle":
      return <DrizzleIcon {...props} />;
    case "rain":
      return <RainIcon {...props} />;
    case "heavy_rain":
      return <HeavyRainIcon {...props} />;
    case "snow":
      return <SnowIcon {...props} />;
    case "thunderstorm":
      return <ThunderstormIcon {...props} />;
    default:
      return <CloudyIcon {...props} />;
  }
}

/**
 * Small inline weather icon for forecasts (simplified, no heavy animations).
 */
export function SmallWeatherIcon({
  code,
  size = 24,
  className = "",
}: {
  code: number;
  size?: number;
  className?: string;
}) {
  // Simplified mapping for small icons
  if (code <= 1) return <SunnyIcon size={size} className={className} />;
  if (code === 2) return <PartlyCloudyIcon size={size} className={className} />;
  if (code === 3) return <CloudyIcon size={size} className={className} />;
  if (code >= 45 && code <= 48) return <FogIcon size={size} className={className} />;
  if (code >= 51 && code <= 57) return <DrizzleIcon size={size} className={className} />;
  if (code >= 61 && code <= 67)
    return code >= 65 ? (
      <HeavyRainIcon size={size} className={className} />
    ) : (
      <RainIcon size={size} className={className} />
    );
  if (code >= 71 && code <= 77) return <SnowIcon size={size} className={className} />;
  if (code >= 80 && code <= 86)
    return code >= 82 ? (
      <HeavyRainIcon size={size} className={className} />
    ) : (
      <RainIcon size={size} className={className} />
    );
  if (code >= 95) return <ThunderstormIcon size={size} className={className} />;
  return <CloudyIcon size={size} className={className} />;
}
