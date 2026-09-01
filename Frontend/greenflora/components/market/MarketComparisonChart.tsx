/**
 * components/market/MarketComparisonChart.tsx
 *
 * Horizontal bar chart comparing the selected crop's price across all
 * reporting markets on the latest date.  Highest and lowest markets
 * are visually distinguished; hover tooltips show exact PKR values.
 *
 * Long lists (many mandis) scroll inside the card so no market is
 * hidden, with highest at top and lowest at bottom.
 */

"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { MarketOverview } from "@/types/market";
import {
  formatMarketDate,
  formatPKR,
  formatPKRCompact,
  getCropAccent,
} from "@/lib/marketUtils";

interface MarketComparisonChartProps {
  overview: MarketOverview;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      price: number;
      min_price: number | null;
      max_price: number | null;
      rank: number;
    };
  }>;
}

function ComparisonTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-surface-elevated px-3 py-2 shadow-dropdown">
      <p className="text-xs font-semibold text-neutral-900">{d.name}</p>
      <p className="mt-0.5 text-sm font-bold text-primary-700">
        {formatPKR(d.price)}
      </p>
      {d.min_price != null && d.max_price != null && (
        <p className="mt-0.5 text-[11px] text-neutral-500">
          Range {formatPKR(d.min_price)} – {formatPKR(d.max_price)}
        </p>
      )}
    </div>
  );
}

export default function MarketComparisonChart({
  overview,
}: MarketComparisonChartProps) {
  const accent = getCropAccent(overview.commodity_name);

  const data = useMemo(
    () =>
      overview.market_comparison.map((m, i) => ({
        ...m,
        rank: i,
        isHighest: i === 0,
        isLowest:
          i === overview.market_comparison.length - 1 &&
          overview.market_comparison.length > 1,
      })),
    [overview.market_comparison]
  );

  if (data.length === 0) {
    return (
      <Card>
        <ChartHeader overview={overview} />
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-center">
          <p className="text-sm font-semibold text-neutral-800">
            No market prices today
          </p>
          <p className="mt-1 max-w-xs text-xs text-neutral-500">
            No market reported a price for this crop on the latest date.
          </p>
        </div>
      </Card>
    );
  }

  const chartHeight = Math.max(data.length * 30, 160);

  return (
    <Card>
      <ChartHeader overview={overview} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="success">
          <ArrowUp className="mr-1 h-3 w-3" />
          Highest: {data[0].name} · {formatPKR(data[0].price)}
        </Badge>
        {data.length > 1 && (
          <Badge variant="danger">
            <ArrowDown className="mr-1 h-3 w-3" />
            Lowest: {data[data.length - 1].name} ·{" "}
            {formatPKR(data[data.length - 1].price)}
          </Badge>
        )}
      </div>

      <div className="gf-scrollbar max-h-[420px] overflow-y-auto pr-1">
        <div style={{ height: chartHeight }} className="animate-gf-fade-in">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 64, bottom: 0, left: 0 }}
              barCategoryGap={4}
            >
              <XAxis
                type="number"
                hide
                domain={[0, "dataMax"]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#4B4A3F" }}
                tickLine={false}
                axisLine={false}
                width={116}
              />
              <Tooltip
                content={<ComparisonTooltip />}
                cursor={{ fill: "rgba(45, 106, 79, 0.06)" }}
              />
              <Bar
                dataKey="price"
                radius={[0, 4, 4, 0]}
                animationDuration={500}
              >
                {data.map((d) => (
                  <Cell
                    key={d.market_id}
                    fill={
                      d.isHighest
                        ? "#2D6A4F"
                        : d.isLowest
                          ? "#D4B896"
                          : accent.chartSoft
                    }
                    fillOpacity={d.isHighest || d.isLowest ? 1 : 0.9}
                  />
                ))}
                <LabelList
                  dataKey="price"
                  position="right"
                  formatter={(v) => formatPKRCompact(Number(v ?? 0))}
                  style={{ fontSize: 10, fill: "#636257", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-neutral-400">
        Prices for {formatMarketDate(overview.latest_date)}
        {overview.unit ? ` · ${overview.unit}` : ""} · {data.length} markets
      </p>
    </Card>
  );
}

function ChartHeader({ overview }: { overview: MarketOverview }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <BarChart3 className="h-4 w-4 text-primary-700" />
        Market comparison
      </h2>
      <p className="mt-0.5 text-xs text-neutral-500">
        {overview.commodity_name} price across markets
      </p>
    </div>
  );
}
