// src/context/ProfileContext.tsx

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ARBITRARY_RDI } from "@/constants/recommendedDailyIntake";
import { AUTH_USER_KEY, PROFILE_CACHE_KEY } from "@/constants/storageKeys";
import { api } from "@/lib/apiClient"; // <-- make sure you have this
import { calculateRecommendedIntake } from "@/lib/recommendedIntake";
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserProfile } from "@/models/models";
import { updateUserProfile } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ----- Types -----
export type NutrientKey = keyof typeof ARBITRARY_RDI;

interface NutrientGoal {
  name: string;
  amount: number;
  unit: string;
}

type ApiUserProfileResponse = {
  success: boolean;
  data: {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    gender_id: number; // assumed: 1=Male, 2=Female (adjust if backend differs)
    age: number;
    height: string; // "150.00"
    weight: string; // "70.00"
  };
};

interface ProfileContextType {
  profile: UserProfile;
  rdi: Record<NutrientKey, NutrientGoal>;
  isProfileLoading: boolean;

  // Local update (your existing behavior)
  updateProfile: (newProfile: UserProfile) => Promise<void>;

  // NEW: refresh from backend (GET /user/profile)
  refreshProfile: () => Promise<void>;
  saveProfileToServer: (nextProfile: UserProfile) => Promise<void>;
}

async function getCurrentUserId(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) throw new Error("Not logged in.");
  const user = JSON.parse(raw);
  if (!user?.user_id) throw new Error("Missing user_id.");
  return user.user_id;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// ----- Helpers -----
function genderIdToSex(genderId: number): "Male" | "Female" {
  // If your backend uses different ids, change mapping here only.
  return genderId === 2 ? "Female" : "Male";
}

function apiToUserProfile(res: ApiUserProfileResponse["data"]): UserProfile {
  return {
    age: String(res.age ?? ""),
    sex: genderIdToSex(res.gender_id ?? 1),
    height: String(res.height ?? ""),
    weight: String(res.weight ?? ""),
  };
}

// ----- Provider -----
export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    age: "",
    sex: "Male",
    height: "",
    weight: "",
  });

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Always derive RDI from the current profile (prevents stale RDI)
  const rdi = useMemo<Record<NutrientKey, NutrientGoal>>(() => {
    try {
      return calculateRecommendedIntake(profile);
    } catch {
      return ARBITRARY_RDI;
    }
  }, [profile]);

  // 1) Load cached profile fast on startup, then optionally refresh from API
  useEffect(() => {
    (async () => {
      try {
        const cached = await loadJSON<UserProfile>(PROFILE_CACHE_KEY);
        if (cached) setProfile(cached);
      } catch (e) {
        console.warn("ProfileProvider: failed to load cached profile", e);
      } finally {
        setIsProfileLoading(false);
      }
    })();
  }, []);

  // 2) Local update + persist (same as your current updateProfile but Promise-safe)
  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    setProfile(newProfile);

    try {
      await saveJSON(PROFILE_CACHE_KEY, newProfile);
    } catch (e) {
      console.warn("ProfileProvider: failed to save profile", e);
    }
  }, []);

  // 3) NEW: Refresh from backend GET /user/profile and cache it
  const refreshProfile = useCallback(async () => {
    try {
      const res = await api<ApiUserProfileResponse>("/user/profile", {
        method: "GET",
      });

      if (!res?.success) throw new Error("Failed to load profile");

      const nextProfile = apiToUserProfile(res.data);
      setProfile(nextProfile);

      // Cache the backend result as the new local profile
      try {
        await saveJSON(PROFILE_CACHE_KEY, nextProfile);
      } catch (e) {
        console.warn("ProfileProvider: failed to cache server profile", e);
      }
    } catch (e) {
      // Don’t hard-crash; rely on cached profile if available
      console.warn("ProfileProvider: refreshProfile failed", e);
    }
  }, []);

  const saveProfileToServer = useCallback(
    async (nextProfile: UserProfile) => {
      const userId = await getCurrentUserId();

      const payload = {
        gender_id: nextProfile.sex === "Female" ? "2" : "1",
        age: nextProfile.age,
        height_cm: nextProfile.height,
        weight_kg: nextProfile.weight,
        activity_level: "active",
      };

      await updateUserProfile(userId, payload);

      // Recommended: refresh from backend so app stays aligned with server formatting
      await refreshProfile();
    },
    [refreshProfile]
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        rdi,
        isProfileLoading,
        updateProfile,
        refreshProfile,
        saveProfileToServer,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
};
