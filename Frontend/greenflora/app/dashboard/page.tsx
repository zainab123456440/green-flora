/**
 * app/dashboard/page.tsx
 *
 * The dashboard is the farmer's central command center.
 * Phase 4 adds: interactive farm map, field stats, crop distribution,
 * and real data from the fields + crop cycles.
 *
 * Existing Phase 1–3 features (greeting, stat cards, quick actions,
 * coming soon modules) are preserved and enhanced.
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
  LayoutGrid,
  ArrowRight,
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
import Badge from "@/components/ui/Badge";

import FarmLandView from "@/components/farm/FarmLandView";
import CropDistribution from "@/components/fields/CropDistribution";

import { useFarmer } from "@/Hooks/useFarmer";
import { useFields } from "@/Hooks/useFields";

const QUICK_ACTIONS = [
  { label: "Manage fields", href: "/my-farm", enabled: true },
  { label: "Edit profile", href: "/profile", enabled: true },
  { label: "Check weather", href: "/weather", enabled: false },
  { label: "Diagnose crop", href: "/crop-doctor", enabled: false },
  { label: "Check market", href: "/market", enabled: false },
];

export default function DashboardPage() {
  const { farmer, isLoading: farmerLoading, error: farmerError, refresh: refreshFarmer } = useFarmer();
  const { summary, isLoading: fieldsLoading, error: fieldsError } = useFields();

  const isLoading = farmerLoading || fieldsLoading;
  const error = farmerError || fieldsError;
  const refresh = () => { refreshFarmer(); };

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

            {/* Stat cards — now with real field data */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Fields"
                value={
                  summary
                    ? `${summary.total_fields}`
                    : "—"
                }
                icon={<LayoutGrid className="h-5 w-5" />}
                hint={
                  summary?.total_fields
                    ? `${summary.total_fields} field${summary.total_fields !== 1 ? "s" : ""} managed`
                    : undefined
                }
              />
              <StatCard
                label="Field Area"
                value={
                  summary && summary.total_field_area_acres > 0
                    ? `${summary.total_field_area_acres.toFixed(1)} acres`
                    : farmer.farm_area_acres
                      ? `${farmer.farm_area_acres} acres`
                      : "Not set"
                }
                icon={<Ruler className="h-5 w-5" />}
                hint={
                  summary && summary.total_field_area_acres > 0
                    ? "Sum of all field areas"
                    : undefined
                }
              />
              <StatCard
                label="Crops"
                value={
                  summary
                    ? `${Object.keys(summary.crop_distribution).length} crop${
                        Object.keys(summary.crop_distribution).length !== 1
                          ? "s"
                          : ""
                      }`
                    : farmer.current_crop ?? "Not set"
                }
                icon={<Sprout className="h-5 w-5" />}
                hint={
                  farmer.crop_stage
                    ? `Stage: ${farmer.crop_stage}`
                    : undefined
                }
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

            {/* Farm Land Preview — compact static view */}
            {summary && (
              <section className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-primary-600" />
                    <h2 className="text-base font-semibold text-neutral-900">
                      My Farm
                    </h2>
                    {summary.farm_latitude != null && (
                      <span className="text-xs text-success-600">📍 Location set</span>
                    )}
                  </div>
                  <Link href="/my-farm">
                    <Button variant="ghost" size="sm">
                      View My Farm
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <FarmLandView
                  farmName={summary.farm_name}
                  location={summary.location}
                  totalFarmAcres={farmer.farm_area_acres ?? summary.total_area_acres}
                  fields={summary.fields}
                  showAddField={false}
                  compact={summary.fields.length > 0}
                />
              </section>
            )}

            {/* Two-column: Farm overview + Crop distribution */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Farm overview */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4.5 w-4.5 text-primary-600" />
                    <h2 className="text-base font-semibold text-neutral-900">
                      Farm overview
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/my-farm">
                      <Button variant="ghost" size="sm">
                        View farm
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button variant="ghost" size="sm">
                        Edit profile
                      </Button>
                    </Link>
                  </div>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
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
                        Current crop
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
                        Crop stage
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

              {/* Crop distribution */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Sprout className="h-4.5 w-4.5 text-primary-600" />
                  <h2 className="text-base font-semibold text-neutral-900">
                    Crop distribution
                  </h2>
                </div>
                {summary &&
                Object.keys(summary.crop_distribution).length > 0 ? (
                  <CropDistribution
                    distribution={summary.crop_distribution}
                    totalAcres={summary.total_field_area_acres}
                  />
                ) : (
                  <div className="flex items-center gap-3 py-4 text-neutral-400">
                    <Sprout className="h-5 w-5" />
                    <span className="text-sm">
                      No crops planted yet.{" "}
                      <Link
                        href="/my-farm"
                        className="text-primary-600 hover:underline"
                      >
                        Add a field with a crop cycle
                      </Link>
                    </span>
                  </div>
                )}
              </Card>
            </div>

            {/* Field summary cards */}
            {summary && summary.fields.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Field summary
                  </h2>
                  <Link href="/my-farm">
                    <Button variant="ghost" size="sm">
                      View all
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.fields.slice(0, 6).map((field) => (
                    <Link key={field.id} href="/my-farm">
                      <div className="rounded-card border border-neutral-200 bg-surface-card p-3.5 shadow-card transition-all duration-150 hover:shadow-elevated hover:border-primary-300 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-semibold text-neutral-900 truncate">
                            {field.name}
                          </h3>
                          <Badge
                            variant={
                              field.status === "active"
                                ? "success"
                                : field.status === "fallow"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {field.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-neutral-500">
                          {field.area_acres != null && (
                            <span>{field.area_acres} acres</span>
                          )}
                          {field.active_crop_cycle && (
                            <span className="text-primary-700 font-medium">
                              {field.active_crop_cycle.crop_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
              <Link href="/profile">
                <Button variant="primary" size="sm">
                  Set up your profile
                </Button>
              </Link>
            }
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
