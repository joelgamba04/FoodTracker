// src/services/health/healthCache.ts

import { HEALTH_CONNECTION_STATUS_KEY } from "@/constants/storageKeys";
import type { HealthSummary } from "@/models/healthModel";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HEALTH_CACHE_KEY = "health_summary_cache_v1";

export async function saveHealthCache(data: HealthSummary): Promise<void> {
  await AsyncStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify(data));
}

export async function loadHealthCache(): Promise<HealthSummary | null> {
  const raw = await AsyncStorage.getItem(HEALTH_CACHE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as HealthSummary;
  } catch {
    return null;
  }
}

export async function clearHealthCache(): Promise<void> {
  await AsyncStorage.removeItem(HEALTH_CACHE_KEY);
}

// health connection status is stored separately so we can check it without needing to parse the full health summary cache, which may be large and slow to parse
export const getHealthConnected = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(HEALTH_CONNECTION_STATUS_KEY);
  return value === "true";
};

export const setHealthConnected = async (): Promise<void> => {
  await AsyncStorage.setItem(HEALTH_CONNECTION_STATUS_KEY, "true");
};

export const clearHealthConnected = async (): Promise<void> => {
  await AsyncStorage.removeItem(HEALTH_CONNECTION_STATUS_KEY);
};
