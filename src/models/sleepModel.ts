// src/models/sleepModel.ts

export type SleepStageName =
  | "awake"
  | "light"
  | "deep"
  | "rem"
  | "asleep"
  | "unknown";

export type SleepStageSegment = {
  stage: SleepStageName;
  startTime: string;
  endTime: string;
  hours: number;
};

export type SleepStageTotals = {
  awakeHours: number;
  lightHours: number;
  deepHours: number;
  remHours: number;
  unspecifiedSleepHours: number;
};

export type SleepSummary = {
  /**
   * Actual sleep for the most recent sleep episode/day.
   * Awake periods are excluded when stage data is available.
   */
  lastNightHours: number;

  lastNightStart?: string;
  lastNightEnd?: string;

  /**
   * Stage totals for the same sleep episode/day represented by lastNightHours.
   */
  awakeHours: number;
  lightHours: number;
  deepHours: number;
  remHours: number;
  unspecifiedSleepHours: number;

  /**
   * Normalized stage timeline for the most recent sleep episode/day.
   */
  lastNightStages: SleepStageSegment[];

  /**
   * Seven wake-days, oldest -> newest.
   * A sleep session that starts before midnight and ends after midnight is
   * attributed to the day on which the user wakes up.
   */
  last7Days: SleepDay[];
};

export type SleepDay = {
  date: string; // YYYY-MM-DD
  hours: number;
};
