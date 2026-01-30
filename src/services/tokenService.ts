import { API_ROUTE_BASE_URL } from "@/constants/apiRouteBaseURL";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/storageKeys";
import { authFatal } from "@/services/authFatalService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = API_ROUTE_BASE_URL;

export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    authFatal("missing_refresh_token");
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  let response: any = null;
  try {
    response = await res.json();
  } catch {
    // bad payload, handle below
  }

  if (!res.ok || !response?.success || !response?.data?.accessToken) {
    authFatal("refresh_failed"); // logout signal
  }

  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);

  if (response.data.refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
  }

  return response.data.accessToken;
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      authFatal("missing_access_token");
    }
    return token;
  } catch {
    authFatal("storage_error");
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token) {
      authFatal("missing_refresh_token");
    }
    return token;
  } catch {
    authFatal("storage_error");
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    authFatal("storage_error");
  }

  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    authFatal("storage_error");
  }
};
