/**
 * app/dashboard/page.tsx
 *
 * The dashboard is the farmer's central command center. Phase 1
 * establishes the visual foundation: greeting, stat cards, farm
 * overview, coming-soon placeholders for future modules, and quick
 * actions. All data comes from the existing useFarmer hook.
 */

"use client";

import Link from "next/link";
import {
  MapPin,
  Ruler,
  Sprout,
  Calendar,
  Wallet,
  CloudSun,
  TrendingUp,
  Activity,
  Leaf,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import ComingSoonCard from "@/components/dashboard/ComingSoonCard";
import Card from "@/components/ui/Card";
import LoadingState, {
  StatCardSkeleton,
  CardSkeleton,
} from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useFarmer } from "@/Hooks/useFarmer";

const QUICK_ACTIONS = [
  { label: "Edit farm profile", href: "/my-farm", enabled: true },
  { label: "Check weather", href: "/weather", enabled: false },
  { label: "Diagnose crop", href: "/crop-doctor", enabled: false },
  { label: "Check market", href: "/market", enabled: false },
];

export default function DashboardPage() {
  const { farmer, isLoading, error, refresh } = useFarmer();

  return (
    <AuthGuard>
    <AppShell title="Dashboard">
      {/* Loading */}
      {isLoading && (
        <>
          <div className="mb-6">
            <div className="h-8 w-64 rounded bg-neutral-200 animate-gf-pulse" />
            <div className="mt-2 h-4 w-48 rounded bg-neutral-100 animate-gf-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-6">
            <CardSkeleton />
          </div>
        </>
      )}

      {/* Error */}
      {error && !isLoading && (
        <ErrorState message={error} onRetry={refresh} />
      )}

      {/* Success */}
      {!isLoading && !error && farmer && (
        <div className="animate-gf-fade-in">
          <DashboardHeader
            farmerName={farmer.name}
            isDemo={farmer.is_demo}
          />

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Farm Area"
              value={
                farmer.farm_area_acres
                  ? `${farmer.farm_area_acres} acres`
                  : "Not set"
              }
              icon={<Ruler className="h-5 w-5" />}
            />
            <StatCard
              label="Current Crop"
              value={farmer.current_crop ?? "Not set"}
              icon={<Sprout className="h-5 w-5" />}
            />
            <StatCard
              label="Crop Stage"
              value={farmer.crop_stage ?? "Not set"}
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              label="Budget"
              value={
                farmer.budget_pkr
                  ? `PKR ${farmer.budget_pkr.toLocaleString()}`
                  : "Not set"
              }
              icon={<Wallet className="h-5 w-5" />}
            />
          </div>

          {/* Farm Overview */}
          <section className="mt-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4.5 w-4.5 text-primary-600" />
                  <h2 className="text-base font-semibold text-neutral-900">
                    Farm Overview
                  </h2>
                </div>
                <Link href="/my-farm">
                  <Button variant="ghost" size="sm">
                    Edit profile
                  </Button>
                </Link>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <dt className="text-xs font-medium text-neutral-500">
                      Location
                    </dt>
                    <dd className="text-sm text-neutral-900">
                      {farmer.location ?? (
                        <span className="text-neutral-400">Not set</span>
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sprout className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <dt className="text-xs font-medium text-neutral-500">
                      Current Crop
                    </dt>
                    <dd className="text-sm text-neutral-900">
                      {farmer.current_crop ?? (
                        <span className="text-neutral-400">Not set</span>
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <dt className="text-xs font-medium text-neutral-500">
                      Crop Stage
                    </dt>
                    <dd className="text-sm text-neutral-900">
                      {farmer.crop_stage ?? (
                        <span className="text-neutral-400">Not set</span>
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Wallet className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <dt className="text-xs font-medium text-neutral-500">
                      Budget
                    </dt>
                    <dd className="text-sm text-neutral-900">
                      {farmer.budget_pkr ? (
                        `PKR ${farmer.budget_pkr.toLocaleString()}`
                      ) : (
                        <span className="text-neutral-400">Not set</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </Card>
          </section>

          {/* Coming Soon modules */}
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">
              Coming soon
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ComingSoonCard
                title="Weather"
                icon={<CloudSun className="h-5 w-5" />}
                description="Localized weather forecasts and agricultural alerts for your farm location."
              />
              <ComingSoonCard
                title="Market Prices"
                icon={<TrendingUp className="h-5 w-5" />}
                description="Daily crop prices and market trends from Pakistani agricultural markets."
              />
              <ComingSoonCard
                title="Crop Health"
                icon={<Activity className="h-5 w-5" />}
                description="AI-powered crop disease detection and health monitoring."
              />
            </div>
          </section>

          {/* Quick Actions */}
          <QuickActions actions={QUICK_ACTIONS} />
        </div>
      )}

      {/* Empty — no farmer data at all */}
      {!isLoading && !error && !farmer && (
        <EmptyState
          icon={<Leaf className="h-5 w-5" />}
          title="No farm profile found"
          description="Complete your farm profile to see your dashboard."
          action={
            <Link href="/my-farm">
              <Button variant="primary" size="sm">
                Set up your farm
              </Button>
            </Link>
          }
        />
      )}
    </AppShell>
    </AuthGuard>
  );
}
