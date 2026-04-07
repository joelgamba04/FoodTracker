import type { StepsSummary } from "@/models/stepsModel";
import { Platform } from "react-native";
import {
  ensureAndroidStepsAccess,
  readAndroidStepsSummary,
} from "./stepsAndroidService";
import { ensureIosStepsAccess, readIosStepsSummary } from "./stepsIOSService";

export const ensureStepsAccess = async () => {
  if (Platform.OS === "android") {
    console.log("Checking Android steps access...");
    return ensureAndroidStepsAccess();
  }

  if (Platform.OS === "ios") {
    console.log("Checking iOS steps access...");
    return ensureIosStepsAccess();
  }

  return {
    ok: false as const,
    reason: "Unsupported platform",
  };
};

export const readStepsSummary = async (): Promise<StepsSummary> => {
  if (Platform.OS === "android") {
    return readAndroidStepsSummary();
  }

  if (Platform.OS === "ios") {
    return readIosStepsSummary();
  }

  return {
    todaySteps: 0,
    last7Days: [],
  };
};
