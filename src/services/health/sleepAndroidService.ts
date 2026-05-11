// src/services/health/sleepServiceAndroid.ts
import type { SleepDay, SleepSummary } from "@/models/sleepModel";
import { endOfDay, lastNDays, startOfDay, toYmd } from "@/utils/date";
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

export const ensureAndroidSleepAccess = async () => {
  // We request permission for steps, but it seems to be required to read sleep data as well
  // (otherwise we get "Permission denied" error when trying to read sleep)

  const status = await getSdkStatus();
  console.log("Health Connect SDK status:", status);

  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    return {
      ok: false as const,
      reason: "Health Connect is not available on this device.",
    };
  }

  await initialize();

  const permissionResult = await requestPermission([
    {
      accessType: "read",
      recordType: "SleepSession",
    },
  ]);

  console.log("Permission result:", permissionResult);

  return { ok: true as const };
};

export const readAndroidSleep = async (): Promise<SleepSummary> => {
  const days = lastNDays(7);

  const last7Days: SleepDay[] = [];

  for (const day of days) {
    const start = startOfDay(day).toISOString();
    const end = endOfDay(day).toISOString();

    console.log(`Reading sleep for ${toYmd(day)} from ${start} to ${end}...`);

    const { records } = await readRecords("SleepSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: start,
        endTime: end,
      },
    });

    console.log(`Records for ${toYmd(day)}:`, records);

    const total = (records ?? []).reduce((sum, record: any) => {
      return sum + Number(record?.duration ?? 0);
    }, 0);

    last7Days.push({
      date: toYmd(day),
      hours: total,
    });
  }

  return {
    lastNightHours: 0,
    last7Days,
  };
};
