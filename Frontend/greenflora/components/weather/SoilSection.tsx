/**
 * components/weather/SoilSection.tsx
 *
 * Farm environment section showing estimated soil temperature and
 * soil moisture with earth-tone visuals. Values are modelled estimates
 * from Open-Meteo, not physical sensor readings.
 *
 * Cards are hidden gracefully when data is unavailable.
 */

import { Thermometer, Droplets, Info } from "lucide-react";
import type { SoilData } from "@/types/weather";
import {
  getSoilMoistureLabel,
  soilMoistureToPercent,
} from "@/lib/weatherUtils";
import Card from "@/components/ui/Card";

interface SoilSectionProps {
  soil: SoilData;
}

export default function SoilSection({ soil }: SoilSectionProps) {
  const hasTemp = soil.temperature != null;
  const hasMoisture = soil.moisture != null;

  // If both values are unavailable, don't render the section at all
  if (!hasTemp && !hasMoisture) return null;

  return (
    <div className="animate-gf-fade-in">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-earth-500" />
        <h2 className="text-base font-semibold text-neutral-900">
          Farm environment
        </h2>
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-earth-100/60 px-2 py-0.5 text-[10px] font-medium text-earth-700">
          <Info className="h-3 w-3" />
          Estimated
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Soil Temperature */}
        {hasTemp && <SoilTemperatureCard temperature={soil.temperature!} />}

        {/* Soil Moisture */}
        {hasMoisture && <SoilMoistureCard moisture={soil.moisture!} />}
      </div>
    </div>
  );
}

/* ─── Soil Temperature Card ─────────────────────────────────────── */

function SoilTemperatureCard({ temperature }: { temperature: number }) {
  const getSoilTempLabel = (temp: number) => {
    if (temp < 5) return { label: "Very cold", color: "text-info-600" };
    if (temp < 15) return { label: "Cool", color: "text-info-500" };
    if (temp < 25) return { label: "Good for crops", color: "text-primary-600" };
    if (temp < 35) return { label: "Warm", color: "text-amber-600" };
    return { label: "Very hot", color: "text-danger-600" };
  };

  const soilTempInfo = getSoilTempLabel(temperature);

  return (
    <Card
      padding="sm"
      className="border-earth-100 bg-gradient-to-br from-earth-100/40 to-surface-card"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-earth-100 text-earth-700">
          <Thermometer className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-neutral-500">
              Est. soil temperature
            </p>
          </div>
          <p className="mt-0.5 text-2xl font-bold text-neutral-900">
            {Math.round(temperature)}°C
          </p>
          <p className={`mt-0.5 text-xs font-medium ${soilTempInfo.color}`}>
            {soilTempInfo.label}
          </p>

          {/* Visual soil temp indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-info-500 via-amber-500 to-danger-500 opacity-30" />
          </div>
          {/* Indicator dot */}
          <div className="relative -mt-3.5 h-2">
            <div
              className="absolute h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white shadow-sm bg-amber-500 transition-all duration-700"
              style={{
                left: `${Math.min(Math.max(((temperature + 5) / 50) * 100, 2), 98)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Soil Moisture Card ────────────────────────────────────────── */

function SoilMoistureCard({ moisture }: { moisture: number }) {
  const moisturePercent = soilMoistureToPercent(moisture);
  const moistureInfo = getSoilMoistureLabel(moisture);

  return (
    <Card
      padding="sm"
      className="border-earth-100 bg-gradient-to-br from-earth-100/40 to-surface-card"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-earth-100 text-earth-700">
          <Droplets className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-neutral-500">
              Est. soil moisture
            </p>
          </div>
          <p className="mt-0.5 text-2xl font-bold text-neutral-900">
            {moisturePercent}%
          </p>
          <p className={`mt-0.5 text-xs font-medium ${moistureInfo.color}`}>
            {moistureInfo.label}
          </p>

          {/* Moisture bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${moisturePercent}%`,
                background:
                  moisturePercent > 60
                    ? "linear-gradient(to right, #60A5FA, #3B82F6)"
                    : moisturePercent > 30
                      ? "linear-gradient(to right, #52B788, #40916C)"
                      : "linear-gradient(to right, #F59E0B, #D97706)",
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
