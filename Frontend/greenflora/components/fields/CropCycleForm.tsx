/**
 * components/fields/CropCycleForm.tsx
 *
 * Form for creating or editing a crop cycle on a field.
 */

"use client";

import { useState } from "react";
import type { CropCycle, CropCycleCreate } from "@/types/field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface CropCycleFormProps {
  cycle?: CropCycle | null;
  isSaving: boolean;
  onSave: (data: CropCycleCreate) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "harvested", label: "Harvested" },
  { value: "cancelled", label: "Cancelled" },
];

const COMMON_CROPS = [
  "Wheat",
  "Rice",
  "Cotton",
  "Sugarcane",
  "Maize",
  "Tomato",
  "Potato",
  "Onion",
  "Chili",
  "Okra",
  "Mango",
  "Citrus",
];

export default function CropCycleForm({
  cycle,
  isSaving,
  onSave,
  onCancel,
}: CropCycleFormProps) {
  const [cropName, setCropName] = useState(cycle?.crop_name ?? "");
  const [variety, setVariety] = useState(cycle?.variety ?? "");
  const [cropStage, setCropStage] = useState(cycle?.crop_stage ?? "");
  const [plantingDate, setPlantingDate] = useState(
    cycle?.planting_date ?? ""
  );
  const [harvestDate, setHarvestDate] = useState(
    cycle?.expected_harvest_date ?? ""
  );
  const [status, setStatus] = useState(cycle?.status ?? "active");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      crop_name: cropName.trim(),
      variety: variety.trim() || null,
      crop_stage: cropStage.trim() || null,
      planting_date: plantingDate || null,
      expected_harvest_date: harvestDate || null,
      status: status as "active" | "harvested" | "cancelled",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="crop_name"
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Crop
          </label>
          <input
            id="crop_name"
            list="common-crops"
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            className="w-full rounded-input border border-neutral-200 bg-surface-input px-3 py-2 text-sm text-neutral-900
              placeholder:text-neutral-400
              focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
            placeholder="e.g. Wheat"
            required
          />
          <datalist id="common-crops">
            {COMMON_CROPS.map((crop) => (
              <option key={crop} value={crop} />
            ))}
          </datalist>
        </div>

        <Input
          name="variety"
          label="Variety"
          type="text"
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          placeholder="e.g. FSD-08"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="crop_stage"
          label="Crop stage"
          type="text"
          value={cropStage}
          onChange={(e) => setCropStage(e.target.value)}
          placeholder="e.g. Vegetative, Flowering"
        />

        <Select
          name="status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "active" | "harvested" | "cancelled")}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="planting_date"
          label="Planting date"
          type="date"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
        />

        <Input
          name="expected_harvest_date"
          label="Expected harvest"
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
          {isSaving
            ? "Saving…"
            : cycle
              ? "Save changes"
              : "Add crop cycle"}
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
