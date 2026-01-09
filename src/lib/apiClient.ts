// src/lib/apiClient.ts

import { API_ROUTE_BASE_URL } from "@/constants/apiRouteBaseURL";
import { ACCESS_TOKEN_KEY } from "@/constants/storageKeys";
import { refreshAccessToken } from "@/services/tokenService";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Global auth-fatal hook (optional):
 * apiClient can call this when refresh fails / still unauthorized after refresh.
 */
type AuthFatalReason = "refresh_failed" | "unauthorized_after_refresh";
type AuthFatalHandler = (reason: AuthFatalReason, error?: unknown) => void;

let authFatalHandler: AuthFatalHandler | null = null;

export function setAuthFatalHandler(handler: AuthFatalHandler) {
  authFatalHandler = handler;
}

function notifyAuthFatal(reason: AuthFatalReason, error?: unknown) {
  try {
    authFatalHandler?.(reason, error);
  } catch (e) {
    console.warn("authFatalHandler threw:", e);
  }
}

// Single-flight refresh: all concurrent 401s await one refresh
let refreshPromise: Promise<string> | null = null;

type ApiOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  auth?: boolean; // default true
  _retried?: boolean; // internal only (do not pass to fetch)
};

async function getAccessToken() {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

function normalizeUrl(path: string) {
  return path.startsWith("http") ? path : `${API_ROUTE_BASE_URL}${path}`;
}

function mergeHeaders(base?: HeadersInit, extra?: HeadersInit): HeadersInit {
  return { ...(base as any), ...(extra as any) };
}

async function parseJsonOrText(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = normalizeUrl(path);
  const authEnabled = options.auth !== false;

  // IMPORTANT: do not forward internal flags to fetch
  const { _retried, auth, ...fetchOptions } = options;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as any),
  };

  if (authEnabled) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: mergeHeaders(headers, fetchOptions.headers),
  });

  // If 401 or 403 on an auth request and we haven't retried yet: refresh then retry once
  if ((res.status === 401 || res.status === 403) && authEnabled && !_retried) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccess = await refreshPromise;

      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${newAccess}`,
      };

      const retryRes = await fetch(url, {
        ...fetchOptions,
        headers: mergeHeaders(retryHeaders, fetchOptions.headers),
      });

      if (retryRes.status === 401 || retryRes.status === 403) {
        const body = await parseJsonOrText(retryRes);
        notifyAuthFatal("unauthorized_after_refresh", body);
        throw new Error("Unauthorized/forbidden after refresh");
      }

      const data = await parseJsonOrText(retryRes);
      return data as T;
    } catch (e) {
      notifyAuthFatal("refresh_failed", e);
      throw e;
    }
  }

  // Non-401 or already retried
  if (!res.ok) {
    const body = await parseJsonOrText(res);
    // propagate a useful error
    console.log("API error :", res.status, body);
    throw new Error(
      typeof body === "string"
        ? body
        : body?.message || `Request failed with ${res.status}`
    );
  }

  const data = await parseJsonOrText(res);
  return data as T;
}
