import type { StepsSummary } from "@/models/stepsModel";
import {
  ensureStepsAccess,
  readStepsSummary,
} from "@/services/health/stepsService";
import { useCallback, useEffect, useState } from "react";

type StepsState = {
  loading: boolean;
  error: string | null;
  connected: boolean;
  data: StepsSummary | null;
  refresh: () => Promise<void>;
};

export const useSteps = (): StepsState => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<StepsSummary | null>(null);

  const refresh = useCallback(async () => {
    console.log("Refreshing steps data...");
    try {
      setLoading(true);
      setError(null);

      const access = await ensureStepsAccess();
      if (!access.ok) {
        setConnected(false);
        setError(access.reason ?? "Unable to access step data");
        return;
      }
      console.log("Steps access granted");

      setConnected(true);

      const summary = await readStepsSummary();
      setData(summary);
      console.log("Steps summary loaded:", summary);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load steps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    connected,
    data,
    refresh,
  };
};
