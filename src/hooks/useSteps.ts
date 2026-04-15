// src/hooks/useSteps.ts

import type { StepsSummary } from "@/models/stepsModel";
import { readStepsSummary } from "@/services/health/stepsService";
import { useCallback, useState } from "react";

type StepsState = {
  loading: boolean;
  error: string | null;
  data: StepsSummary | null;
  loadSteps: () => Promise<void>;
  reset: () => void;
};

export const useSteps = (): StepsState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StepsSummary | null>(null);

  const loadSteps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const summary = await readStepsSummary();
      setData(summary);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load steps");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    loadSteps,
    reset,
  };
};
