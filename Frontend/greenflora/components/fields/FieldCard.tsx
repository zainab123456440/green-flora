/**
 * components/fields/FieldCard.tsx
 *
 * Displays a single field in a card with crop cycle info.
 * Click to select, with edit/delete actions.
 */

"use client";

import {
  Ruler,
  Sprout,
  Calendar,
  Edit3,
  Trash2,
  Droplets,
  Layers,
} from "lucide-react";
import type { Field } from "@/types/field";
import Badge from "@/components/ui/Badge";

interface FieldCardProps {
  field: Field;
  isSelected: boolean;
  index: number;
  onSelect: (field: Field) => void;
  onEdit: (field: Field) => void;
  onDelete: (field: Field) => void;
}

const STATUS_BADGES: Record<string, { variant: "success" | "warning" | "neutral"; label: string }> = {
  active: { variant: "success", label: "Active" },
  fallow: { variant: "warning", label: "Fallow" },
  inactive: { variant: "neutral", label: "Inactive" },
};

const FIELD_COLORS = [
  "bg-primary-700",
  "bg-primary-600",
  "bg-primary-500",
  "bg-primary-400",
  "bg-primary-900",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-info-600",
];

export default function FieldCard({
  field,
  isSelected,
  index,
  onSelect,
  onEdit,
  onDelete,
}: FieldCardProps) {
  const status = STATUS_BADGES[field.status] ?? STATUS_BADGES.active;
  const cycle = field.active_crop_cycle;
  const colorClass = FIELD_COLORS[index % FIELD_COLORS.length];

  return (
    <div
      onClick={() => onSelect(field)}
      className={`group relative cursor-pointer rounded-card border bg-surface-card p-4 transition-all duration-150
        ${
          isSelected
            ? "border-primary-600 shadow-elevated ring-1 ring-primary-600"
            : "border-neutral-200 shadow-card hover:border-primary-300 hover:shadow-elevated"
        }
      `}
    >
      {/* Color indicator */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${colorClass}`}
      />

      <div className="pl-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 truncate">
                {field.name}
              </h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          {/* Actions (visible on hover or selected) */}
          <div
            className={`flex items-center gap-1 transition-opacity ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(field);
              }}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              title="Edit field"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(field);
              }}
              className="rounded p-1 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
              title="Delete field"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          {field.area_acres != null && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {field.area_acres} acres
            </span>
          )}
          {field.irrigation_method && (
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {field.irrigation_method}
            </span>
          )}
          {field.soil_type && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {field.soil_type}
            </span>
          )}
        </div>

        {/* Active crop cycle */}
        {cycle && (
          <div className="mt-2.5 flex items-center gap-2 rounded-md bg-primary-50 px-2.5 py-1.5">
            <Sprout className="h-3.5 w-3.5 text-primary-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary-800 truncate">
                {cycle.crop_name}
                {cycle.variety && (
                  <span className="text-primary-600"> ({cycle.variety})</span>
                )}
              </p>
              <p className="text-[10px] text-primary-600">
                {cycle.crop_stage ?? "No stage set"}
                {cycle.planting_date && (
                  <span className="ml-1.5 flex items-center gap-0.5 inline-flex">
                    <Calendar className="h-2.5 w-2.5" />
                    {cycle.planting_date}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
