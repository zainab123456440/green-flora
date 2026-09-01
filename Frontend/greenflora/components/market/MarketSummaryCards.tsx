/**
 * components/market/MarketSummaryCards.tsx
 *
 * Summary cards for the selected crop: representative current price
 * (with the market signal), price per kilogram, 7-day change, highest
 * market, lowest market, and the price spread between them.
 *
 * Every value comes from the AMIS overview payload — cards show
 * honest "no data yet" placeholders when values are missing.
 */

"use client";

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  MapPin,
  Minus,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Card from "@/components/ui/Card";
import type { MarketOverview, MarketSignal } from "@/types/market";
import {
  formatChangePct,
  formatMarketDate,
  formatPKR,
  formatPKRPerKg,
  getCropAccent,
  priceBasisLabel,
} from "@/lib/marketUtils";

interface MarketSummaryCardsProps {
  overview: MarketOverview;
}

function SignalPill({
  signal,
  onGradient = false,
}: {
  signal: MarketSignal;
  onGradient?: boolean;
}) {
  if (onGradient) {
    const icon =
      signal === "rising" ? (
        <TrendingUp className="h-3 w-3" />
      ) : signal === "falling" ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      );
    const label =
      signal === "rising"
        ? "Rising"
        : signal === "falling"
          ? "Falling"
          : signal === "stable"
            ? "Stable"
            : "Not enough data";
    return (
      <span className="inline-flex items-center gap-1 rounded-badge bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
        {icon}
        {label}
      </span>
    );
  }
  if (signal === "rising") {
    return (
      <span className="inline-flex items-center gap-1 rounded-badge bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-600">
        <TrendingUp className="h-3 w-3" />
        Rising
      </span>
    );
  }
  if (signal === "falling") {
    return (
      <span className="inline-flex items-center gap-1 rounded-badge bg-danger-100 px-2 py-0.5 text-[11px] font-semibold text-danger-600">
        <TrendingDown className="h-3 w-3" />
        Falling
      </span>
    );
  }
  if (signal === "stable") {
    return (
      <span className="inline-flex items-center gap-1 rounded-badge bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
        <Minus className="h-3 w-3" />
        Stable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-badge bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
      Not enough data
    </span>
  );
}

interface StatTileProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "gradient";
}

function StatTile({
  label,
  icon,
  children,
  className,
  variant = "default",
}: StatTileProps) {
  const isGradient = variant === "gradient";
  return (
    <Card
      padding="sm"
      className={`animate-gf-fade-in ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isGradient
              ? "bg-white/20 text-white"
              : "bg-primary-50 text-primary-700"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-medium ${
              isGradient ? "text-white/80" : "text-neutral-500"
            }`}
          >
            {label}
          </p>
          <div className="mt-0.5">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export default function MarketSummaryCards({ overview }: MarketSummaryCardsProps) {
  const accent = getCropAccent(overview.commodity_name);
  const changeLabel = formatChangePct(overview.change_pct);
  const basis = priceBasisLabel(overview.price_basis, overview);

  const changeTone =
    overview.change_pct == null
      ? "text-neutral-400"
      : overview.change_pct > 0
        ? "text-success-600"
        : overview.change_pct < 0
          ? "text-danger-600"
          : "text-neutral-500";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {/* Current price — highlighted with the crop accent */}
      <StatTile
        label="Current price"
        icon={<Banknote className="h-4.5 w-4.5" />}
        variant="gradient"
        className={`col-span-2 border-none bg-gradient-to-br ${accent.gradient} xl:col-span-1`}
      >
        <p className="text-xl font-bold tracking-tight text-white">
          {formatPKR(overview.current_price)}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-white/80">
          {overview.unit ? overview.unit.replace("Rs/", "per ") : ""}
          {overview.unit ? " · " : ""}
          {formatMarketDate(overview.latest_date)}
        </p>
        <div className="mt-1.5">
          <SignalPill signal={overview.signal} onGradient />
        </div>
      </StatTile>

      {/* Price per kg — the same AMIS rate expressed per kilogram */}
      <StatTile label="Price per kg" icon={<Scale className="h-4.5 w-4.5" />}>
        <p className="text-lg font-semibold text-neutral-900">
          {formatPKRPerKg(
            overview.current_price != null
              ? overview.current_price / 100
              : null
          )}
          <span className="text-xs font-medium text-neutral-400"> / kg</span>
        </p>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          from the 100 kg market rate
        </p>
      </StatTile>

      {/* 7-day change */}
      <StatTile
        label="Price change"
        icon={
          overview.change_pct != null && overview.change_pct > 0 ? (
            <ArrowUpRight className="h-4.5 w-4.5" />
          ) : overview.change_pct != null && overview.change_pct < 0 ? (
            <ArrowDownRight className="h-4.5 w-4.5" />
          ) : (
            <Minus className="h-4.5 w-4.5" />
          )
        }
      >
        <p className={`text-lg font-semibold ${changeTone}`}>
          {changeLabel ?? "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          {overview.change_period_days != null
            ? `vs ${overview.change_period_days} days ago`
            : basis ?? "waiting for history"}
        </p>
      </StatTile>

      {/* Highest market */}
      <StatTile
        label="Highest market"
        icon={<MapPin className="h-4.5 w-4.5" />}
      >
        <p className="truncate text-sm font-semibold text-neutral-900">
          {overview.highest_market?.name ?? "—"}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-success-600">
          {formatPKR(overview.highest_market?.price ?? null)}
        </p>
      </StatTile>

      {/* Lowest market */}
      <StatTile label="Lowest market" icon={<MapPin className="h-4.5 w-4.5" />}>
        <p className="truncate text-sm font-semibold text-neutral-900">
          {overview.lowest_market?.name ?? "—"}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-danger-600">
          {formatPKR(overview.lowest_market?.price ?? null)}
        </p>
      </StatTile>

      {/* Spread */}
      <StatTile
        label="Market spread"
        icon={<Banknote className="h-4.5 w-4.5" />}
        className="col-span-2 lg:col-span-1"
      >
        <p className="text-lg font-semibold text-neutral-900">
          {overview.spread_abs != null ? formatPKR(overview.spread_abs) : "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          {overview.spread_pct != null
            ? `${overview.spread_pct}% between markets`
            : "needs 2+ markets"}
        </p>
      </StatTile>
    </div>
  );
}
