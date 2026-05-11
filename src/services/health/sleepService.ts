// src/services/health/sleepService.ts

import type { SleepSummary } from "@/models/sleepModel";
import { Platform } from "react-native";

// you already have these patterns for steps
import {
  ensureAndroidSleepAccess,
  readAndroidSleep,
} from "./sleepAndroidService";
import { ensureIosSleepAccess, readIOSSleep } from "./sleepiOSService";

export const ensureSleepAccess = async () => {
  if (Platform.OS === "android") {
    console.log("Checking Android sleep access...");
    return ensureAndroidSleepAccess();
  }

  if (Platform.OS === "ios") {
    console.log("Checking iOS sleep access...");
    return ensureIosSleepAccess();
  }

  return {
    ok: false as const,
    reason: "Unsupported platform",
  };
};

export async function readSleepSummary(): Promise<SleepSummary> {
  if (Platform.OS === "ios") {
    return readIOSSleep();
  }

  if (Platform.OS === "android") {
    return readAndroidSleep();
  }

  throw new Error("Unsupported platform");
}
