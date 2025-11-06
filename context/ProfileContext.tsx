import { ARBITRARY_RDI } from "@/constants/recommendedDailyIntake";
import { loadJSON, saveJSON } from "@/lib/storage";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type NutrientKey = keyof typeof ARBITRARY_RDI;

interface NutrientGoal {
  name: string;
  amount: number;
  unit: string;
}

interface UserProfile {
  age: string;
  height: string;
  weight: string;
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
const PROFILE_STORAGE_KEY = "@user_profile";
const RDI_STORAGE_KEY = "@user_rdi";

// --- Context Provider ---
export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    age: "",
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
        const storedProfile = await loadJSON<UserProfile>(PROFILE_STORAGE_KEY);
        const storedRdi = await loadJSON<Record<NutrientKey, NutrientGoal>>(
          RDI_STORAGE_KEY
        );

        if (storedProfile) {
          setProfile(storedProfile);
        }
        if (storedRdi) {
          setRdi(storedRdi);
        }
      } catch (error) {
        console.error("Failed to load profile from storage:", error);
      } finally {
        setIsProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Function to update state and persist data
  const updateProfile = useCallback(
    async (
      newProfile: UserProfile,
      newRdi: Record<NutrientKey, NutrientGoal>
    ) => {
      setProfile(newProfile);
      setRdi(newRdi);
      await Promise.all([
        saveJSON(PROFILE_STORAGE_KEY, newProfile),
        saveJSON(RDI_STORAGE_KEY, newRdi),
      ]);
    },
    []
  );

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
