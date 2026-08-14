// src/services/health/sleepiOSService.ts

import type {
  SleepDay,
  SleepStageName,
  SleepStageSegment,
  SleepSummary,
} from "@/models/sleepModel";
import { endOfDay, lastNDays, startOfDay, toYmd } from "@/utils/date";
import {
  isHealthDataAvailable,
  queryCategorySamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";
import {
  calculateStageTotals,
  createStageSegment,
  intervalHours,
  isSleepingStage,
  toInterval,
  type TimeInterval,
} from "./sleepUtils";

const SLEEP_ANALYSIS = "HKCategoryTypeIdentifierSleepAnalysis" as const;
const MAX_SESSION_GAP_MS = 2 * 60 * 60 * 1000;

type HealthKitSleepSample = {
  value?: unknown;
  startDate?: string | Date;
  endDate?: string | Date;
};

type ClassifiedSample = {
  stage: SleepStageName | "inBed";
  startMs: number;
  endMs: number;
  segment: SleepStageSegment | null;
};

type SleepEpisode = {
  startMs: number;
  endMs: number;
  samples: ClassifiedSample[];
};

type DayBucket = {
  sleepIntervals: TimeInterval[];
  stageSegments: SleepStageSegment[];
  episodeIntervals: TimeInterval[];
};

const classifySleepValue = (
  value: unknown,
): SleepStageName | "inBed" | null => {
  if (typeof value === "number") {
    // HKCategoryValueSleepAnalysis:
    // 0=inBed, 1=asleepUnspecified, 2=awake,
    // 3=asleepCore, 4=asleepDeep, 5=asleepREM.
    switch (value) {
      case 0:
        return "inBed";
      case 1:
        return "asleep";
      case 2:
        return "awake";
      case 3:
        return "light";
      case 4:
        return "deep";
      case 5:
        return "rem";
      default:
        return null;
    }
  }

  const normalized = String(value ?? "")
    .replace(/^HKCategoryValueSleepAnalysis/i, "")
    .replace(/^CategoryValueSleepAnalysis/i, "")
    .replace(/[._\-\s]/g, "")
    .toLowerCase();

  if (!normalized) return null;
  if (normalized.includes("inbed")) return "inBed";
  if (normalized.includes("awake")) return "awake";
  if (normalized.includes("core")) return "light";
  if (normalized.includes("deep")) return "deep";
  if (normalized.includes("rem")) return "rem";
  if (normalized.includes("asleep")) return "asleep";

  return null;
};

const buildEpisodes = (
  samples: ClassifiedSample[],
): SleepEpisode[] => {
  const sorted = samples
    .slice()
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const episodes: SleepEpisode[] = [];

  for (const sample of sorted) {
    const current = episodes[episodes.length - 1];

    if (!current) {
      episodes.push({
        startMs: sample.startMs,
        endMs: sample.endMs,
        samples: [sample],
      });
      continue;
    }

    if (sample.startMs <= current.endMs + MAX_SESSION_GAP_MS) {
      current.endMs = Math.max(current.endMs, sample.endMs);
      current.samples.push(sample);
    } else {
      episodes.push({
        startMs: sample.startMs,
        endMs: sample.endMs,
        samples: [sample],
      });
    }
  }

  return episodes;
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
    episodeIntervals: [],
  };

  buckets.set(key, created);
  return created;
};

export const ensureIosSleepAccess = async (): Promise<{
  ok: boolean;
  reason?: string;
}> => {
  const available = await isHealthDataAvailable();

  if (!available) {
    return {
      ok: false,
      reason: "Apple Health is not available on this device.",
    };
  }

  await requestAuthorization({
    toRead: [SLEEP_ANALYSIS],
    toShare: [],
  });

  return { ok: true };
};

export const readIOSSleep = async (): Promise<SleepSummary> => {
  const days = lastNDays(7);
  const dayKeys = days.map(toYmd);
  const allowedDayKeys = new Set(dayKeys);

  const queryStart = startOfDay(days[0]);
  queryStart.setDate(queryStart.getDate() - 1);

  const queryEnd = endOfDay(days[days.length - 1]);

  const samples = (await queryCategorySamples(SLEEP_ANALYSIS, {
    limit: 0,
    ascending: true,
    filter: {
      date: {
        startDate: queryStart,
        endDate: queryEnd,
      },
    },
  })) as HealthKitSleepSample[];

  const classified: ClassifiedSample[] = [];

  for (const sample of samples ?? []) {
    if (!sample.startDate || !sample.endDate) continue;

    const interval = toInterval(sample.startDate, sample.endDate);
    const stage = classifySleepValue(sample.value);

    if (!interval || !stage) continue;

    classified.push({
      stage,
      startMs: interval.startMs,
      endMs: interval.endMs,
      segment:
        stage === "inBed"
          ? null
          : createStageSegment(
              stage,
              new Date(interval.startMs).toISOString(),
              new Date(interval.endMs).toISOString(),
            ),
    });
  }

  /**
   * HealthKit exposes sleep as category samples rather than a single session
   * object. Cluster nearby/overlapping samples into sleep episodes first so a
   * night is not split at midnight.
   */
  const episodes = buildEpisodes(classified);
  const buckets = new Map<string, DayBucket>();

  for (const episode of episodes) {
    const wakeKey = toYmd(new Date(episode.endMs));

    if (!allowedDayKeys.has(wakeKey)) continue;

    const bucket = getBucket(buckets, wakeKey);
    bucket.episodeIntervals.push({
      startMs: episode.startMs,
      endMs: episode.endMs,
    });

    const stageSegments = episode.samples
      .map((sample) => sample.segment)
      .filter((segment): segment is SleepStageSegment => segment !== null);

    bucket.stageSegments.push(...stageSegments);

    const sleepingIntervals = stageSegments
      .filter((segment) => isSleepingStage(segment.stage))
      .map((segment) => toInterval(segment.startTime, segment.endTime))
      .filter((item): item is TimeInterval => item !== null);

    bucket.sleepIntervals.push(...sleepingIntervals);
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
  const episodeIntervals = lastNightBucket?.episodeIntervals ?? [];

  return {
    lastNightHours: lastNightDay.hours,
    lastNightStart: episodeIntervals.length
      ? new Date(
          Math.min(...episodeIntervals.map((item) => item.startMs)),
        ).toISOString()
      : undefined,
    lastNightEnd: episodeIntervals.length
      ? new Date(
          Math.max(...episodeIntervals.map((item) => item.endMs)),
        ).toISOString()
      : undefined,
    awakeHours: stageTotals.awakeHours,
    lightHours: stageTotals.lightHours,
    deepHours: stageTotals.deepHours,
    remHours: stageTotals.remHours,
    unspecifiedSleepHours: stageTotals.unspecifiedSleepHours,
    lastNightStages: stageSegments,
    last7Days,
  };
};
