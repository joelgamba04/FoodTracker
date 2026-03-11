// src/services/authService.ts
import { AUTHENTICATED_AUTH_MODE } from "@/constants/authModeConstants";
import {
  ACCESS_TOKEN_KEY,
  AUTH_MODE_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
} from "@/constants/storageKeys";
import { api } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    user: { user_id: number; email: string };
    accessToken: string;
    refreshToken: string;
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

  const refreshToken = result.data?.refreshToken;
  if (!refreshToken) {
    throw new Error("Login succeeded but refresh token is missing.");
  }

  const user = result.data?.user;
  if (!user) {
    throw new Error("Login succeeded but user data is missing.");
  }

  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [AUTH_USER_KEY, JSON.stringify(user)],
    [AUTH_MODE_KEY, AUTHENTICATED_AUTH_MODE],
  ]);

  return user;
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
  } catch {
    // ignore errors — logout should still proceed locally
  } finally {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      AUTH_USER_KEY,
      AUTH_MODE_KEY,
    ]);
  }
}
