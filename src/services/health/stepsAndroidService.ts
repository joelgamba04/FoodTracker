import type { StepDay, StepsSummary } from "@/models/stepsModel";
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

const toYmd = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const lastNDays = (n: number): Date[] => {
  const out: Date[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
};

export const ensureAndroidStepsAccess = async () => {
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

  return { ok: true as const };
};

export const readAndroidStepsSummary = async (): Promise<StepsSummary> => {
  const days = lastNDays(7);

  const last7Days: StepDay[] = [];

  for (const day of days) {
    const start = startOfDay(day).toISOString();
    const end = endOfDay(day).toISOString();

    const { records } = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: start,
        endTime: end,
      },
    });

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
