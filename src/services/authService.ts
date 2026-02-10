// src/services/authService.ts
import { AUTHENTICATED_AUTH_MODE } from "@/constants/authModeConstants";
import {
  ACCESS_TOKEN_KEY,
  AUTH_MODE_KEY,
  REFRESH_TOKEN_KEY,
  USER_PROFILE_KEY,
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

  // 3) Save access token (always overwrite)
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  // 4) Refresh token is now always available :
  const newRefresh = result.data?.refreshToken;
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);

  // 5) Save user (optional but recommended)
  const user = result.data?.user;
  if (user) {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }

  await AsyncStorage.setItem(AUTH_MODE_KEY, AUTHENTICATED_AUTH_MODE);

  return user ?? null;
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
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
      USER_PROFILE_KEY,
    ]);
  }
}
