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

// Single-flight refresh: all concurrent token failures await one refresh
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
  const text = await res.text(); // IMPORTANT: can only be read once per Response
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isTokenError(status: number, body: any): boolean {
  if (status === 401) return true;

  if (status === 403) {
    const msg = String(body?.message || "").toLowerCase();
    return (
      msg.includes("token") ||
      msg.includes("expired") ||
      msg.includes("invalid")
    );
  }

  return false;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = normalizeUrl(path);
  const authEnabled = options.auth !== false;

  console.log(`API Request: ${url} options:`, options);

  // IMPORTANT: do not forward internal flags to fetch
  const { _retried, auth, ...fetchOptions } = options;

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

  console.log(`API Response: ${url} status=${res.status}`);

  // Read body ONCE and reuse
  const body = await parseJsonOrText(res);

  // If token invalid/expired and we haven't retried, refresh then retry once
  if (authEnabled && !_retried && isTokenError(res.status, body)) {
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

      const retryBody = await parseJsonOrText(retryRes);

      if (retryRes.status === 401 || retryRes.status === 403) {
        notifyAuthFatal("unauthorized_after_refresh", retryBody);
        throw new Error("Unauthorized after refresh");
      }

      if (!retryRes.ok) {
        throw new Error(
          typeof retryBody === "string"
            ? retryBody
            : retryBody?.message || `Request failed with ${retryRes.status}`
        );
      }

      return retryBody as T;
    } catch (e) {
      notifyAuthFatal("refresh_failed", e);
      throw e;
    }
  }

  // Normal error handling (non-token errors, or already retried)
  if (!res.ok) {
    throw new Error(
      typeof body === "string"
        ? body
        : body?.message || `Request failed with ${res.status}`
    );
  }

  // Success: return parsed body (already read)
  return body as T;
}
