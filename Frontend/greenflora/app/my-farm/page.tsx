/**
 * app/my-farm/page.tsx
 *
 * Farmer profile page — the farmer's agricultural identity.
 * Phase 1 establishes the foundation with:
 * - Profile header with completeness indicator
 * - Personal information section
 * - Farm information section
 * - Crop information section
 * - Editable form for all fields
 * - Graceful handling of missing/partial data
 */

"use client";

import { useState } from "react";
import {
  MapPin,
  Ruler,
  Sprout,
  Droplets,
  Tractor,
  Phone,
  Globe,
  Home,
  Layers,
  Calendar,
  Wallet,
  Check,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileSection from "@/components/profile/ProfileSection";
import FarmerProfileForm from "@/components/FarmerProfileForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { useFarmer } from "@/Hooks/useFarmer";
import { calculateCompleteness, displayValue, formatCurrency } from "@/lib/dataStates";
import { PROFILE_FIELDS } from "@/types/farmer";

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-neutral-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <p className={`text-sm ${value ? "text-neutral-900" : "text-neutral-400 italic"}`}>
          {value ?? "Not set"}
        </p>
      </div>
    </div>
  );
}

export default function MyFarmPage() {
  const { farmer, isLoading, error, refresh, saveUpdate, isSaving } =
    useFarmer();
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function handleSave(updates: Parameters<typeof saveUpdate>[0]) {
    setSaveMessage(null);
    await saveUpdate(updates);
    setSaveMessage("Changes saved successfully.");
    setIsEditing(false);
    setTimeout(() => setSaveMessage(null), 4000);
  }

  return (
    <AuthGuard>
    <AppShell title="My Farm">
      {/* Loading */}
      {isLoading && <LoadingState message="Loading your farm profile…" />}

      {/* Error */}
      {error && !isLoading && (
        <ErrorState message={error} onRetry={refresh} />
      )}

      {/* Success */}
      {!isLoading && !error && farmer && (
        <div className="animate-gf-fade-in">
          <ProfileHeader
            name={farmer.name}
            completeness={calculateCompleteness(
              farmer as unknown as Record<string, unknown>,
              [...PROFILE_FIELDS]
            )}
            isDemo={farmer.is_demo}
          />

          {/* Save success message */}
          {saveMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-card border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-600 animate-gf-fade-in">
              <Check className="h-4 w-4" />
              {saveMessage}
            </div>
          )}

          {isEditing ? (
            /* Edit mode — show form */
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-900">
                  Edit profile
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
              <FarmerProfileForm
                farmer={farmer}
                isSaving={isSaving}
                onSave={handleSave}
              />
            </Card>
          ) : (
            /* View mode — show profile details */
            <div className="space-y-4">
              {/* Personal Information */}
              <ProfileSection
                title="Personal information"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                }
              >
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <DetailRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone number"
                      value={farmer.phone_number}
                    />
                    <DetailRow
                      icon={<Globe className="h-4 w-4" />}
                      label="Preferred language"
                      value={
                        { ur: "Urdu", en: "English", pa: "Punjabi", sd: "Sindhi" }[
                          farmer.preferred_language
                        ] ?? farmer.preferred_language
                      }
                    />
                  </div>
                </div>
              </ProfileSection>

              {/* Farm Information */}
              <ProfileSection title="Farm information">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <DetailRow
                      icon={<Home className="h-4 w-4" />}
                      label="Farm name"
                      value={farmer.farm_name}
                    />
                    <DetailRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Location"
                      value={farmer.location}
                    />
                    <DetailRow
                      icon={<Ruler className="h-4 w-4" />}
                      label="Farm area"
                      value={
                        farmer.farm_area_acres
                          ? `${farmer.farm_area_acres} acres`
                          : null
                      }
                    />
                  </div>
                  <div>
                    <DetailRow
                      icon={<Layers className="h-4 w-4" />}
                      label="Ownership"
                      value={farmer.ownership_status}
                    />
                    <DetailRow
                      icon={<Tractor className="h-4 w-4" />}
                      label="Soil type"
                      value={farmer.soil_type}
                    />
                    <DetailRow
                      icon={<Droplets className="h-4 w-4" />}
                      label="Irrigation method"
                      value={farmer.irrigation_method}
                    />
                  </div>
                </div>
              </ProfileSection>

              {/* Crop Information */}
              <ProfileSection title="Crop information">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <DetailRow
                      icon={<Sprout className="h-4 w-4" />}
                      label="Current crop"
                      value={farmer.current_crop}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Crop stage"
                      value={farmer.crop_stage}
                    />
                  </div>
                  <div>
                    <DetailRow
                      icon={<Wallet className="h-4 w-4" />}
                      label="Budget"
                      value={
                        farmer.budget_pkr
                          ? formatCurrency(farmer.budget_pkr)
                          : null
                      }
                    />
                  </div>
                </div>
              </ProfileSection>
            </div>
          )}
        </div>
      )}

      {/* Empty — no farmer data */}
      {!isLoading && !error && !farmer && (
        <EmptyState
          icon={<Sprout className="h-5 w-5" />}
          title="No farm profile yet"
          description="Set up your farm profile to get started with Green Flora."
        />
      )}
    </AppShell>
    </AuthGuard>
  );
}
