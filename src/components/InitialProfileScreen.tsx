// src/components/InitialProfileScreen.tsx
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserProfile, defaultProfile } from "@/models/models";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PROFILE_CACHE_KEY as USER_PROFILE_KEY } from "@/constants/storageKeys";

type ProfileField = "age" | "sex" | "height" | "weight";

interface InitialProfileScreenProps {
  onComplete: (profile: UserProfile) => void;
}

const PRIMARY_BLUE = "#007AFF";
const ACCENT_GREEN = "#4CD964";
const BACKGROUND_COLOR = "#f4f7f9";
const BORDER_COLOR = "#ddd";

const InitialProfileScreen: React.FC<InitialProfileScreenProps> = ({
  onComplete,
}) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with existing profile if present
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadJSON<UserProfile>(USER_PROFILE_KEY);
        if (active && stored) {
          setProfile({
            ...defaultProfile,
            ...stored,
            age: String(stored.age ?? ""),
            height: String(stored.height ?? ""),
            weight: String(stored.weight ?? ""),
          });
        }
      } catch (e) {
        console.warn("InitialProfileScreen: failed to load stored profile", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = useCallback((field: ProfileField, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const validate = (profile: UserProfile): string | null => {
    if (!profile.age || !profile.height || !profile.weight) {
      return "Please enter your age, height, and weight.";
    }
    const ageNum = Number(profile.age);
    if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 120) {
      return "Please enter a valid age.";
    }
    const hNum = Number(profile.height);
    if (!Number.isFinite(hNum) || hNum <= 0) {
      return "Please enter a valid height.";
    }
    const wNum = Number(profile.weight);
    if (!Number.isFinite(wNum) || wNum <= 0) {
      return "Please enter a valid weight.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const maybeError = validate(profile);
    if (maybeError) {
      setError(maybeError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveJSON(USER_PROFILE_KEY, profile);
      onComplete(profile);
    } catch (e) {
      console.error("InitialProfileScreen: failed to save profile", e);
      setError("Failed to save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing your profile…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>👤 Tell us about you</Text>
        <Text style={styles.subheading}>
          These details will help Taguig NutriApp provide more relevant
          nutrition feedback.
        </Text>

        {/* Sex selection */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Basic Information</Text>

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
                  onPress={() => handleChange("sex", s)}
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
            onChangeText={(val) =>
              handleChange("age", val.replace(/[^0-9]/g, ""))
            }
          />
          <FormInput
            label="Height"
            unit="cm"
            keyboardType="numeric"
            value={profile.height}
            onChangeText={(val) =>
              handleChange("height", val.replace(/[^0-9.]/g, ""))
            }
          />
          <FormInput
            label="Weight"
            unit="kg"
            keyboardType="numeric"
            value={profile.weight}
            onChangeText={(val) =>
              handleChange("weight", val.replace(/[^0-9.]/g, ""))
            }
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving…" : "Save & Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Reusable input (copied from your ProfileScreen style)
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
        placeholder={`Enter ${label.toLowerCase()}…`}
        placeholderTextColor="#999"
      />
      {unit ? <Text style={styles.inputUnit}>{unit}</Text> : null}
    </View>
  </View>
);

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
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 8,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
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

  errorText: {
    fontSize: 14,
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },

  saveButton: {
    backgroundColor: ACCENT_GREEN,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 40,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default InitialProfileScreen;
