// src/services/health/sleepUtils.ts

import type {
  SleepStageName,
  SleepStageSegment,
  SleepStageTotals,
} from "@/models/sleepModel";

const HOUR_MS = 60 * 60 * 1000;

export type TimeInterval = {
  startMs: number;
  endMs: number;
};

export const roundHours = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Number(value.toFixed(2));
};

export const toInterval = (
  startValue: string | Date,
  endValue: string | Date,
): TimeInterval | null => {
  const startMs = new Date(startValue).getTime();
  const endMs = new Date(endValue).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  if (endMs <= startMs) return null;

  return { startMs, endMs };
};

export const mergeIntervals = (
  intervals: TimeInterval[],
): TimeInterval[] => {
  if (!intervals.length) return [];

  const sorted = intervals
    .filter((item) => item.endMs > item.startMs)
    .slice()
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  if (!sorted.length) return [];

  const merged: TimeInterval[] = [{ ...sorted[0] }];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = merged[merged.length - 1];

    if (current.startMs <= previous.endMs) {
      previous.endMs = Math.max(previous.endMs, current.endMs);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
};

export const intervalHours = (intervals: TimeInterval[]): number => {
  const totalMs = mergeIntervals(intervals).reduce(
    (sum, item) => sum + (item.endMs - item.startMs),
    0,
  );

  return roundHours(totalMs / HOUR_MS);
};

export const createStageSegment = (
  stage: SleepStageName,
  startTime: string,
  endTime: string,
): SleepStageSegment | null => {
  const interval = toInterval(startTime, endTime);

  if (!interval) return null;

  return {
    stage,
    startTime: new Date(interval.startMs).toISOString(),
    endTime: new Date(interval.endMs).toISOString(),
    hours: roundHours((interval.endMs - interval.startMs) / HOUR_MS),
  };
};

export const emptyStageTotals = (): SleepStageTotals => ({
  awakeHours: 0,
  lightHours: 0,
  deepHours: 0,
  remHours: 0,
  unspecifiedSleepHours: 0,
});

/**
 * Each stage type is unioned independently. This prevents duplicate samples
 * for the same stage/source interval from inflating the result.
 */
export const calculateStageTotals = (
  segments: SleepStageSegment[],
): SleepStageTotals => {
  const intervalsFor = (stage: SleepStageName): TimeInterval[] =>
    segments
      .filter((item) => item.stage === stage)
      .map((item) => toInterval(item.startTime, item.endTime))
      .filter((item): item is TimeInterval => item !== null);

  return {
    awakeHours: intervalHours(intervalsFor("awake")),
    lightHours: intervalHours(intervalsFor("light")),
    deepHours: intervalHours(intervalsFor("deep")),
    remHours: intervalHours(intervalsFor("rem")),
    unspecifiedSleepHours: intervalHours(intervalsFor("asleep")),
  };
};

export const isSleepingStage = (stage: SleepStageName): boolean =>
  stage === "light" ||
  stage === "deep" ||
  stage === "rem" ||
  stage === "asleep";
