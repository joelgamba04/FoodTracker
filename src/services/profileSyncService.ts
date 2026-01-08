// src/services/profileSyncService.ts

import {
    AUTH_USER_KEY,
    PROFILE_CACHE_KEY,
    PROFILE_DRAFT_KEY,
} from "@/constants/storageKeys";
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserProfile } from "@/models/models";
import { updateUserProfile } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

function sexToGenderId(sex: string) {
  return sex === "Female" ? "2" : "1";
}

async function getCurrentUserId(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) throw new Error("Not logged in.");
  const user = JSON.parse(raw);
  if (!user?.user_id) throw new Error("Missing user_id.");
  return user.user_id;
}

/**
 * Syncs the locally-collected pre-login profile to the server exactly once.
 * - If there is no draft, it does nothing.
 * - If it succeeds, it clears the draft and updates cache.
 */
export async function syncDraftProfileAfterLogin(): Promise<void> {
  const draft = await loadJSON<UserProfile>(PROFILE_DRAFT_KEY);
  if (!draft) return; // nothing to sync

  const userId = await getCurrentUserId();

  await updateUserProfile(userId, {
    gender_id: sexToGenderId(draft.sex),
    age: draft.age,
    height_cm: draft.height,
    weight_kg: draft.weight,
    activity_level: "active",
  });

  // cache as "real" profile for fast UI
  await saveJSON(PROFILE_CACHE_KEY, draft);

  // clear draft so it does not re-apply
  await AsyncStorage.removeItem(PROFILE_DRAFT_KEY);
}
