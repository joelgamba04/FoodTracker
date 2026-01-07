// src/services/userService.ts

import { api } from "@/lib/apiClient";
import {
    ApiUserProfileResponse,
    AppProfile,
    apiToAppProfile,
    appToUpdatePayload,
} from "@/models/profilemodels";

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
