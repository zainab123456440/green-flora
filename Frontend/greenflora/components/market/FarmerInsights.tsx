/**
 * components/market/FarmerInsights.tsx
 *
 * Short, easy-to-understand insights derived by the backend from the
 * actual AMIS data (price direction, best market, spread, coverage).
 * Kept concise and farmer-friendly — not a long report.
 */

"use client";

import { Lightbulb } from "lucide-react";
import Card from "@/components/ui/Card";
import type { MarketOverview } from "@/types/market";

interface FarmerInsightsProps {
  overview: MarketOverview;
}

export default function FarmerInsights({ overview }: FarmerInsightsProps) {
  const insights = overview.insights;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Lightbulb className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            What this means for you
          </h2>
          <p className="text-xs text-neutral-500">
            Quick takeaways from today&apos;s {overview.commodity_name}{" "}
            prices
          </p>
        </div>
      </div>

      {insights.length > 0 ? (
        <ul className="animate-gf-fade-in space-y-2.5">
          {insights.map((insight, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg bg-primary-50/60 px-3.5 py-2.5"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600"
                aria-hidden="true"
              />
              <p className="text-[13px] leading-relaxed text-neutral-700">
                {insight}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-xs text-neutral-500">
          Insights will appear once price data is available for this crop.
        </p>
      )}
    </Card>
  );
}
