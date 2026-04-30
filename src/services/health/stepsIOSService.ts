import type { StepDay, StepsSummary } from "@/models/stepsModel";
import { lastNDaysStart, toYmd } from "@/utils/date";
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from "react-native-health";

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps],
    write: [],
  },
};

export const ensureIosStepsAccess = (): Promise<{
  ok: boolean;
  reason?: string;
}> => {
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        resolve({ ok: false, reason: error });
        return;
      }

      resolve({ ok: true });
    });
  });
};

export const readIosStepsSummary = (): Promise<StepsSummary> => {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: lastNDaysStart(7).toISOString(),
    };

    AppleHealthKit.getDailyStepCountSamples(
      options,
      (error: string, results: any[]) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        const normalized: StepDay[] = (results ?? []).map((item) => {
          const date = item.startDate
            ? String(item.startDate).slice(0, 10)
            : toYmd(new Date());

          return {
            date,
            count: Number(item.value ?? 0),
            source: item.sourceName,
          };
        });

        const todayKey = toYmd(new Date());
        const todaySteps =
          normalized.find((d) => d.date === todayKey)?.count ?? 0;

        resolve({
          todaySteps,
          last7Days: normalized,
        });
      },
    );
  });
};
