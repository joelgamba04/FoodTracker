// src/hooks/hydrationHooks.ts

import { useHydration } from "@/context/hydrationContext";
import { useProfile } from "@/context/ProfileContext";
import { getTodayWindow } from "@/utils/date";
import { useMemo } from "react";

const toMs = (ts: any): number => {
  if (typeof ts === "number") return ts;
  const d = new Date(ts);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
};

export const useHydrationToday = () => {
  const { entries } = useHydration(); // adjust names to your context
  const { rdi } = useProfile();
  const goalMl = rdi?.Water?.amount ?? 0;

  const { start, end } = getTodayWindow();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const totalMl = useMemo(() => {
    let total = 0;

    for (const e of entries ?? []) {
      const ts = toMs(e.timestamp);
      if (ts >= startMs && ts < endMs) {
        // be resilient to naming changes
        const ml = e.amount_ml as number;
        total += Number.isFinite(ml) ? ml : 0;
      }
    }

    return total;
  }, [entries, startMs, endMs]);

  const progress = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;

  return { totalMl, goalMl, progress };
};
