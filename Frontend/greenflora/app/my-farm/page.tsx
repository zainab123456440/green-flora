/**
 * app/my-farm/page.tsx
 *
 * My Farm — the farmer's land management command centre.
 *
 * Two-stage UX:
 *  Stage 1  → Set / change farm location (interactive Leaflet map).
 *  Stage 2  → Static farm-land view + field/crop management.
 *
 * The Leaflet world-map is ONLY shown during Stage 1.
 * After location is confirmed the farmer sees the FarmLandView canvas.
 */

"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Sprout,
  X,
  Leaf,
  LocateFixed,
  Map,
  RotateCcw,
  Ruler,
  LayoutGrid,
  CheckCircle,
  Loader2,
  ChevronRight,
  Edit3,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

// Leaflet map — only loaded dynamically when needed.
import FarmMap from "@/components/map/MapDynamic";
// Static farm canvas — main visual after location is set.
import FarmLandView from "@/components/farm/FarmLandView";

import FieldCard from "@/components/fields/FieldCard";
import FieldForm from "@/components/fields/FieldForm";
import CropCycleForm from "@/components/fields/CropCycleForm";

import { useFields } from "@/Hooks/useFields";
import { useFarmer } from "@/Hooks/useFarmer";
import type { Field, FieldCreate, CropCycleCreate } from "@/types/field";

type Mode =
  | "view"          // Normal view — farm canvas visible
  | "set-location"  // Stage 1: show Leaflet map to pick location
  | "add-field"
  | "edit-field"
  | "add-cycle"
  | "edit-cycle";

