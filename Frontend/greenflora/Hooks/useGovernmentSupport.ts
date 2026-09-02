/**
 * Hooks/useGovernmentSupport.ts
 *
 * Loads the active government support record (official farmer
 * helpline) from the backend for the dashboard card. Follows the
 * same loading/error/refresh pattern as useMarket and useFields.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { getGovernmentSupport } from "@/services/SupportAPI";
import type { GovernmentSupportInfo } from "@/types/support";

interface UseGovernmentSupportResult {
  support: GovernmentSupportInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGovernmentSupport(): UseGovernmentSupportResult {
  const [support, setSupport] = useState<GovernmentSupportInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getGovernmentSupport();
      setSupport(result.support);
    } catch {
      setSupport(null);
      setError("Couldn't load government support information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    support,
    isLoading,
    error,
    refresh: load,
  };
}
