// src/services/authService.ts
import {
  ACCESS_TOKEN_KEY,
  AUTH_USER_KEY,
  PROFILE_CACHE_KEY,
  REFRESH_TOKEN_KEY,
} from "@/constants/storageKeys";
import { api } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: { user_id: number; email: string };
    accessToken?: string;
    refreshToken?: string;
  };
};

export async function login(email: string, password: string) {
  const result = await api<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  // 1) Must be success
  if (!result?.success) {
    throw new Error(result?.message || "Login failed");
  }

  // 2) Must have an access token
  const accessToken = result.data?.accessToken;
  if (!accessToken) {
    throw new Error("Login succeeded but access token is missing.");
  }

  // 3) Save access token (always overwrite)
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  // 4) Refresh token is OPTIONAL:
  // - If provided, overwrite it
  // - If not provided, keep existing
  const newRefresh = result.data?.refreshToken;
  if (typeof newRefresh === "string" && newRefresh.length > 0) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
  } else {
    // If backend doesn't return one, ensure we already have one stored (optional strictness)
    const existing = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!existing) {
      // If your backend truly expects an existing refresh token and none exists, you must handle it.
      // You can either throw OR accept "access token only" flow.
      console.warn("Login returned no refresh token and none exists locally.");
      // Option A (strict): throw new Error("No refresh token available for session refresh.");
      // Option B (lenient): proceed; user will have to re-login on expiry.
    }
  }

  // 5) Save user (optional but recommended)
  const user = result.data?.user;
  if (user) {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  return user ?? null;
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function logout() {
  try {
    await api("/auth/logout", {
      method: "POST",
    });
  } catch (e) {
    // ignore errors — logout should still proceed locally
  } finally {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      PROFILE_CACHE_KEY,
    ]);
  }
}
