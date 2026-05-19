// src/services/health/stepsAndroidService.ts

import type { StepDay, StepsSummary } from "@/models/stepsModel";
import { endOfDay, lastNDays, startOfDay, toYmd } from "@/utils/date";
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

export const ensureAndroidStepsAccess = async () => {
  const status = await getSdkStatus();
  console.log("Health Connect SDK status:", status);

  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    console.warn("Health Connect SDK is not available:", status);
    return {
      ok: false as const,
      reason: "Health Connect is not available on this device.",
    };
  }

  await initialize();

  const permissionResult = await requestPermission([
    {
      accessType: "read",
      recordType: "Steps",
    },
  ]);

  console.log("Permission result:", permissionResult);

  return { ok: true as const };
};

export const readAndroidStepsSummary = async (): Promise<StepsSummary> => {
  const days = lastNDays(7);

  const last7Days: StepDay[] = [];

  for (const day of days) {
    const start = startOfDay(day).toISOString();
    const end = endOfDay(day).toISOString();

    console.log(`Reading steps for ${toYmd(day)} from ${start} to ${end}...`);

    const { records } = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: start,
        endTime: end,
      },
    });

    console.log(`Records for ${toYmd(day)}:`, records);

    const total = (records ?? []).reduce((sum, record: any) => {
      return sum + Number(record?.count ?? 0);
    }, 0);

    last7Days.push({
      date: toYmd(day),
      count: total,
      source: records?.[0]?.metadata?.dataOrigin,
    });
  }

  const todayKey = toYmd(new Date());
  const todaySteps = last7Days.find((d) => d.date === todayKey)?.count ?? 0;

  return {
    todaySteps,
    last7Days,
  };
};
