// src/lib/apiClient.ts

import { API_ROUTE_BASE_URL } from "@/constants/apiRouteBaseURL";
import { authFatal } from "@/services/authFatalService";
import { getAccessToken, refreshAccessToken } from "@/services/tokenService";

// Single-flight refresh: all concurrent token failures await one refresh
let refreshPromise: Promise<string> | null = null;

type ApiOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  auth?: boolean; // default true
  _retried?: boolean; // internal only (do not pass to fetch)
};

const normalizeUrl = (path: string) => {
  return path.startsWith("http") ? path : `${API_ROUTE_BASE_URL}${path}`;
};

const mergeHeaders = (base?: HeadersInit, extra?: HeadersInit): HeadersInit => {
  return { ...(base as any), ...(extra as any) };
};

const parseJsonOrText = async (res: Response) => {
  const text = await res.text(); // IMPORTANT: can only be read once per Response
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const isTokenError = (status: number, body: any): boolean => {
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
};

export const api = async <T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> => {
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
    else {
      authFatal("missing_access_token");
    }
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: mergeHeaders(headers, fetchOptions.headers),
  });

  console.log(`API Response: ${url} status=${res.status}`);

  // Read body ONCE and reuse
  const body = await parseJsonOrText(res);

  console.log(`API Response Body: ${url} body=`, body);

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
      console.log(
        `API Retry Response: ${url} status=${retryRes.status} body=`,
        retryBody,
      );

      if (isTokenError(retryRes.status, retryBody)) {
        // ✅ This is a hard auth failure -> logout
        authFatal("unauthorized_after_refresh");
        throw new Error("Unauthorized after refresh"); // to satisfy TS return type
      }

      if (!retryRes.ok) {
        throw new Error(
          typeof retryBody === "string"
            ? retryBody
            : retryBody?.message || `Request failed with ${retryRes.status}`,
        );
      }

      return retryBody as T;
    } catch (e) {
      authFatal("refresh_failed");
    }
  }

  // Normal error handling (non-token errors, or already retried)
  if (!res.ok) {
    throw new Error(
      typeof body === "string"
        ? body
        : body?.message || `Request failed with ${res.status}`,
    );
  }

  // Success: return parsed body (already read)
  return body as T;
};
