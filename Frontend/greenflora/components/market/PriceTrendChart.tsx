/**
 * components/market/PriceTrendChart.tsx
 *
 * Interactive price trend for the selected crop: a Recharts line chart
 * with 7D / 30D / 3M / 6M filters and hover tooltips showing the exact
 * date and PKR price.  The chart is tinted with the crop's accent
 * color.
 *
 * When the AMIS history is limited (e.g. only one day of data), the
 * card explains this honestly instead of showing a misleading line.
 */

"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, LineChart as LineChartIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import type { MarketOverview, MarketPeriod } from "@/types/market";
import {
  formatAxisDate,
  formatAxisMonth,
  formatMarketDate,
  formatPKR,
  formatPKRCompact,
  getCropAccent,
  sliceTrendForPeriod,
} from "@/lib/marketUtils";

const PERIODS: MarketPeriod[] = ["7D", "30D", "3M", "6M"];

interface PriceTrendChartProps {
  overview: MarketOverview;
  /** Name of the market the trend is scoped to (null = all markets). */
  trendMarketName: string | null;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: { date: string; price: number } }>;
}

function TrendTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-surface-elevated px-3 py-2 shadow-dropdown">
      <p className="text-xs font-medium text-neutral-500">
        {formatMarketDate(point.date)}
      </p>
      <p className="mt-0.5 text-sm font-bold text-neutral-900">
        {formatPKR(point.price)}
      </p>
    </div>
  );
}

export default function PriceTrendChart({
  overview,
  trendMarketName,
}: PriceTrendChartProps) {
  const [period, setPeriod] = useState<MarketPeriod>("30D");
  const accent = getCropAccent(overview.commodity_name);

  const data = useMemo(
    () => sliceTrendForPeriod(overview.trend, period),
    [overview.trend, period]
  );

  const hasHistory = overview.trend.length >= 2;
  const isLongPeriod = period === "3M" || period === "6M";
  const hasMinData = data.length >= 2;

  return (
    <Card>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <LineChartIcon className="h-4 w-4 text-primary-700" />
            Price trend
          </h2>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {trendMarketName
              ? `${trendMarketName} market · ${overview.unit ?? ""}`
              : `All markets (average) · ${overview.unit ?? ""}`}
          </p>
        </div>

        {/* Period filter */}
        <div
          role="tablist"
          aria-label="Time period"
          className="flex rounded-button bg-neutral-100 p-0.5"
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-[7px] px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                period === p
                  ? "bg-surface-card text-primary-700 shadow-card"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart / honest empty state */}
      {hasHistory && hasMinData ? (
        <div className="animate-gf-fade-in h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
            >
              <defs>
                <linearGradient
                  id={`trend-fill-${overview.commodity_id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={accent.chart} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={accent.chart} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E4DFD1"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) =>
                  isLongPeriod ? formatAxisMonth(v) : formatAxisDate(v)
                }
                tick={{ fontSize: 11, fill: "#7C8B72" }}
                tickLine={false}
                axisLine={{ stroke: "#E4DFD1" }}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v: number) => formatPKRCompact(v)}
                tick={{ fontSize: 11, fill: "#7C8B72" }}
                tickLine={false}
                axisLine={false}
                width={52}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: accent.chart, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={accent.chart}
                strokeWidth={2.5}
                fill={`url(#trend-fill-${overview.commodity_id})`}
                activeDot={{
                  r: 5,
                  fill: accent.chart,
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                animationDuration={450}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            Not enough history yet
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
            {overview.trend.length === 1
              ? `Only one day of data (${formatMarketDate(
                  overview.trend[0]?.date
                )}) is available so far. The trend line will appear as daily AMIS prices are collected.`
              : "Price history for this period is not available yet. The trend line will appear as daily AMIS prices are collected."}
          </p>
        </div>
      )}

      {/* Coverage note */}
      <p className="mt-3 text-[11px] text-neutral-400">
        {overview.days_of_data > 0 && (
          <>
            {overview.days_of_data}{" "}
            {overview.days_of_data === 1 ? "day" : "days"} of data available
            {overview.first_date && overview.latest_date && (
              <>
                {" · "}
                {formatMarketDate(overview.first_date)} –{" "}
                {formatMarketDate(overview.latest_date)}
              </>
            )}
          </>
        )}
      </p>
    </Card>
  );
}
