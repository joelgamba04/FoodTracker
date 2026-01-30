// src/services/authFatalService.ts
export type AuthFatalReason =
  | "missing_access_token"
  | "missing_refresh_token"
  | "refresh_failed"
  | "storage_error"
  | "unauthorized_after_refresh"
  | "force_logout";

type AuthFatalHandler = (reason: AuthFatalReason) => void;

let handler: AuthFatalHandler | null = null;

/**
 * Register the global auth-fatal handler.
 * Called ONCE inside AuthProvider.
 */
export function setAuthFatalHandler(fn: AuthFatalHandler) {
  handler = fn;
}

/**
 * Trigger a fatal authentication error.
 * This will force logout.
 */
export function authFatal(reason: AuthFatalReason): never {
  console.error("AUTH FATAL:", reason);

  if (handler) {
    handler(reason);
  } else {
    console.warn("authFatal called but no handler registered");
  }

  // Always throw to stop execution
  throw new Error(`AUTH_FATAL:${reason}`);
}
