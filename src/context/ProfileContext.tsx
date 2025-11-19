// src/context/ProfileContext.tsx

import { ARBITRARY_RDI } from "@/constants/recommendedDailyIntake";
import { calculateRecommendedIntake } from "@/lib/recommendedIntake";
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserProfile } from "@/models/models";
import { USER_PROFILE_KEY } from "@/utils/profileUtils";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type NutrientKey = keyof typeof ARBITRARY_RDI;

interface NutrientGoal {
  name: string;
  amount: number;
  unit: string;
}

// --- Context Types ---
interface ProfileContextType {
  profile: UserProfile;
  rdi: Record<NutrientKey, NutrientGoal>;
  isProfileLoading: boolean;
  // Method to update and save the entire profile state
  updateProfile: (
    newProfile: UserProfile,
    newRdi: Record<NutrientKey, NutrientGoal>
  ) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// --- Constants for AsyncStorage Keys ---
const RDI_STORAGE_KEY = "@user_rdi";

// --- Context Provider ---
export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    age: "",
    sex: "Male",
    height: "",
    weight: "",
  });
  const [rdi, setRdi] =
    useState<Record<NutrientKey, NutrientGoal>>(ARBITRARY_RDI);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Load profile and RDI from AsyncStorage on startup
  useEffect(() => {
    async function loadProfile() {
      try {
        const storedProfile = await loadJSON<UserProfile>(USER_PROFILE_KEY);
        const storedRdi = await loadJSON<Record<NutrientKey, NutrientGoal>>(
          RDI_STORAGE_KEY
        );

        if (storedProfile) {
          setProfile(storedProfile);
          const computed = calculateRecommendedIntake(storedProfile);
          setRdi(computed);
        } else {
          setRdi(ARBITRARY_RDI);
        }
        if (storedRdi) {
          setRdi(storedRdi);
        }
      } catch (error) {
        console.error("Failed to load profile from storage:", error);
        setRdi(ARBITRARY_RDI);
      } finally {
        setIsProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Function to update state and persist data
  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    setProfile(newProfile);
    const computed = calculateRecommendedIntake(newProfile);
    setRdi(computed);

    await saveJSON(USER_PROFILE_KEY, newProfile);
  }, []);

  return (
    <ProfileContext.Provider
      value={{ profile, rdi, isProfileLoading, updateProfile }}
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