export default function MyFarmPage() {
  const {
    summary,
    isLoading: fieldsLoading,
    error: fieldsError,
    refresh: refreshFields,
    createField,
    updateField,
    deleteField,
    createCropCycle,
    isMutating,
  } = useFields();

  const {
    farmer,
    isLoading: farmerLoading,
    saveUpdate,
  } = useFarmer();

  const [mode, setMode] = useState<Mode>("view");
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const isLoading = fieldsLoading || farmerLoading;
  const error = fieldsError;

  const showMsg = useCallback((text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // ---------------------------------------------------------------------------
  // Location state — prefer summary coords (live), fallback to farmer
  // ---------------------------------------------------------------------------
  const farmLat = summary?.farm_latitude ?? farmer?.farm_latitude ?? null;
  const farmLng = summary?.farm_longitude ?? farmer?.farm_longitude ?? null;
  const hasLocation = farmLat != null && farmLng != null;

  // ---------------------------------------------------------------------------
  // Area budget
  // ---------------------------------------------------------------------------
  const totalFarmAcres = farmer?.farm_area_acres ?? summary?.total_area_acres ?? null;
  const allocatedAcres = summary?.total_field_area_acres ?? 0;
  const remainingAcres =
    totalFarmAcres != null
      ? Math.max(0, totalFarmAcres - allocatedAcres)
      : null;

  // ---------------------------------------------------------------------------
  // Location handlers
  // ---------------------------------------------------------------------------

  async function saveLocation(lat: number, lng: number) {
    setLocationSaving(true);
    setGeoError(null);
    try {
      await saveUpdate({ farm_latitude: lat, farm_longitude: lng });
      showMsg("Farm location saved.");
      setMode("view");
    } catch {
      showMsg("Failed to save location. Please try again.", "error");
    } finally {
      setLocationSaving(false);
    }
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support location services.");
      return;
    }
    setLocationSaving(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => saveLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setLocationSaving(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please select on the map instead."
            : "Could not get your location. Please select on the map."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function resetLocation() {
    if (!confirm("Reset your farm location? You can set it again anytime.")) return;
    setLocationSaving(true);
    try {
      await saveUpdate({ farm_latitude: null, farm_longitude: null });
      showMsg("Farm location has been reset.");
      setMode("view");
    } catch {
      showMsg("Failed to reset location.", "error");
    } finally {
      setLocationSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Field handlers
  // ---------------------------------------------------------------------------

  function handleFieldSelect(field: Field) {
    setSelectedField((prev) => (prev?.id === field.id ? null : field));
    setMode("view");
  }

  async function handleCreateField(data: FieldCreate & { _cropName?: string }) {
    const { _cropName, ...fieldData } = data;
    try {
      const created = await createField(fieldData);
      // If a crop name was entered, immediately create an active crop cycle.
      if (_cropName && created?.id) {
        try {
          await createCropCycle(created.id, { crop_name: _cropName, status: "active" });
        } catch {
          // Non-fatal: field was created, cycle failed.
        }
      }
      showMsg("Field added.");
      setMode("view");
    } catch {
      showMsg("Failed to add field. Please try again.", "error");
    }
  }

  function handleEditField(field: Field) {
    setEditingField(field);
    setMode("edit-field");
  }

  async function handleSaveFieldEdit(data: FieldCreate & { _cropName?: string }) {
    if (!editingField) return;
    const { _cropName, ...fieldData } = data;
    try {
      await updateField(editingField.id, fieldData);
      showMsg("Field updated.");
      setMode("view");
      setEditingField(null);
      setSelectedField(null);
    } catch {
      showMsg("Failed to update field. Please try again.", "error");
    }
  }

  async function handleDeleteField(field: Field) {
    if (!confirm(`Delete "${field.name}"? This will also remove its crop cycles.`)) return;
    try {
      await deleteField(field.id);
      showMsg("Field deleted.");
      if (selectedField?.id === field.id) setSelectedField(null);
    } catch {
      showMsg("Failed to delete field.", "error");
    }
  }

  async function handleCreateCycle(data: CropCycleCreate) {
    if (!selectedField) return;
    try {
      await createCropCycle(selectedField.id, data);
      showMsg("Crop added.");
      setMode("view");
    } catch {
      showMsg("Failed to add crop.", "error");
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const fields = summary?.fields ?? [];
  const showFieldForm = mode === "add-field" || mode === "edit-field";
  const showCycleForm = mode === "add-cycle";
  const totalFields = summary?.total_fields ?? 0;
  const cropCount = Object.keys(summary?.crop_distribution ?? {}).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AuthGuard>
      <AppShell title="My Farm">
        {isLoading && <LoadingState message="Loading your farm…" />}
        {error && !isLoading && <ErrorState message={error} onRetry={refreshFields} />}

        {!isLoading && !error && summary && (
          <div className="animate-gf-fade-in space-y-5">

            {/* ── Toast message ─────────────────────────────────────────── */}
            {message && (
              <div
                className={`flex items-center gap-2 rounded-card border px-4 py-3 text-sm animate-gf-fade-in ${
                  message.type === "error"
                    ? "border-danger-100 bg-danger-50 text-danger-700"
                    : "border-success-100 bg-success-50 text-success-600"
                }`}
              >
                <CheckCircle className="h-4 w-4 shrink-0" />
                {message.text}
              </div>
            )}

            {/* Demo badge */}
            {fields.some((f) => f.is_demo) && (
              <Badge variant="warning">Demo data</Badge>
            )}

            {/* ── Farm header ───────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">
                  {summary.farm_name ?? "My Farm"}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                  {hasLocation && summary.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {summary.location}
                    </span>
                  )}
                  {totalFarmAcres != null && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      {totalFarmAcres} Acres total
                    </span>
                  )}
                  {totalFields > 0 && (
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      {totalFields} Field{totalFields !== 1 ? "s" : ""}
                    </span>
                  )}
                  {cropCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Sprout className="h-3.5 w-3.5" />
                      {cropCount} Crop{cropCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Location controls */}
              <div className="flex items-center gap-2">
                {hasLocation ? (
                  <>
                    <span className="flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 border border-success-100">
                      <CheckCircle className="h-3 w-3" />
                      Location set
                    </span>
                    <button
                      onClick={() => setMode("set-location")}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Change
                    </button>
                    <button
                      onClick={resetLocation}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-neutral-400">No location set</span>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                STAGE 1 — Location onboarding / picker
            ══════════════════════════════════════════════════════════════ */}

            {/* No location yet — show onboarding card */}
            {!hasLocation && mode !== "set-location" && (
              <Card className="overflow-hidden">
                <div className="flex flex-col items-center py-10 px-4 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
                    <MapPin className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Set Your Farm Location
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-neutral-500 leading-relaxed">
                    Let Green-Flora know where your farm is. This will be used for
                    weather alerts and other location-based features.
                  </p>
                  {geoError && (
                    <div className="mt-4 max-w-sm rounded-lg bg-danger-50 px-4 py-2.5 text-sm text-danger-600 border border-danger-100">
                      {geoError}
                    </div>
                  )}
                  <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={useBrowserLocation}
                      isLoading={locationSaving}
                    >
                      <LocateFixed className="h-4.5 w-4.5" />
                      Use My Location
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setMode("set-location")}
                    >
                      <Map className="h-4.5 w-4.5" />
                      Select on Map
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Interactive Leaflet map — only when picking location */}
            {mode === "set-location" && (
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">
                      {hasLocation ? "Change farm location" : "Set farm location"}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Tap anywhere on the map to place your farm
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasLocation && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={useBrowserLocation}
                        isLoading={locationSaving}
                      >
                        <LocateFixed className="h-3.5 w-3.5" />
                        Use My Location
                      </Button>
                    )}
                    <button
                      onClick={() => setMode("view")}
                      className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {locationSaving && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-primary-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving location…
                  </div>
                )}
                <FarmMap
                  farmLat={farmLat}
                  farmLng={farmLng}
                  farmName={summary.farm_name}
                  fields={fields}
                  selectedFieldId={selectedField?.id ?? null}
                  onFieldSelect={handleFieldSelect}
                  onFarmLocationPick={(lat, lng) => saveLocation(lat, lng)}
                  farmPickMode
                  height="380px"
                  zoom={hasLocation ? 14 : 12}
                />
              </Card>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STAGE 2 — Static farm canvas (location confirmed)
            ══════════════════════════════════════════════════════════════ */}

            {hasLocation && mode !== "set-location" && (
              <>
                {/* Farm land visualization */}
                <FarmLandView
                  farmName={summary.farm_name}
                  location={summary.location}
                  totalFarmAcres={totalFarmAcres}
                  fields={fields}
                  onAddField={
                    mode === "view" ? () => setMode("add-field") : undefined
                  }
                  showAddField={mode === "view"}
                />

                {/* Interactive map — shows field markers on the real map */}
                {fields.length > 0 && (
                  <div className="mt-5">
                    <FarmMap
                      farmLat={farmLat}
                      farmLng={farmLng}
                      farmName={summary.farm_name}
                      fields={fields}
                      selectedFieldId={selectedField?.id ?? null}
                      onFieldSelect={handleFieldSelect}
                      height="340px"
                      zoom={15}
                    />
                  </div>
                )}

                {/* ── Add / Edit field form ─────────────────────────────── */}
                {showFieldForm && (
                  <Card>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {mode === "add-field" ? "Add new field" : "Edit field"}
                      </h3>
                      <button
                        onClick={() => { setMode("view"); setEditingField(null); }}
                        className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <FieldForm
                      field={editingField}
                      farmLat={farmLat}
                      farmLng={farmLng}
                      remainingAcres={remainingAcres}
                      isSaving={isMutating}
                      onSave={
                        mode === "add-field"
                          ? handleCreateField
                          : handleSaveFieldEdit
                      }
                      onCancel={() => { setMode("view"); setEditingField(null); }}
                    />
                  </Card>
                )}

                {/* ── Two-column: field list + field detail ─────────────── */}
                <div className="grid gap-5 lg:grid-cols-5">
                  {/* Field list */}
                  <div className="lg:col-span-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-neutral-900">
                        Fields ({fields.length})
                      </h2>
                      {mode === "view" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setMode("add-field")}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add field
                        </Button>
                      )}
                    </div>

                    {fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center">
                        <span className="text-4xl mb-3">🌾</span>
                        <p className="text-sm font-medium text-neutral-600">
                          No fields yet
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          Add a field to start managing your crops
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          className="mt-4"
                          onClick={() => setMode("add-field")}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add field
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field, idx) => (
                          <FieldCard
                            key={field.id}
                            field={field}
                            index={idx}
                            isSelected={selectedField?.id === field.id}
                            onSelect={handleFieldSelect}
                            onEdit={handleEditField}
                            onDelete={handleDeleteField}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Field detail panel */}
                  <div className="lg:col-span-2">
                    {selectedField ? (
                      <Card className="sticky top-20">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-neutral-900">
                            {selectedField.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={
                                selectedField.status === "active"
                                  ? "success"
                                  : selectedField.status === "fallow"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {selectedField.status}
                            </Badge>
                            <button
                              onClick={() => handleEditField(selectedField)}
                              className="rounded p-1 text-neutral-400 hover:text-neutral-700"
                              title="Edit field"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <dl className="space-y-2 text-sm">
                          {selectedField.area_acres != null && (
                            <div className="flex justify-between">
                              <dt className="text-neutral-500">Area</dt>
                              <dd className="font-medium text-neutral-900">
                                {selectedField.area_acres} acres
                              </dd>
                            </div>
                          )}
                          {selectedField.soil_type && (
                            <div className="flex justify-between">
                              <dt className="text-neutral-500">Soil</dt>
                              <dd className="text-neutral-900">{selectedField.soil_type}</dd>
                            </div>
                          )}
                          {selectedField.irrigation_method && (
                            <div className="flex justify-between">
                              <dt className="text-neutral-500">Irrigation</dt>
                              <dd className="text-neutral-900">
                                {selectedField.irrigation_method}
                              </dd>
                            </div>
                          )}
                        </dl>

                        {/* Active crop */}
                        {selectedField.active_crop_cycle ? (
                          <div className="mt-4 rounded-lg bg-primary-50 border border-primary-100 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Sprout className="h-4 w-4 text-primary-600" />
                              <span className="text-xs font-semibold text-primary-800">
                                Current crop
                              </span>
                            </div>
                            <p className="text-sm font-medium text-primary-900">
                              {selectedField.active_crop_cycle.crop_name}
                              {selectedField.active_crop_cycle.variety && (
                                <span className="text-primary-600">
                                  {" "}({selectedField.active_crop_cycle.variety})
                                </span>
                              )}
                            </p>
                            {selectedField.active_crop_cycle.crop_stage && (
                              <p className="text-xs text-primary-600 mt-0.5">
                                Stage: {selectedField.active_crop_cycle.crop_stage}
                              </p>
                            )}
                          </div>
                        ) : (
                          !showCycleForm && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="mt-4"
                              onClick={() => setMode("add-cycle")}
                            >
                              <Sprout className="h-3.5 w-3.5" />
                              Add crop
                            </Button>
                          )
                        )}

                        {/* Crop cycle form */}
                        {showCycleForm && (
                          <div className="mt-4 border-t border-neutral-100 pt-4">
                            <h4 className="mb-3 text-xs font-semibold text-neutral-700">
                              Add crop cycle
                            </h4>
                            <CropCycleForm
                              isSaving={isMutating}
                              onSave={handleCreateCycle}
                              onCancel={() => setMode("view")}
                            />
                          </div>
                        )}
                      </Card>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
                        <ChevronRight className="mb-2 h-6 w-6 text-neutral-300" />
                        <p className="text-sm text-neutral-500">
                          Select a field to see details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* Empty — no summary at all */}
        {!isLoading && !error && !summary && (
          <EmptyState
            icon={<Sprout className="h-5 w-5" />}
            title="No farm data"
            description="Set up your farm profile first, then add fields."
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
