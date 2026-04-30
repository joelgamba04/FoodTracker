// src/services/health/sleepServiceiOS.ts

import type { SleepSummary } from "@/models/sleepModel";
import AppleHealthKit from "react-native-health";

const PERMS = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.SleepAnalysis],
  },
};

export const ensureIosSleepAccess = (): Promise<{
  ok: boolean;
  reason?: string;
}> => {
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMS, (error: string) => {
      if (error) {
        resolve({ ok: false, reason: error });
        return;
      }

      resolve({ ok: true });
    });
  });
};

export const readIOSSleep = async (): Promise<SleepSummary> => {
  await new Promise<void>((resolve, reject) => {
    AppleHealthKit.initHealthKit(PERMS, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const options = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  const samples = await new Promise<any[]>((resolve, reject) => {
    AppleHealthKit.getSleepSamples(options, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  // Convert to daily totals
  const days: Record<string, number> = {};

  samples.forEach((s) => {
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const key = start.toISOString().slice(0, 10);
    days[key] = (days[key] || 0) + durationHours;
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
};
