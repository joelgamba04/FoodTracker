// src/services/health/healthCache.ts

import type { HealthSummary } from "@/models/healthModel";
import { readSleepSummary } from "./sleepService";
import { readStepsSummary } from "./stepsService";

export async function readHealthSummary(): Promise<HealthSummary> {
  const [steps, sleep] = await Promise.all([
    readStepsSummary().catch(() => null),
    readSleepSummary().catch(() => null),
  ]);

  return {
    steps,
    sleep,
    lastUpdated: new Date().toISOString(),
  };
}
