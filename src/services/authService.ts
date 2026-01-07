// src/services/authService.ts

import {
  ACCESS_TOKEN_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
} from "@/constants/storageKeys";
import { api } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      user_id: number;
      email: string;
    };
    accessToken?: string;
    refreshToken?: string;
  };
}

export async function persistAuth(res: LoginResponse) {
  const accessToken = res?.data?.accessToken;
  const refreshToken = res?.data?.refreshToken;
  const user = res?.data?.user;

  // Access token is required for logged-in state
  if (!accessToken) {
    throw new Error("Missing access token from server.");
  }

  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  // Refresh token may not exist yet (backend still building route)
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (user) {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  }
}

export async function login(email: string, password: string) {
  const res = await api<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  if (!res.success) throw new Error(res.message || "Login failed");

  await persistAuth(res);
  return res.data.user;
}

export async function logout() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    AUTH_USER_KEY,
  ]);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
