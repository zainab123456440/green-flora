/**
 * components/dashboard/DashboardHeader.tsx
 *
 * Greeting hero at the top of the dashboard. A deep agricultural-green
 * gradient band with a few very subtle floating leaves behind the text —
 * decorative elements sit behind the content and never intercept
 * pointer events, and the animations are disabled entirely for users
 * who prefer reduced motion (see globals.css).
 */

import { Leaf } from "lucide-react";

import Badge from "@/components/ui/Badge";

interface DashboardHeaderProps {
  farmerName: string;
  isDemo?: boolean;
}

export default function DashboardHeader({
  farmerName,
  isDemo,
}: DashboardHeaderProps) {
  const firstName = farmerName.split(" ")[0];
  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 p-6 shadow-elevated sm:p-8">
      {/* Decorative background — floating leaves + soft organic glows.
          Purely visual: behind content, non-interactive. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary-400/15 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-primary-300/15 blur-2xl" />
        <Leaf
          className="absolute right-12 top-6 h-16 w-16 text-primary-400 animate-gf-float"
          strokeWidth={1.5}
        />
        <Leaf
          className="absolute right-32 bottom-3 h-10 w-10 -scale-x-100 text-primary-300 animate-gf-float-slow"
          strokeWidth={1.5}
        />
        <Leaf
          className="absolute right-5 bottom-10 h-7 w-7 text-primary-200 animate-gf-float-fast"
          strokeWidth={1.5}
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-primary-50 sm:text-3xl">
            Assalam-o-Alaikum, {firstName}
          </h1>
          {isDemo && <Badge variant="warning">Demo data</Badge>}
        </div>
        <p className="mt-1.5 text-sm text-primary-100/90">
          {today} &mdash; Here&apos;s how your farm looks today.
        </p>
      </div>
    </section>
  );
}
