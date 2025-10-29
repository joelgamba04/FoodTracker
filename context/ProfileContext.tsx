import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

// --- Type Definitions (Copy these from your ProfileScreen) ---
const DEFAULT_RDI = {
  /* ... copied from ProfileScreen.tsx ... */
};
type NutrientKey = keyof typeof DEFAULT_RDI;

interface NutrientGoal {
  name: string;
  amount: number;
  unit: string;
}

interface UserProfile {
  age: string;
  height: string;
  weight: string;
  illness: string;
  medicines: string;
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
    illness: "None",
    medicines: "",
  });
  const [rdi, setRdi] =
    useState<Record<NutrientKey, NutrientGoal>>(DEFAULT_RDI);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Load profile and RDI from AsyncStorage on startup
  useEffect(() => {
    async function loadProfile() {
      try {
        const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        const storedRdi = await AsyncStorage.getItem(RDI_STORAGE_KEY);

        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
        if (storedRdi) {
          setRdi(JSON.parse(storedRdi));
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
      try {
        // Update state first
        setProfile(newProfile);
        setRdi(newRdi);

        // Persist to storage
        await AsyncStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify(newProfile)
        );
        await AsyncStorage.setItem(RDI_STORAGE_KEY, JSON.stringify(newRdi));
        console.log("Profile saved successfully.");
      } catch (error) {
        console.error("Failed to save profile:", error);
      }
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
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
