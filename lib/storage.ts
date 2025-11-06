// lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type Store = {
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  removeItem: (k: string) => Promise<void>;
};

const isWeb = Platform.OS === "web";

const webStore: Store = {
  getItem: async (k) =>
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem(k)
      : null,
  setItem: async (k, v) => {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.setItem(k, v);
  },
  removeItem: async (k) => {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.removeItem(k);
  },
};

const nativeStore: Store = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

export const storage: Store = isWeb ? webStore : nativeStore;

export async function loadJSON<T>(key: string, revive?: (v: T) => T) {
  const s = await storage.getItem(key);
  if (!s) return null;
  const parsed = JSON.parse(s) as T;
  return revive ? revive(parsed) : parsed;
}

export async function saveJSON(key: string, value: unknown) {
  return storage.setItem(key, JSON.stringify(value));
}
