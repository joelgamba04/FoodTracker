import React, { useCallback, useEffect, useState } from "react";
import {
  Platform, // <-- Now explicitly used for platform checks
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Theme Constants ---
const PRIMARY_BLUE = "#007AFF";
const ACCENT_GREEN = "#4CD964";
const BACKGROUND_COLOR = "#f4f7f9";
const BORDER_COLOR = "#ddd";

// --- Local Persistence Key ---
const STORAGE_KEY = "@UserProfile";

// --- Profile Data Structure ---
interface UserProfile {
  age: string;
  sex: string;
  height: string;
  weight: string;
}

const initialProfile: UserProfile = {
  age: "",
  sex: "Male",
  height: "",
  weight: "",
};

type ProfileField = "age" | "height" | "weight" | "sex";

// --- Cross-Platform Storage Abstraction ---

// Define the core storage mechanism based on environment
let storageImpl: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

// --- PLATFORM-SPECIFIC PERSISTENCE IMPLEMENTATION ---
// Use Platform.OS to determine the correct storage mechanism (Web vs. Native)

if (Platform.OS === "web") {
  // --- Web Environment: Use localStorage ---
  console.log("Persistence: Using localStorage (Web).");
  storageImpl = {
    // Wrap synchronous localStorage call in a Promise to simulate async AsyncStorage
    getItem: (key: string) =>
      new Promise((resolve) => resolve(localStorage.getItem(key))),
    // Wrap synchronous localStorage call in a Promise to simulate async AsyncStorage
    setItem: (key: string, value: string) =>
      new Promise((resolve) => {
        // Since we know localStorage exists here, we can use it safely
        localStorage.setItem(key, value);
        resolve();
      }),
  };
} else {
  // --- Native/Mobile Environment (Platform.OS is 'ios' or 'android'): Use AsyncStorage placeholder ---

  // NOTE FOR DEVELOPER:
  // In a real native app, you MUST import and use the actual AsyncStorage
  // library here (e.g., '@react-native-async-storage/async-storage').
  // The code below is a placeholder to prevent crashes when running outside of web.
  console.warn(`Persistence: Using AsyncStorage mock for ${Platform.OS}.`);

  storageImpl = {
    // These methods would be replaced by AsyncStorage.getItem()
    getItem: async () => Promise.resolve(null),
    // These methods would be replaced by AsyncStorage.setItem()
    setItem: async () => Promise.resolve(),
  };
}

// This object acts as the universal API interface for all components
const AsyncLocalStore = {
  /**
   * Loads data asynchronously using the platform-specific implementation.
   */
  getItem: storageImpl.getItem,
  /**
   * Saves data asynchronously using the platform-specific implementation.
   */
  setItem: storageImpl.setItem,
};

/**
 * Saves the user profile data via the unified persistence layer.
 */
const saveProfileData = async (profile: UserProfile): Promise<void> => {
  try {
    const dataToSave = JSON.stringify(profile);
    // Use the universal API (AsyncLocalStore)
    await AsyncLocalStore.setItem(STORAGE_KEY, dataToSave);
  } catch (e: any) {
    console.error("Error saving profile data:", e);
    throw new Error("Failed to save data locally.");
  }
};

/**
 * Loads the user profile data from the unified persistence layer.
 */
const loadProfileData = async (): Promise<UserProfile | null> => {
  try {
    // Use the universal API (AsyncLocalStore)
    const storedData = await AsyncLocalStore.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData) as UserProfile;
    }
    return null;
  } catch (e: any) {
    console.error("Error loading profile data:", e);
    throw new Error("Failed to load data locally.");
  }
};

