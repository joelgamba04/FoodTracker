// src/services/health/sleepAndroidService.ts

import type {
  SleepDay,
  SleepStageName,
  SleepStageSegment,
  SleepSummary,
} from "@/models/sleepModel";
import { endOfDay, lastNDays, startOfDay, toYmd } from "@/utils/date";
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";
import {
  calculateStageTotals,
  createStageSegment,
  intervalHours,
  isSleepingStage,
  roundHours,
  toInterval,
  type TimeInterval,
} from "./sleepUtils";

type AndroidSleepStage = {
  startTime?: string;
  endTime?: string;
  stage?: number;
};

type AndroidSleepRecord = {
  startTime?: string;
  endTime?: string;
  stages?: AndroidSleepStage[];
};

type DayBucket = {
  sleepIntervals: TimeInterval[];
  stageSegments: SleepStageSegment[];
  sessionIntervals: TimeInterval[];
};

const ANDROID_STAGE: Record<number, SleepStageName> = {
  0: "unknown",
  1: "awake",
  2: "asleep",
  3: "awake",
  4: "light",
  5: "deep",
  6: "rem",
  7: "awake",
};

const hasSleepPermission = (
  permissions: Array<{ accessType?: string; recordType?: string }>,
): boolean =>
  permissions.some(
    (permission) =>
      permission.accessType === "read" &&
      permission.recordType === "SleepSession",
  );

export const ensureAndroidSleepAccess = async (): Promise<{
  ok: boolean;
  reason?: string;
}> => {
  const status = await getSdkStatus();

  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    return {
      ok: false,
      reason: "Health Connect is not available on this device.",
    };
  }

  const initialized = await initialize();

  if (!initialized) {
    return {
      ok: false,
      reason: "Unable to initialize Health Connect.",
    };
  }

  const granted = await requestPermission([
    {
      accessType: "read",
      recordType: "SleepSession",
    },
  ]);

  if (!hasSleepPermission(granted)) {
    return {
      ok: false,
      reason: "Sleep permission was not granted in Health Connect.",
    };
  }

  return { ok: true };
};

const getBucket = (
  buckets: Map<string, DayBucket>,
  key: string,
): DayBucket => {
  const existing = buckets.get(key);

  if (existing) return existing;

  const created: DayBucket = {
    sleepIntervals: [],
    stageSegments: [],
    sessionIntervals: [],
  };

  buckets.set(key, created);
  return created;
};

export const readAndroidSleep = async (): Promise<SleepSummary> => {
  const days = lastNDays(7);
  const dayKeys = days.map(toYmd);
  const allowedDayKeys = new Set(dayKeys);

  /**
   * Query slightly before the first displayed day because the sleep session
   * assigned to that wake-day may have started the previous evening.
   */
  const queryStart = startOfDay(days[0]);
  queryStart.setDate(queryStart.getDate() - 1);

  const queryEnd = endOfDay(days[days.length - 1]);

  const { records } = await readRecords("SleepSession", {
    timeRangeFilter: {
      operator: "between",
      startTime: queryStart.toISOString(),
      endTime: queryEnd.toISOString(),
    },
  });

  const buckets = new Map<string, DayBucket>();

  for (const rawRecord of (records ?? []) as AndroidSleepRecord[]) {
    if (!rawRecord.startTime || !rawRecord.endTime) continue;

    const sessionInterval = toInterval(
      rawRecord.startTime,
      rawRecord.endTime,
    );

    if (!sessionInterval) continue;

    // Attribute the complete overnight session to the day the user woke up.
    const wakeKey = toYmd(new Date(sessionInterval.endMs));

    if (!allowedDayKeys.has(wakeKey)) continue;

    const bucket = getBucket(buckets, wakeKey);
    bucket.sessionIntervals.push(sessionInterval);

    const recordStageSegments: SleepStageSegment[] = [];

    for (const stageRecord of rawRecord.stages ?? []) {
      if (
        !stageRecord.startTime ||
        !stageRecord.endTime ||
        typeof stageRecord.stage !== "number"
      ) {
        continue;
      }

      const stageName = ANDROID_STAGE[stageRecord.stage] ?? "unknown";
      const segment = createStageSegment(
        stageName,
        stageRecord.startTime,
        stageRecord.endTime,
      );

      if (!segment) continue;

      recordStageSegments.push(segment);
      bucket.stageSegments.push(segment);
    }

    const sleepingStageIntervals = recordStageSegments
      .filter((segment) => isSleepingStage(segment.stage))
      .map((segment) => toInterval(segment.startTime, segment.endTime))
      .filter((item): item is TimeInterval => item !== null);

    /**
     * If the provider supplied actual sleep stages, use those to exclude
     * awake time. If it supplied only a session boundary, fall back to the
     * session duration.
     */
    if (sleepingStageIntervals.length > 0) {
      bucket.sleepIntervals.push(...sleepingStageIntervals);
    } else {
      bucket.sleepIntervals.push(sessionInterval);
    }
  }

  const last7Days: SleepDay[] = dayKeys.map((date) => ({
    date,
    hours: intervalHours(buckets.get(date)?.sleepIntervals ?? []),
  }));

  const lastNightDay = [...last7Days]
    .reverse()
    .find((day) => day.hours > 0);

  if (!lastNightDay) {
    return {
      lastNightHours: 0,
      awakeHours: 0,
      lightHours: 0,
      deepHours: 0,
      remHours: 0,
      unspecifiedSleepHours: 0,
      lastNightStages: [],
      last7Days,
    };
  }

  const lastNightBucket = buckets.get(lastNightDay.date);
  const stageSegments = (lastNightBucket?.stageSegments ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  const stageTotals = calculateStageTotals(stageSegments);

  const sessionIntervals = lastNightBucket?.sessionIntervals ?? [];
  const lastNightStart = sessionIntervals.length
    ? new Date(
        Math.min(...sessionIntervals.map((item) => item.startMs)),
      ).toISOString()
    : undefined;

  const lastNightEnd = sessionIntervals.length
    ? new Date(
        Math.max(...sessionIntervals.map((item) => item.endMs)),
      ).toISOString()
    : undefined;

  /**
   * If the provider did not expose detailed stage data, keep the entire
   * session represented as unspecified sleep for the stage summary.
   */
  const hasDetailedSleepStage = stageSegments.some(
    (segment) =>
      segment.stage === "light" ||
      segment.stage === "deep" ||
      segment.stage === "rem" ||
      segment.stage === "asleep",
  );

  return {
    lastNightHours: lastNightDay.hours,
    lastNightStart,
    lastNightEnd,
    awakeHours: stageTotals.awakeHours,
    lightHours: stageTotals.lightHours,
    deepHours: stageTotals.deepHours,
    remHours: stageTotals.remHours,
    unspecifiedSleepHours: hasDetailedSleepStage
      ? stageTotals.unspecifiedSleepHours
      : roundHours(lastNightDay.hours),
    lastNightStages: stageSegments,
    last7Days,
  };
};
