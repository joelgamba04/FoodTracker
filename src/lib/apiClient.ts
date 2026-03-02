// src/lib/apiClient.ts
import { API_ROUTE_BASE_URL } from "@/constants/apiRouteBaseURL";
import { authFatal } from "@/services/authFatalService";
import { getAccessToken, refreshAccessToken } from "@/services/tokenService";

// Single-flight refresh: all concurrent token failures await one refresh
let refreshPromise: Promise<string> | null = null;

type ApiOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  auth?: boolean; // default true
  timeoutMs?: number; // add timeout
  _retried?: boolean; // internal only
};

class ApiError extends Error {
  kind:
    | "NETWORK"
    | "TIMEOUT"
    | "SERVER_UNAVAILABLE"
    | "SERVER_ERROR"
    | "UNAUTHORIZED"
    | "BAD_REQUEST"
    | "UNKNOWN";
  status?: number;
  body?: any;

  constructor(
    kind: ApiError["kind"],
    message: string,
    extra?: { status?: number; body?: any },
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = extra?.status;
    this.body = extra?.body;
  }
}

export const isServerUnavailableError = (err: unknown) => {
  const msg = String((err as any)?.message ?? "").toLowerCase();

  console.warn("Checking if error is server unavailable...", msg);

  // your apiClient message (HTML 503 / non-JSON)
  if (msg.includes("server unavailable")) return true;

  // common fetch/network errors (android/ios)
  if (msg.includes("network request failed")) return true;
  if (msg.includes("failed to fetch")) return true;
  if (msg.includes("load failed")) return true;
  if (msg.includes("network error")) return true;
  if (msg.includes("connection refused")) return true;
  if (msg.includes("unreachable")) return true;
  if (msg.includes("check your internet")) return true;

  // optional: timeouts if you add them later
  if (msg.includes("timeout")) return true;

  return false;
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

const looksLikeHtml = (v: unknown) => {
  if (typeof v !== "string") return false;
  const s = v.trim().toLowerCase();
  return (
    s.startsWith("<!doctype") || s.startsWith("<html") || s.includes("<body")
  );
};

const isTokenError = (status: number, body: any): boolean => {
  if (status === 401) return true;
  if (status === 403) {
    const msg = String(body?.message || body || "").toLowerCase();
    return (
      msg.includes("token") ||
      msg.includes("expired") ||
      msg.includes("invalid")
    );
  }
  return false;
};

const makeTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
};

export const api = async <T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> => {
  const url = normalizeUrl(path);
  const authEnabled = options.auth !== false;

  const { _retried, auth, timeoutMs = 20000, ...fetchOptions } = options;

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

  // Timeout support
  const { signal, cancel } = makeTimeoutSignal(timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers: mergeHeaders(headers, fetchOptions.headers),
      signal,
    });
  } catch (e: any) {
    cancel();

    console.warn(`API Request Failed: ${url}`, e.message ?? e);

    // Timeout (AbortController)
    if (e?.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Request timed out. Please try again.");
    }

    // Network / server unreachable
    // In RN this is often: TypeError: Network request failed
    throw new ApiError(
      "NETWORK",
      "Can’t connect to the server right now. Check your internet or contact administrators.",
    );
  } finally {
    cancel();
  }

  const body = await parseJsonOrText(res);
  const contentType = res.headers.get("content-type") || "";

  // If backend sends HTML (maintenance page, nginx, apache), treat as outage
  if (
    looksLikeHtml(body) ||
    (!contentType.includes("application/json") && res.status >= 500)
  ) {
    console.warn(`API Response looks like HTML, treating as outage: ${url}`, {
      status: res.status,
      contentType,
      body,
    });
    throw new ApiError(
      "SERVER_UNAVAILABLE",
      "Server is temporarily unavailable. Please try again later.",
      { status: res.status, body },
    );
  }

  // Token refresh flow (only if auth enabled)
  if (authEnabled && !_retried && isTokenError(res.status, body)) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(
          () => (refreshPromise = null),
        );
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
        authFatal("unauthorized_after_refresh");
        throw new ApiError("UNAUTHORIZED", "Unauthorized after refresh", {
          status: retryRes.status,
          body: retryBody,
        });
      }

      if (!retryRes.ok) {
        if (
          [502, 503, 504].includes(retryRes.status) ||
          looksLikeHtml(retryBody)
        ) {
          throw new ApiError(
            "SERVER_UNAVAILABLE",
            "Server is temporarily unavailable. Please try again later.",
            { status: retryRes.status, body: retryBody },
          );
        }

        throw new ApiError(
          "SERVER_ERROR",
          typeof retryBody === "string"
            ? retryBody
            : retryBody?.message || `Request failed with ${retryRes.status}`,
          { status: retryRes.status, body: retryBody },
        );
      }

      return retryBody as T;
    } catch {
      authFatal("refresh_failed");
      throw new ApiError(
        "UNAUTHORIZED",
        "Session expired. Please log in again.",
      );
    }
  }

  // Non-auth errors
  if (!res.ok) {
    // 503 / gateway maintenance
    if ([502, 503, 504].includes(res.status)) {
      throw new ApiError(
        "SERVER_UNAVAILABLE",
        "Server is temporarily unavailable. Please contact adminstrators.",
        { status: res.status, body },
      );
    }

    // 400 validation, etc.
    if (res.status >= 400 && res.status < 500) {
      throw new ApiError(
        "BAD_REQUEST",
        typeof body === "string" ? body : body?.message || "Request failed.",
        { status: res.status, body },
      );
    }

    // 500+
    throw new ApiError(
      "SERVER_ERROR",
      typeof body === "string"
        ? body
        : body?.message || `Request failed with ${res.status}`,
      { status: res.status, body },
    );
  }

  return body as T;
};

//  Optional export to let UI distinguish cases
export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;
