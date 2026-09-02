/**
 * components/dashboard/FeatureCard.tsx
 *
 * Shared shell for the compact dashboard feature cards (weather, market).
 * Provides the icon + title header, a deep link to the full feature page,
 * and consistent hover polish so every entry point into a Green Flora
 * feature looks and behaves the same.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import Card from "@/components/ui/Card";

interface FeatureCardProps {
  title: string;
  icon: ReactNode;
  href: string;
  linkLabel: string;
  children: ReactNode;
}

export default function FeatureCard({
  title,
  icon,
  href,
  linkLabel,
  children,
}: FeatureCardProps) {
  return (
    <Card className="group h-full transition-all duration-200 hover:border-primary-200 hover:shadow-elevated">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-700 transition-colors duration-150 hover:text-primary-800"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
