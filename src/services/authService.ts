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
    accessToken: string;
    refreshToken: string;
  };
}

export async function login(email: string, password: string) {
  const res = await api<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false, // login doesn’t need Authorization header
    body: JSON.stringify({ email, password }),
  });

  if (!res.success) {
    throw new Error(res.message || "Login failed");
  }

  // Save tokens + user
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, res.data.accessToken],
    [REFRESH_TOKEN_KEY, res.data.refreshToken],
    [AUTH_USER_KEY, JSON.stringify(res.data.user)],
  ]);

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
