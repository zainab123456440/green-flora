/**
 * app/profile/page.tsx
 *
 * Farmer Profile page — personal information, farm details, crop info.
 * Separate from My Farm (fields/map) and Dashboard (overview).
 *
 * Uses the existing FarmerProfileForm + useFarmer hook.
 */

"use client";

import { useState } from "react";
import { User, Leaf, CheckCircle } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import FarmerProfileForm from "@/components/FarmerProfileForm";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

import { useFarmer } from "@/Hooks/useFarmer";
import type { FarmerUpdate } from "@/types/farmer";

export default function ProfilePage() {
  const { farmer, isLoading, error, refresh, saveUpdate, isSaving, completeness } =
    useFarmer();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSave(updates: FarmerUpdate) {
    try {
      await saveUpdate(updates);
      setSuccessMsg("Profile saved successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      // Error is already handled by the hook.
    }
  }

  return (
    <AuthGuard>
      <AppShell title="Farmer Profile">
        {/* Loading */}
        {isLoading && <LoadingState message="Loading your profile…" />}

        {/* Error */}
        {error && !isLoading && <ErrorState message={error} onRetry={refresh} />}

        {/* Success */}
        {!isLoading && !error && farmer && (
          <div className="animate-gf-fade-in">
            <ProfileHeader
              name={farmer.name}
              completeness={completeness}
              isDemo={farmer.is_demo}
            />

            {/* Success message */}
            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-card border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-600 animate-gf-fade-in">
                <CheckCircle className="h-4 w-4" />
                {successMsg}
              </div>
            )}

            {/* Profile form */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-primary-600" />
                <h2 className="text-base font-semibold text-neutral-900">
                  Edit profile
                </h2>
                {farmer.is_demo && (
                  <Badge variant="warning">Demo data</Badge>
                )}
              </div>

              <FarmerProfileForm
                farmer={farmer}
                isSaving={isSaving}
                onSave={handleSave}
              />
            </Card>

            {/* Info card */}
            <Card className="mt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <Leaf className="h-4.5 w-4.5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    About your profile
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                    Your profile helps Green-Flora provide personalized recommendations
                    for your farm. The more complete your profile, the better the
                    suggestions for crops, weather alerts, and market insights.
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    Farm location and field details are managed separately in{" "}
                    <a
                      href="/my-farm"
                      className="text-primary-600 hover:underline"
                    >
                      My Farm
                    </a>
                    .
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty — no farmer data */}
        {!isLoading && !error && !farmer && (
          <EmptyState
            icon={<User className="h-5 w-5" />}
            title="No profile found"
            description="Your farmer profile hasn't been created yet. Please visit the dashboard first."
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
