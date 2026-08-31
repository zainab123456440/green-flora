/**
 * Hooks/useFields.ts
 *
 * Loads farm summary (fields + crop distribution) and exposes
 * CRUD actions for fields and crop cycles.
 *
 * Reuses the same pattern as useFarmer: loading/error state +
 * action callbacks that refresh local state on success.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Field,
  FieldCreate,
  FieldUpdate,
  CropCycle,
  CropCycleCreate,
  CropCycleUpdate,
  FarmSummary,
} from "@/types/field";
import * as fieldApi from "@/services/FieldAPI";

interface UseFieldsResult {
  /** Full farm summary with fields and crop distribution. */
  summary: FarmSummary | null;
  isLoading: boolean;
  error: string | null;
  /** Re-fetch the farm summary. */
  refresh: () => Promise<void>;

  /** Create a new field and refresh. */
  createField: (data: FieldCreate) => Promise<Field>;
  /** Update a field and refresh. */
  updateField: (fieldId: string, updates: FieldUpdate) => Promise<Field>;
  /** Delete a field and refresh. */
  deleteField: (fieldId: string) => Promise<void>;

  /** Create a crop cycle on a field and refresh. */
  createCropCycle: (fieldId: string, data: CropCycleCreate) => Promise<CropCycle>;
  /** Update a crop cycle and refresh. */
  updateCropCycle: (cycleId: string, updates: CropCycleUpdate) => Promise<CropCycle>;
  /** Delete a crop cycle and refresh. */
  deleteCropCycle: (cycleId: string) => Promise<void>;

  /** True while any mutation is in flight. */
  isMutating: boolean;
}

export function useFields(): UseFieldsResult {
  const [summary, setSummary] = useState<FarmSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fieldApi.getFarmSummary();
      setSummary(data);
    } catch {
      setError("Couldn't load your farm data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const wrapMutation = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsMutating(true);
      setError(null);
      try {
        return await fn();
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const createFieldAction = useCallback(
    async (data: FieldCreate): Promise<Field> => {
      const result = await wrapMutation(() => fieldApi.createField(data));
      await load();
      return result;
    },
    [wrapMutation, load]
  );

  const updateFieldAction = useCallback(
    async (fieldId: string, updates: FieldUpdate): Promise<Field> => {
      const result = await wrapMutation(() =>
        fieldApi.updateField(fieldId, updates)
      );
      await load();
      return result;
    },
    [wrapMutation, load]
  );

  const deleteFieldAction = useCallback(
    async (fieldId: string): Promise<void> => {
      await wrapMutation(() => fieldApi.deleteField(fieldId));
      await load();
    },
    [wrapMutation, load]
  );

  const createCropCycleAction = useCallback(
    async (fieldId: string, data: CropCycleCreate): Promise<CropCycle> => {
      const result = await wrapMutation(() =>
        fieldApi.createCropCycle(fieldId, data)
      );
      await load();
      return result;
    },
    [wrapMutation, load]
  );

  const updateCropCycleAction = useCallback(
    async (cycleId: string, updates: CropCycleUpdate): Promise<CropCycle> => {
      const result = await wrapMutation(() =>
        fieldApi.updateCropCycle(cycleId, updates)
      );
      await load();
      return result;
    },
    [wrapMutation, load]
  );

  const deleteCropCycleAction = useCallback(
    async (cycleId: string): Promise<void> => {
      await wrapMutation(() => fieldApi.deleteCropCycle(cycleId));
      await load();
    },
    [wrapMutation, load]
  );

  return {
    summary,
    isLoading,
    error,
    refresh: load,
    createField: createFieldAction,
    updateField: updateFieldAction,
    deleteField: deleteFieldAction,
    createCropCycle: createCropCycleAction,
    updateCropCycle: updateCropCycleAction,
    deleteCropCycle: deleteCropCycleAction,
    isMutating,
  };
}
