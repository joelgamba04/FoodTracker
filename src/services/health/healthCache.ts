// src/services/health/healthCache.ts

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
