// src/services/userService.ts

import { api } from "@/lib/apiClient";
import {
  ApiUserProfileResponse,
  AppProfile,
  apiToAppProfile,
  appToUpdatePayload,
} from "@/models/profilemodels";

type UpdateUserPayload = {
  gender_id: string; // "1" | "2"
  age: string; // "34"
  height_cm: string; // "150"
  weight_kg: string; // "70"
  activity_level: string; // 'sedentary', 'light', 'moderate', 'active'
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

export const userService = {
  register: (payload: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    password: string;
  }) =>
    api("/user/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload),
    }),

  getProfile: async () => {
    const res = await api<ApiUserProfileResponse>("/user/profile");
    if (!res.success) throw new Error("Failed to load profile");
    return apiToAppProfile(res.data);
  },

  updateUser: async (userId: number, profile: AppProfile) => {
    const payload = appToUpdatePayload(profile);
    const res = await api<{ success: boolean; data?: any; message?: string }>(
      `/user/update/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );

    if (!res.success)
      throw new Error(res.message || "Failed to update profile");
    return res;
  },
};

export async function updateUserProfile(
  userId: number,
  payload: UpdateUserPayload
) {
  const res = await api<ApiResponse>(`/user/udate/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.success) {
    throw new Error(res.message || "Failed to update user profile");
  }
  return res;
}