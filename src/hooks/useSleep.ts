// src/hooks/useSleep.ts

import type { SleepSummary } from "@/models/sleepModel";
import { readSleepSummary } from "@/services/health/sleepService";
import { useCallback, useState } from "react";

export const useSleep = () => {
  const [data, setData] = useState<SleepSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSleep = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await readSleepSummary();
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, loadSleep };
};
