// src/services/health/sleepService.ts

import type { SleepSummary } from "@/models/sleepModel";
import { Platform } from "react-native";
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
  if (Platform.OS === "android") {
    return readAndroidSleep();
  }

  if (Platform.OS === "ios") {
    return readIOSSleep();
  }

  throw new Error("Unsupported platform");
}
