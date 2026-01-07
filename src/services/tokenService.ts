import { API_ROUTE_BASE_URL } from "@/constants/apiRouteBaseURL";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = API_ROUTE_BASE_URL

type RefreshResponse = {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken?: string; // if you rotate refresh tokens
  };
  message?: string;
};

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data: RefreshResponse = await res.json();

  if (!res.ok || !data?.success || !data?.data?.accessToken) {
    throw new Error(data?.message || "Refresh failed");
  }

  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);

  // If backend rotates refresh tokens, persist the new one
  if (data.data.refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
  }

  return data.data.accessToken;
}
