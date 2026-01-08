// src/services/profileSyncService.ts

import {
  AUTH_USER_KEY,
  PROFILE_CACHE_KEY,
  PROFILE_DRAFT_KEY,
} from "@/constants/storageKeys";
import { api } from "@/lib/apiClient";
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserProfile } from "@/models/models";
import { updateUserProfile } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ApiUserProfileResponse = {
  success: boolean;
  data: {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    gender_id: number;
    age: number;
    height: string; // "150.00"
    weight: string; // "70.00"
  } | null;
};

function sexToGenderId(sex: string) {
  return sex === "Female" ? "2" : "1";
}

async function getCurrentUserId(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) throw new Error("Not logged in");
  const user = JSON.parse(raw);
  if (!user?.user_id) throw new Error("Missing user_id");
  return user.user_id;
}

function isServerProfileEmpty(p: ApiUserProfileResponse["data"]) {
  if (!p) return true;
  const ageOk = Number.isFinite(p.age) && p.age > 0;
  const gOk = Number.isFinite(p.gender_id) && p.gender_id > 0;
  const hOk = !!p.height && parseFloat(p.height) > 0;
  const wOk = !!p.weight && parseFloat(p.weight) > 0;
  return !(ageOk && gOk && (hOk || wOk));
}

/**
 * Post-login rule:
 * - If server profile is NOT empty -> do nothing (server wins)
 * - If server profile IS empty -> promote draft -> cache -> PUT update -> clear draft
 *
 * Returns info to help you debug.
 */
export async function syncDraftIfServerEmpty(): Promise<{
  didPromoteDraft: boolean;
  didUpdateServer: boolean;
}> {
  // 1) Read server profile
  const server = await api<ApiUserProfileResponse>("/user/profile", {
    method: "GET",
  });

  const empty = !server?.success || isServerProfileEmpty(server.data);
  if (!empty) {
    return { didPromoteDraft: false, didUpdateServer: false };
  }

  // 2) Server is empty -> try draft
  const draft = await loadJSON<UserProfile>(PROFILE_DRAFT_KEY);
  if (!draft) {
    // no draft available; nothing to promote
    return { didPromoteDraft: false, didUpdateServer: false };
  }

  // 3) Promote draft to cache immediately (so UI reflects it)
  await saveJSON(PROFILE_CACHE_KEY, draft);

  // 4) Push to backend
  const userId = await getCurrentUserId();
  await updateUserProfile(userId, {
    gender_id: sexToGenderId(draft.sex),
    age: String(draft.age ?? ""),
    height_cm: String(draft.height ?? ""),
    weight_kg: String(draft.weight ?? ""),
    activity_level: "active",
  });

  // 5) Clear draft so it won’t repeat
  await AsyncStorage.removeItem(PROFILE_DRAFT_KEY);

  return { didPromoteDraft: true, didUpdateServer: true };
}
