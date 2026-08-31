/**
 * components/fields/FieldForm.tsx
 *
 * Farmer-friendly form for creating or editing a field.
 * - No lat/lng shown; position is auto-generated near farm center.
 * - Includes optional crop name (triggers a crop cycle on creation).
 * - Warns when the entered area would exceed remaining farm area.
 */

"use client";

import { useState } from "react";
import type { Field, FieldCreate } from "@/types/field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface FieldFormProps {
  field?: Field | null;
  /** Farm latitude for auto-positioning new fields. */
  farmLat?: number | null;
  /** Farm longitude for auto-positioning new fields. */
  farmLng?: number | null;
  /**
   * Remaining unallocated farm area in acres.
   * When set, the form warns if the entered area exceeds this.
   */
  remainingAcres?: number | null;
  isSaving: boolean;
  onSave: (data: FieldCreate & { _cropName?: string }) => void;
  onCancel: () => void;
}

const IRRIGATION_OPTIONS = [
  { value: "canal", label: "Canal" },
  { value: "tubewell", label: "Tubewell" },
  { value: "drip", label: "Drip" },
  { value: "sprinkler", label: "Sprinkler" },
  { value: "rainfed", label: "Rainfed" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "fallow", label: "Fallow" },
  { value: "inactive", label: "Inactive" },
];

const COMMON_CROPS = [
  "Wheat", "Rice", "Cotton", "Sugarcane", "Maize", "Tomato",
  "Potato", "Onion", "Chili", "Okra", "Mango", "Citrus",
  "Sunflower", "Mustard", "Soybean", "Chickpea",
];

function offsetCoord(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

export default function FieldForm({
  field,
  farmLat,
  farmLng,
  remainingAcres,
  isSaving,
  onSave,
  onCancel,
}: FieldFormProps) {
  const [name, setName] = useState(field?.name ?? "");
  const [areaAcres, setAreaAcres] = useState<string>(
    field?.area_acres?.toString() ?? ""
  );
  const [cropName, setCropName] = useState(
    field?.active_crop_cycle?.crop_name ?? ""
  );
  const [soilType, setSoilType] = useState(field?.soil_type ?? "");
  const [irrigation, setIrrigation] = useState(field?.irrigation_method ?? "");
  const [status, setStatus] = useState<Field["status"]>(
    field?.status ?? "active"
  );

  const enteredArea = areaAcres ? Number(areaAcres) : 0;
  const areaExceeds =
    remainingAcres != null &&
    enteredArea > remainingAcres &&
    !field; // only warn for new fields, not edits

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (areaExceeds) return; // guard

    let lat: number | null = field?.latitude ?? null;
    let lng: number | null = field?.longitude ?? null;

    if (!field && farmLat != null && farmLng != null) {
      lat = offsetCoord(farmLat, 0.004);
      lng = offsetCoord(farmLng, 0.004);
    }

    onSave({
      name: name.trim(),
      area_acres: areaAcres ? Number(areaAcres) : null,
      latitude: lat,
      longitude: lng,
      soil_type: soilType.trim() || null,
      irrigation_method: irrigation || null,
      status,
      _cropName: cropName.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <Input
        name="name"
        label="Field name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Wheat Field (North)"
        required
      />

      {/* Area + crop on same row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            name="area_acres"
            label="Area (acres)"
            type="number"
            min={0}
            step="0.1"
            value={areaAcres}
            onChange={(e) => setAreaAcres(e.target.value)}
            placeholder="e.g. 4.5"
          />
          {/* Remaining area hint */}
          {remainingAcres != null && !field && (
            <p
              className={`mt-1 text-xs ${
                areaExceeds ? "text-danger-600 font-medium" : "text-neutral-400"
              }`}
            >
              {areaExceeds
                ? `Only ${remainingAcres.toFixed(1)} acres available`
                : `${remainingAcres.toFixed(1)} acres available`}
            </p>
          )}
        </div>

        {/* Crop name */}
        <div>
          <label
            htmlFor="crop_name"
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Crop <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="crop_name"
            list="common-crops"
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            className="w-full rounded-input border border-neutral-200 bg-surface-input px-3 py-2 text-sm
              text-neutral-900 placeholder:text-neutral-400
              focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
            placeholder="e.g. Wheat"
          />
          <datalist id="common-crops">
            {COMMON_CROPS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Soil + irrigation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="soil_type"
          label="Soil type"
          type="text"
          value={soilType}
          onChange={(e) => setSoilType(e.target.value)}
          placeholder="e.g. Loamy, Clay"
        />

        <Select
          name="irrigation_method"
          label="Irrigation method"
          value={irrigation}
          onChange={(e) => setIrrigation(e.target.value)}
          options={IRRIGATION_OPTIONS}
          placeholder="Select method"
        />
      </div>

      {/* Status */}
      <Select
        name="status"
        label="Field status"
        value={status}
        onChange={(e) => setStatus(e.target.value as Field["status"])}
        options={STATUS_OPTIONS}
      />

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          disabled={areaExceeds}
        >
          {isSaving ? "Saving…" : field ? "Save changes" : "Add field"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
