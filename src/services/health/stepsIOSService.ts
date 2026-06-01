// src/services/health/stepsIOSService.ts

import type { StepDay, StepsSummary } from "@/models/stepsModel";
import { endOfDay, lastNDays, startOfDay, toYmd } from "@/utils/date";
import {
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

const STEP_COUNT = "HKQuantityTypeIdentifierStepCount" as const;

export const ensureIosStepsAccess = async (): Promise<{
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
    toRead: [STEP_COUNT],
    toShare: [],
  });

  return { ok: true };
};

export const readIosStepsSummary = async (): Promise<StepsSummary> => {
  const days = lastNDays(7);
  const last7Days: StepDay[] = [];

  for (const day of days) {
    const startDate = startOfDay(day);
    const endDate = endOfDay(day);

    const stats = await queryStatisticsForQuantity(
      STEP_COUNT,
      ["cumulativeSum"],
      {
        filter: {
          date: {
            startDate,
            endDate,
          },
        },
        unit: "count",
      },
    );

    last7Days.push({
      date: toYmd(day),
      count: Number(stats.sumQuantity?.quantity ?? 0),
      source: stats.sources?.[0]?.name,
    });
  }

  const todayKey = toYmd(new Date());
  const todaySteps = last7Days.find((d) => d.date === todayKey)?.count ?? 0;

  return {
    todaySteps,
    last7Days,
  };
};
