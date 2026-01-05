// src/lib/apiClient.ts
import { ACCESS_TOKEN_KEY } from "@/constants/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:3000";
// const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  console.warn("Missing EXPO_PUBLIC_API_BASE_URL in env.");
}

type ApiOptions = RequestInit & { auth?: boolean };

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const auth = options.auth ?? true;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data?.message || data?.detail || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
