// src/models/sleepModel.ts

export type SleepSummary = {
  lastNightHours: number; // e.g. 6.5
  lastNightStart?: string; // ISO
  lastNightEnd?: string; // ISO
  last7Days: SleepDay[];
};

export type SleepDay = {
  date: string; // YYYY-MM-DD
  hours: number;
};
