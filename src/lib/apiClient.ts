// src/lib/apiClient.ts
import { API_ROUTE_BASE_URL } from "@/constants/apiRouteBaseURL";
import { ACCESS_TOKEN_KEY } from "@/constants/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = API_ROUTE_BASE_URL;
// const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  console.warn("Missing API_ROUTE_BASE_URL");
}

type ApiOptions = RequestInit & { auth?: boolean };

let refreshPromise: Promise<string> | null = null;

let onUnauthorized: (() => void) | null = null;

async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

async function fetchWithAuth(input: string, init: RequestInit) {
  return fetch(input, init);
}

// Allow AuthContext to register what "logout + redirect to login" means
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

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

  // If unauthorized, trigger a single app-level logout path
  if (res.status === 401 && auth) {
    if (onUnauthorized) onUnauthorized();
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data?.message || data?.detail || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
