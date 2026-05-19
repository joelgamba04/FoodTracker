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

type ApiErrorKind =
  | "NETWORK"
  | "TIMEOUT"
  | "SERVER_UNAVAILABLE"
  | "SERVER_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "TOO_MANY_REQUESTS"
  | "UNKNOWN";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  body?: any;

  constructor(
    kind: ApiErrorKind,
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

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const isServerUnavailableError = (err: unknown) => {
  if (isApiError(err)) {
    return (
      err.kind === "SERVER_UNAVAILABLE" ||
      err.kind === "SERVER_ERROR" ||
      err.kind === "NETWORK" ||
      err.kind === "TIMEOUT"
    );
  }

  const msg = String((err as any)?.message ?? "").toLowerCase();

  return (
    msg.includes("server unavailable") ||
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("network error") ||
    msg.includes("connection refused") ||
    msg.includes("unreachable") ||
    msg.includes("check your internet") ||
    msg.includes("timeout")
  );
};

const normalizeUrl = (path: string) => {
  return path.startsWith("http") ? path : `${API_ROUTE_BASE_URL}${path}`;
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

const getMessageFromBody = (
  body: any,
  fallback = "Request failed.",
): string => {
  if (!body) return fallback;
  if (typeof body === "string") return body;

  return (
    body?.message ||
    body?.error ||
    body?.detail ||
    body?.errors?.[0]?.message ||
    fallback
  );
};

const isTokenError = (status: number, body: any): boolean => {
  if (status === 401) return true;

  if (status === 403) {
    const msg = String(getMessageFromBody(body, "")).toLowerCase();

    return (
      msg.includes("token") ||
      msg.includes("expired") ||
      msg.includes("invalid") ||
      msg.includes("unauthorized")
    );
  }

  return false;
};

const makeTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(id),
  };
};

const buildHeaders = async (
  fetchOptions: Omit<ApiOptions, "_retried" | "auth" | "timeoutMs">,
  authEnabled: boolean,
) => {
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as any),
  };

  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (authEnabled) {
    const token = await getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      authFatal("missing_access_token");
      throw new ApiError("UNAUTHORIZED", "Missing access token.");
    }
  }

  return headers;
};

const classifyHttpError = (status: number, body: any): ApiError => {
  if (looksLikeHtml(body) || [502, 503, 504].includes(status)) {
    return new ApiError(
      "SERVER_UNAVAILABLE",
      "Server is temporarily unavailable. Please try again later.",
      { status, body },
    );
  }

  switch (status) {
    case 400:
      return new ApiError("BAD_REQUEST", getMessageFromBody(body), {
        status,
        body,
      });

    case 401:
      return new ApiError("UNAUTHORIZED", "Your session has expired.", {
        status,
        body,
      });

    case 403:
      return new ApiError(
        "FORBIDDEN",
        getMessageFromBody(body, "Access denied."),
        {
          status,
          body,
        },
      );

    case 404:
      return new ApiError(
        "NOT_FOUND",
        getMessageFromBody(body, "Record not found."),
        {
          status,
          body,
        },
      );

    case 422:
      return new ApiError(
        "VALIDATION_ERROR",
        getMessageFromBody(body, "Please check the submitted data."),
        { status, body },
      );

    case 429:
      return new ApiError(
        "TOO_MANY_REQUESTS",
        getMessageFromBody(body, "Too many requests. Please try again later."),
        { status, body },
      );

    default:
      if (status >= 500) {
        return new ApiError(
          "SERVER_ERROR",
          getMessageFromBody(
            body,
            "Server error. Please contact administrators.",
          ),
          { status, body },
        );
      }

      return new ApiError(
        "UNKNOWN",
        getMessageFromBody(body, `Request failed with ${status}.`),
        { status, body },
      );
  }
};

const doFetch = async (
  url: string,
  fetchOptions: RequestInit,
  timeoutMs: number,
): Promise<{ res: Response; body: any }> => {
  const { signal, cancel } = makeTimeoutSignal(timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal,
    });

    const body = await parseJsonOrText(res);

    return { res, body };
  } catch (e: any) {
    console.warn(`API Request Failed: ${url}`, e.message ?? e);

    // Timeout (AbortController)
    if (e?.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Request timed out. Please try again.");
    }

    // Network / server unreachable
    throw new ApiError(
      "NETWORK",
      "Can’t connect to the server right now. Check your internet or contact administrators.",
    );
  } finally {
    cancel();
  }
};

export const api = async <T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> => {
  const url = normalizeUrl(path);

  const { _retried, auth, timeoutMs = 20000, ...fetchOptions } = options;

  const authEnabled = auth !== false;

  const headers = await buildHeaders(fetchOptions, authEnabled);

  const { res, body } = await doFetch(
    url,
    {
      ...fetchOptions,
      headers,
    },
    timeoutMs,
  );

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
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccess = await refreshPromise;

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccess}`,
      };

      const retry = await doFetch(
        url,
        {
          ...fetchOptions,
          headers: retryHeaders,
        },
        timeoutMs,
      );

      if (isTokenError(retry.res.status, retry.body)) {
        authFatal("unauthorized_after_refresh");

        throw new ApiError("UNAUTHORIZED", "Unauthorized after refresh.", {
          status: retry.res.status,
          body: retry.body,
        });
      }

      if (!retry.res.ok) {
        throw classifyHttpError(retry.res.status, retry.body);
      }

      return retry.body as T;
    } catch (err) {
      if (isApiError(err) && err.kind !== "UNAUTHORIZED") {
        throw err;
      }

      authFatal("refresh_failed");

      throw new ApiError(
        "UNAUTHORIZED",
        "Session expired. Please log in again.",
      );
    }
  }

  // Non-auth errors
  if (!res.ok) {
    throw classifyHttpError(res.status, body);
  }

  return body as T;
};
