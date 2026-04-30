// src/services/health/sleepServiceAndroid.ts

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
      recordType: "Steps",
    },
  ]);

  console.log("Permission result:", permissionResult);

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 7);

  return readRecords("SleepSession", {
    timeRangeFilter: {
      operator: "between",
      startTime: start.toISOString(),
      endTime: now.toISOString(),
    },
  }).then((result) => {
    const sessions = result.records ?? [];

    const days: Record<string, number> = {};

    sessions.forEach((s: any) => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);

      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const key = start.toISOString().slice(0, 10);
      days[key] = (days[key] || 0) + hours;
    });

    const last7Days = Object.entries(days).map(([date, hours]) => ({
      date,
      hours,
    }));

    const lastNight = last7Days[last7Days.length - 1];

    return {
      lastNightHours: lastNight?.hours ?? 0,
      last7Days,
    };
  });
};
