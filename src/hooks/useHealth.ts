// src/hooks/useHealth.ts

import { useCallback, useState } from "react";

import type { HealthSummary } from "@/models/healthModel";

import {
    loadHealthCache,
    saveHealthCache,
} from "@/services/health/healthCache";

import { readHealthSummary } from "@/services/health/healthService";

type HealthState = {
  loading: boolean;
  error: string | null;

  data: HealthSummary | null;

  refreshHealth: () => Promise<void>;
  loadCachedHealth: () => Promise<void>;

  reset: () => void;
};

export const useHealth = (): HealthState => {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<HealthSummary | null>(null);

  const loadCachedHealth = useCallback(async () => {
    try {
      const cached = await loadHealthCache();

      if (cached) {
        setData(cached);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load cached health data");
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const summary = await readHealthSummary();

      setData(summary);

      await saveHealthCache(summary);
    } catch (err: any) {
      setError(err?.message ?? "Failed to refresh health data");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,

    refreshHealth,
    loadCachedHealth,

    reset,
  };
};