// --- Main Screen Component ---
export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. DATA LOADING (Uses the abstracted layer in an async effect)
  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadedProfile = await loadProfileData();

        if (loadedProfile) {
          // Load stored data, ensuring values are strings for TextInput component
          setProfile({
            ...initialProfile,
            ...loadedProfile,
            age: String(loadedProfile.age || ""),
            height: String(loadedProfile.height || ""),
            weight: String(loadedProfile.weight || ""),
          });
          console.log("Profile loaded successfully.");
        } else {
          console.log("No local profile found, using defaults.");
        }
      } catch (e: any) {
        setError(e.message || "An unknown error occurred during loading.");
      } finally {
        setLoading(false);
      }
    };
    initializeProfile();
  }, []); // Run only once on mount

  // 2. DATA SAVING (Uses the abstracted layer)
  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await saveProfileData(profile);
      console.log("Profile saved successfully to local storage!");
    } catch (e: any) {
      setError(e.message || "An unknown error occurred during saving.");
    } finally {
      setLoading(false);
    }
  };

  // Profile change handler remains the same
  const handleProfileChange = useCallback(
    (field: ProfileField, value: string) => {
      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>👤 Your Personal Profile</Text>
        {/* --- Card: Basic Information --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Basic Information</Text>

          {/* Sex Selection */}
          <View style={styles.row}>
            <Text style={styles.label}>Sex:</Text>
            <View style={styles.sexPillsContainer}>
              {["Male", "Female"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.pill,
                    profile.sex === s ? styles.pillActive : styles.pillInactive,
                    { flex: 1, marginRight: s === "Male" ? 10 : 0 },
                  ]}
                  onPress={() => handleProfileChange("sex", s)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      profile.sex === s
                        ? styles.pillTextActive
                        : styles.pillTextInactive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FormInput
            label="Age"
            unit=""
            keyboardType="numeric"
            value={profile.age}
            // Input validation to only allow numbers
            onChangeText={(val) =>
              handleProfileChange("age", val.replace(/[^0-9]/g, ""))
            }
          />
          <FormInput
            label="Height"
            unit="cm"
            keyboardType="numeric"
            value={profile.height}
            // Input validation to only allow numbers and decimal point
            onChangeText={(val) =>
              handleProfileChange("height", val.replace(/[^0-9.]/g, ""))
            }
          />
          <FormInput
            label="Weight"
            unit="kg"
            keyboardType="numeric"
            value={profile.weight}
            // Input validation to only allow numbers and decimal point
            onChangeText={(val) =>
              handleProfileChange("weight", val.replace(/[^0-9.]/g, ""))
            }
          />
        </View>
        {/* --- Save Button --- */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading} // Disable while loading/saving
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "💾 Save Profile Changes (Local)"}
          </Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} /> {/* Spacer */}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Reusable Form Input Component ---
interface FormInputProps {
  label: string;
  unit: string;
  keyboardType: "numeric" | "default";
  value: string;
  onChangeText: (text: string) => void;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  unit,
  keyboardType,
  value,
  onChangeText,
}) => (
  <View style={styles.inputRow}>
    <Text style={styles.label}>{label}:</Text>
    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}...`}
        placeholderTextColor="#999"
      />
      {unit ? <Text style={styles.inputUnit}>{unit}</Text> : null}
    </View>
  </View>
);

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: BACKGROUND_COLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLOR,
  },
  loadingText: {
    fontSize: 18,
    color: PRIMARY_BLUE,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    fontWeight: "600",
    textAlign: "center",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 20,
    textAlign: "center",
  },

  // --- Card Styles ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 8,
  },

  // --- Form Row/Input Styles ---
  row: {
    marginBottom: 15,
  },
  inputRow: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    fontSize: 15,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  inputUnit: {
    paddingRight: 15,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontWeight: "bold",
  },

  // --- Pills (Sex Selection) Styles ---
  sexPillsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  pillInactive: {
    backgroundColor: "#fff",
    borderColor: BORDER_COLOR,
  },
  pillText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#fff",
  },
  pillTextInactive: {
    color: "#555",
  },

  // --- Save Button Styles ---
  saveButton: {
    backgroundColor: ACCENT_GREEN,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
