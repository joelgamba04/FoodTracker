// src/models/healthModel.ts

import type { SleepSummary } from "./sleepModel";
import type { StepsSummary } from "./stepsModel";

export type HealthSummary = {
  steps: StepsSummary | null;
  sleep: SleepSummary | null;
  lastUpdated: string | null;
};
