/**
 * components/FarmerProfileForm.tsx
 *
 * Editable form for the farmer's profile. Controlled locally, and
 * only calls onSave with the fields that actually changed — matching
 * the backend's partial-update contract (FarmerUpdateRequest).
 *
 * Uses Green Flora UI primitives for consistent design-token styling.
 */

"use client";

import { useEffect, useState } from "react";
import type {
  Farmer,
  FarmerUpdate,
  PreferredLanguage,
  IrrigationMethod,
  OwnershipStatus,
} from "@/types/farmer";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface FarmerProfileFormProps {
  farmer: Farmer;
  isSaving: boolean;
  onSave: (updates: FarmerUpdate) => void;
}

const LANGUAGE_OPTIONS: { value: PreferredLanguage; label: string }[] = [
  { value: "ur", label: "Urdu" },
  { value: "en", label: "English" },
  { value: "pa", label: "Punjabi" },
  { value: "sd", label: "Sindhi" },
];

const IRRIGATION_OPTIONS: { value: string; label: string }[] = [
  { value: "canal", label: "Canal" },
  { value: "tubewell", label: "Tubewell" },
  { value: "drip", label: "Drip" },
  { value: "sprinkler", label: "Sprinkler" },
  { value: "rainfed", label: "Rainfed" },
];

const OWNERSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "owned", label: "Owned" },
  { value: "leased", label: "Leased" },
  { value: "shared", label: "Shared" },
];

type FormState = Omit<Farmer, "id" | "is_demo">;

function toFormState(farmer: Farmer): FormState {
  const { id: _id, is_demo: _isDemo, ...rest } = farmer;
  return rest;
}

export default function FarmerProfileForm({
  farmer,
  isSaving,
  onSave,
}: FarmerProfileFormProps) {
  const [form, setForm] = useState<FormState>(toFormState(farmer));

  useEffect(() => {
    setForm(toFormState(farmer));
  }, [farmer]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const updates: FarmerUpdate = {};
    const original = toFormState(farmer);
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      if (form[key] !== original[key]) {
        (updates as Record<string, unknown>)[key] = form[key];
      }
    });

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Personal information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="name"
            label="Full name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />

          <Input
            name="phone_number"
            label="Phone number"
            type="tel"
            value={form.phone_number ?? ""}
            onChange={(e) => handleChange("phone_number", e.target.value)}
            placeholder="+92-XXX-XXXXXXX"
          />

          <Select
            name="preferred_language"
            label="Preferred language"
            value={form.preferred_language}
            onChange={(e) =>
              handleChange(
                "preferred_language",
                e.target.value as PreferredLanguage
              )
            }
            options={LANGUAGE_OPTIONS}
          />
        </div>
      </div>

      {/* Farm Information */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Farm information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="farm_name"
            label="Farm name"
            type="text"
            value={form.farm_name ?? ""}
            onChange={(e) => handleChange("farm_name", e.target.value)}
            placeholder="e.g. Asif Farm"
          />

          <Input
            name="location"
            label="Farm location"
            type="text"
            value={form.location ?? ""}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="e.g. Punjab, Pakistan"
          />

          <Input
            name="farm_area_acres"
            label="Farm area (acres)"
            type="number"
            min={0}
            step="0.1"
            value={form.farm_area_acres ?? ""}
            onChange={(e) =>
              handleChange(
                "farm_area_acres",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />

          <Select
            name="ownership_status"
            label="Ownership"
            value={form.ownership_status ?? ""}
            onChange={(e) =>
              handleChange(
                "ownership_status",
                (e.target.value === "" ? null : e.target.value) as OwnershipStatus
              )
            }
            options={OWNERSHIP_OPTIONS}
            placeholder="Select ownership"
          />

          <Input
            name="soil_type"
            label="Soil type"
            type="text"
            value={form.soil_type ?? ""}
            onChange={(e) => handleChange("soil_type", e.target.value)}
            placeholder="e.g. Loamy, Sandy, Clay"
          />

          <Select
            name="irrigation_method"
            label="Irrigation method"
            value={form.irrigation_method ?? ""}
            onChange={(e) =>
              handleChange(
                "irrigation_method",
                (e.target.value === "" ? null : e.target.value) as IrrigationMethod
              )
            }
            options={IRRIGATION_OPTIONS}
            placeholder="Select method"
          />
        </div>
      </div>

      {/* Crop Information */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Crop information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="current_crop"
            label="Current crop"
            type="text"
            value={form.current_crop ?? ""}
            onChange={(e) => handleChange("current_crop", e.target.value)}
            placeholder="e.g. Wheat, Rice, Cotton"
          />

          <Input
            name="crop_stage"
            label="Crop stage"
            type="text"
            value={form.crop_stage ?? ""}
            onChange={(e) => handleChange("crop_stage", e.target.value)}
            placeholder="e.g. Vegetative, Flowering"
          />

          <Input
            name="budget_pkr"
            label="Budget (PKR)"
            type="number"
            min={0}
            step="1000"
            value={form.budget_pkr ?? ""}
            onChange={(e) =>
              handleChange(
                "budget_pkr",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
