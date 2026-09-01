/**
 * components/market/MarketDistributionCard.tsx
 *
 * Market Distribution:
 *  - When AMIS arrivals (quantity) data is meaningful, shows a donut
 *    chart of each market's share of total arrivals.
 *  - When quantity data is unavailable, gracefully falls back to a
 *    per-market price-range visualization (min–max with the FQP
 *    marker) built from real AMIS min/max prices — never a
 *    misleading chart.
 */

"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Package, PieChart as PieChartIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import type { MarketOverview } from "@/types/market";
import {
  formatPKR,
  formatPKRCompact,
  getCropAccent,
} from "@/lib/marketUtils";

/** Green-forward palette for donut segments. */
const DONUT_COLORS = [
  "#2D6A4F",
  "#52B788",
  "#74C69D",
  "#A07855",
  "#D4B896",
  "#95D5B2",
  "#B7E4C7",
  "#6B4F36",
];

interface MarketDistributionCardProps {
  overview: MarketOverview;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{
    payload: { name: string; quantity: number; share_pct: number };
  }>;
}

function DonutTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-surface-elevated px-3 py-2 shadow-dropdown">
      <p className="text-xs font-semibold text-neutral-900">{d.name}</p>
      <p className="mt-0.5 text-sm font-bold text-primary-700">
        {d.share_pct.toFixed(1)}% of arrivals
      </p>
      <p className="mt-0.5 text-[11px] text-neutral-500">
        Arrivals reported: {d.quantity.toLocaleString("en-PK")}
      </p>
    </div>
  );
}

export default function MarketDistributionCard({
  overview,
}: MarketDistributionCardProps) {
  const accent = getCropAccent(overview.commodity_name);
  const distribution = overview.distribution;

  if (distribution && distribution.entries.length >= 2) {
    return (
      <Card>
        <Header
          title="Market distribution"
          subtitle={`Share of total arrivals across ${distribution.entries.length} markets`}
          icon={<Package className="h-4 w-4 text-primary-700" />}
        />
        <div className="animate-gf-fade-in flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-52 w-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DonutTooltip />} />
                <Pie
                  data={distribution.entries}
                  dataKey="quantity"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="#FFFFFF"
                  animationDuration={500}
                >
                  {distribution.entries.map((entry, i) => (
                    <Cell
                      key={entry.market_id}
                      fill={
                        DONUT_COLORS[i % DONUT_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <ul className="w-full min-w-0 flex-1 space-y-1.5">
            {distribution.entries.map((entry, i) => (
              <li
                key={entry.market_id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-100 hover:bg-neutral-50"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      DONUT_COLORS[i % DONUT_COLORS.length],
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-700">
                  {entry.name}
                </span>
                <span className="shrink-0 text-xs font-bold text-neutral-900">
                  {entry.share_pct.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Total arrivals reported:{" "}
          {distribution.total_quantity.toLocaleString("en-PK")} (AMIS
          quantities, latest date)
        </p>
      </Card>
    );
  }

  // --- Fallback: per-market price range (real min/max data) ---
  const withRange = overview.market_comparison.filter(
    (m) => m.min_price != null && m.max_price != null
  );

  if (withRange.length >= 1) {
    return (
      <Card>
        <Header
          title="Today's price range by market"
          subtitle="Arrivals quantity is not reported for this crop — showing each market's trading range instead"
          icon={<PieChartIcon className="h-4 w-4 text-primary-700" />}
        />
        <PriceRangeStrip
          entries={withRange}
          accent={accent.chart}
          accentSoft={accent.chartSoft}
        />
      </Card>
    );
  }

  // --- Honest empty state ---
  return (
    <Card>
      <Header
        title="Market distribution"
        subtitle="Arrivals data for this crop"
        icon={<Package className="h-4 w-4 text-primary-700" />}
      />
      <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <Package className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-neutral-800">
          No arrivals data reported
        </p>
        <p className="mt-1 max-w-xs text-xs text-neutral-500">
          AMIS did not report market arrivals for this crop on the latest
          date.
        </p>
      </div>
    </Card>
  );
}

function Header({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        {icon}
        {title}
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback: price-range strip (pure CSS, accessible)
// ---------------------------------------------------------------------------

function PriceRangeStrip({
  entries,
  accent,
  accentSoft,
}: {
  entries: Array<{
    market_id: string;
    name: string;
    price: number;
    min_price: number | null;
    max_price: number | null;
  }>;
  accent: string;
  accentSoft: string;
}) {
  const { globalMin, globalMax } = useMemo(() => {
    const mins = entries
      .map((e) => e.min_price ?? e.price)
      .filter((v): v is number => v != null);
    const maxs = entries
      .map((e) => e.max_price ?? e.price)
      .filter((v): v is number => v != null);
    return {
      globalMin: mins.length ? Math.min(...mins) : 0,
      globalMax: maxs.length ? Math.max(...maxs) : 1,
    };
  }, [entries]);

  const span = Math.max(globalMax - globalMin, 1);
  const pct = (v: number) =>
    Math.min(Math.max(((v - globalMin) / span) * 100, 0), 100);

  return (
    <div
      className="gf-scrollbar max-h-[420px] space-y-2.5 overflow-y-auto pr-1 animate-gf-fade-in"
      role="list"
      aria-label="Price range by market"
    >
      {/* Scale header */}
      <div className="flex justify-between pl-[120px] pr-10 text-[10px] font-medium text-neutral-400">
        <span>{formatPKRCompact(globalMin)}</span>
        <span>{formatPKRCompact(globalMax)}</span>
      </div>
      {entries.map((e) => {
        const lo = e.min_price ?? e.price;
        const hi = e.max_price ?? e.price;
        return (
          <div key={e.market_id} role="listitem" className="group">
            <div className="flex items-center gap-3">
              <span className="w-[112px] shrink-0 truncate text-xs font-medium text-neutral-700">
                {e.name}
              </span>
              <div className="relative h-5 min-w-0 flex-1 rounded-full bg-neutral-100">
                {/* Range bar */}
                <div
                  className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full transition-all duration-300 group-hover:opacity-100"
                  style={{
                    left: `${pct(lo)}%`,
                    width: `${Math.max(pct(hi) - pct(lo), 1.5)}%`,
                    backgroundColor: accentSoft,
                  }}
                />
                {/* FQP marker */}
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-card transition-transform duration-150 group-hover:scale-125"
                  style={{ left: `${pct(e.price)}%`, backgroundColor: accent }}
                  title={`FQP ${formatPKR(e.price)}`}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs font-semibold text-neutral-900">
                {formatPKR(e.price)}
              </span>
            </div>
            <p className="mt-0.5 pl-[120px] pr-24 text-[10px] text-neutral-400">
              Range {formatPKR(lo)} – {formatPKR(hi)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
