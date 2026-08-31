/**
 * components/fields/CropDistribution.tsx
 *
 * Visual crop distribution chart showing which crops
 * are planted and how much area they cover.
 */

"use client";

import { Sprout } from "lucide-react";

interface CropDistributionProps {
  distribution: Record<string, number>;
  totalAcres: number;
}

const CROP_COLORS: Record<string, string> = {
  Wheat: "bg-amber-500",
  Rice: "bg-info-500",
  Cotton: "bg-primary-500",
  Sugarcane: "bg-success-600",
  Maize: "bg-amber-600",
  Tomato: "bg-danger-500",
  Potato: "bg-earth-500",
};

function getCropColor(crop: string): string {
  return CROP_COLORS[crop] ?? "bg-neutral-400";
}

export default function CropDistribution({
  distribution,
  totalAcres,
}: CropDistributionProps) {
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Sprout className="h-4 w-4" />
        <span>No crops planted yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([crop, acres]) => {
        const pct = totalAcres > 0 ? (acres / totalAcres) * 100 : 0;
        const colorClass = getCropColor(crop);

        return (
          <div key={crop}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${colorClass}`}
                />
                <span className="font-medium text-neutral-700">{crop}</span>
              </span>
              <span className="text-neutral-500">
                {acres.toFixed(1)} acres ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
