/**
 * components/DashboardSummaryCard.tsx
 *
 * Reusable card used to display one summary block on the dashboard
 * (farm overview, weather, market, etc.).
 * Uses Green Flora design tokens for consistent styling.
 */

import type { ReactNode } from "react";

interface SummaryRow {
  label: string;
  value: string;
}

interface DashboardSummaryCardProps {
  title: string;
  rows: SummaryRow[];
  /** Small badge shown next to the title, e.g. "Demo data". */
  badge?: string;
  /** Optional footer content, e.g. a "View details" link. */
  footer?: ReactNode;
}

export default function DashboardSummaryCard({
  title,
  rows,
  badge,
  footer,
}: DashboardSummaryCardProps) {
  return (
    <section className="rounded-card border border-neutral-200 bg-surface-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between border-l-4 border-primary-600 pl-3">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {badge && (
          <span className="rounded-badge bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {badge}
          </span>
        )}
      </div>

      <dl className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="font-medium text-neutral-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      {footer && (
        <div className="mt-4 border-t border-neutral-100 pt-3">{footer}</div>
      )}
    </section>
  );
}
