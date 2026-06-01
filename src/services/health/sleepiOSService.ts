// src/services/health/sleepiOSService.ts

import type { SleepDay, SleepSummary } from "@/models/sleepModel";
import { endOfDay, lastNDays, startOfDay, toYmd } from "@/utils/date";
import {
  isHealthDataAvailable,
  queryCategorySamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

const SLEEP_ANALYSIS = "HKCategoryTypeIdentifierSleepAnalysis" as const;

const ASLEEP_VALUES = new Set([
  "asleep",
  "asleepCore",
  "asleepDeep",
  "asleepREM",
  "HKCategoryValueSleepAnalysisAsleep",
  "HKCategoryValueSleepAnalysisAsleepCore",
  "HKCategoryValueSleepAnalysisAsleepDeep",
  "HKCategoryValueSleepAnalysisAsleepREM",
  1,
  3,
  4,
  5,
]);

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
  const last7Days: SleepDay[] = [];

  for (const day of days) {
    const startDate = startOfDay(day);
    const endDate = endOfDay(day);

    const samples = await queryCategorySamples(SLEEP_ANALYSIS, {
      limit: 0,
      ascending: true,
      filter: {
        date: {
          startDate,
          endDate,
        },
      },
    });

    const totalHours = (samples ?? []).reduce((sum, sample: any) => {
      /**
       * HealthKit sleep samples can include:
       * - inBed
       * - awake
       * - asleep
       * - asleepCore
       * - asleepDeep
       * - asleepREM
       *
       * For actual sleep hours, count only asleep values.
       */
      if (!ASLEEP_VALUES.has(sample.value)) {
        return sum;
      }

      const start = new Date(sample.startDate);
      const end = new Date(sample.endDate);

      const durationHours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      return sum + durationHours;
    }, 0);

    last7Days.push({
      date: toYmd(day),
      hours: Number(totalHours.toFixed(2)),
    });
  }

  const todayKey = toYmd(new Date());
  const todayIndex = last7Days.findIndex((d) => d.date === todayKey);

  /**
   * Your model calls this "lastNightHours".
   * In a 7-day daily array, yesterday is usually a better approximation
   * than today's partial sleep total.
   */
  const lastNight =
    todayIndex > 0
      ? last7Days[todayIndex - 1]
      : last7Days[last7Days.length - 1];

  return {
    lastNightHours: lastNight?.hours ?? 0,
    last7Days,
  };
};
