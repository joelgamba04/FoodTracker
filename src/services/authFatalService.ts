// src/services/authFatalService.ts
type AuthFatalReason =
  | "missing_access_token"
  | "missing_refresh_token"
  | "refresh_failed"
  | "refresh_invalid"
  | "storage_error";

let handler: ((reason: AuthFatalReason) => void) | null = null;

export function setAuthFatalHandler(fn: (reason: AuthFatalReason) => void) {
  handler = fn;
}

export function authFatal(reason: AuthFatalReason) {
  // Keep it safe: never throw here
  try {
    handler?.(reason);
  } catch {}
}
