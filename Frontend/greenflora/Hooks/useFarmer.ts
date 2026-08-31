/**
 * hooks/useFarmer.ts
 *
 * Loads the current farmer's profile and exposes loading/error state
 * plus a `saveUpdate` action, so pages don't each duplicate their
 * own fetch/loading/error boilerplate.
 *
 * Also exposes `completeness` — a 0-100 score calculated from how
 * many of the core profile fields are filled in.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getFarmer, updateFarmer as updateFarmerApi } from "@/services/FarmerAPI";
import type { Farmer, FarmerUpdate } from "@/types/farmer";
import { PROFILE_FIELDS } from "@/types/farmer";
import { calculateCompleteness } from "@/lib/dataStates";

interface UseFarmerResult {
  farmer: Farmer | null;
  isLoading: boolean;
  error: string | null;
  /** Re-fetch the farmer profile from the backend. */
  refresh: () => Promise<void>;
  /** Save a partial update and refresh local state on success. */
  saveUpdate: (updates: FarmerUpdate) => Promise<void>;
  /** True while a saveUpdate() call is in flight. */
  isSaving: boolean;
  /** Profile completeness percentage (0–100). */
  completeness: number;
}

export function useFarmer(): UseFarmerResult {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFarmer();
      setFarmer(data);
    } catch {
      setError("Couldn't load your farm profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveUpdate = useCallback(async (updates: FarmerUpdate) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateFarmerApi(updates);
      setFarmer(updated);
    } catch {
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const completeness = useMemo(() => {
    if (!farmer) return 0;
    return calculateCompleteness(
      farmer as unknown as Record<string, unknown>,
      [...PROFILE_FIELDS]
    );
  }, [farmer]);

  return {
    farmer,
    isLoading,
    error,
    refresh: load,
    saveUpdate,
    isSaving,
    completeness,
  };
}
