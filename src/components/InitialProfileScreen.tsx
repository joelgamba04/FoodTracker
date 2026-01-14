// src/components/InitialProfileScreen.tsx
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserProfile, defaultProfile } from "@/models/models";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PROFILE_DRAFT_KEY as USER_PROFILE_KEY } from "@/constants/storageKeys";

type ProfileField = "age" | "sex" | "height" | "weight";

// UI-only fields shown in the screenshot
type InitialProfileForm = UserProfile & {
  firstName?: string;
  lastName?: string;
};

interface InitialProfileScreenProps {
  onComplete: (profile: UserProfile) => void;
}

const PRIMARY_BLUE = "#0A66FF"; // closer to screenshot button blue
const BG = "#FFFFFF";
const MUTED = "#8A8F98";
const TEXT = "#0B0F14";
const FIELD_BG = "#F3F5F8";

const InitialProfileScreen: React.FC<InitialProfileScreenProps> = ({
  onComplete,
}) => {
  const [form, setForm] = useState<InitialProfileForm>(defaultProfile as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with existing draft if present
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await loadJSON<InitialProfileForm>(USER_PROFILE_KEY);
        if (active && stored) {
          setForm({
            ...(defaultProfile as any),
            ...stored,
            age: String((stored as any).age ?? ""),
            height: String((stored as any).height ?? ""),
            weight: String((stored as any).weight ?? ""),
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

  const handleChange = useCallback(
    (field: keyof InitialProfileForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const genderLabel = useMemo(() => {
    // “Gender” field placeholder style like screenshot
    return form.sex ? String(form.sex) : "Placeholder";
  }, [form.sex]);

  const validate = (profile: InitialProfileForm): string | null => {
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
    const maybeError = validate(form);
    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      // Save the whole form (including optional first/last name) to draft key
      await saveJSON(USER_PROFILE_KEY, form);

      // Call onComplete with required profile type (extra props are harmless at runtime)
      onComplete(form as unknown as UserProfile);
    } catch (e) {
      console.error("InitialProfileScreen: failed to save profile", e);
      setError("Failed to save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleGender = () => {
    // simple toggle; replace with picker later if you want
    const next = form.sex === "Male" ? "Female" : "Male";
    handleChange("sex", next);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top helper text */}
          <Text style={styles.helper}>
            These details will help Taguig NutriApp provide{"\n"}
            more relevant nutrition feedback
          </Text>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </View>

            <View style={styles.avatarPlus}>
              <Text style={styles.avatarPlusText}>+</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Create Profile</Text>

          {/* First/Last name row */}
          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Placeholder"
                placeholderTextColor={MUTED}
                value={(form.firstName ?? "") as string}
                onChangeText={(v) => handleChange("firstName", v)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Placeholder"
                placeholderTextColor={MUTED}
                value={(form.lastName ?? "") as string}
                onChangeText={(v) => handleChange("lastName", v)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity
            style={styles.inputPressable}
            activeOpacity={0.85}
            onPress={toggleGender}
          >
            <Text style={styles.inputPressableText}>{genderLabel}</Text>
          </TouchableOpacity>

          {/* Age */}
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Placeholder"
            placeholderTextColor={MUTED}
            keyboardType="numeric"
            value={String(form.age ?? "")}
            onChangeText={(v) => handleChange("age", v.replace(/[^0-9]/g, ""))}
            returnKeyType="next"
          />

          {/* Height */}
          <Text style={styles.label}>Height</Text>
          <TextInput
            style={styles.input}
            placeholder="Cm"
            placeholderTextColor={MUTED}
            keyboardType="numeric"
            value={String(form.height ?? "")}
            onChangeText={(v) =>
              handleChange("height", v.replace(/[^0-9.]/g, ""))
            }
            returnKeyType="next"
          />

          {/* Weight */}
          <Text style={styles.label}>Weight</Text>
          <TextInput
            style={styles.input}
            placeholder="Kg"
            placeholderTextColor={MUTED}
            keyboardType="numeric"
            value={String(form.weight ?? "")}
            onChangeText={(v) =>
              handleChange("weight", v.replace(/[^0-9.]/g, ""))
            }
            returnKeyType="done"
          />

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Save button */}
          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.75 }]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save & continue"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 28 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  helper: {
    textAlign: "center",
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },

  avatarWrap: {
    alignSelf: "center",
    marginBottom: 14,
    position: "relative",
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#D1D3D8",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 6,
  },
  avatarBody: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
  },
  avatarPlus: {
    position: "absolute",
    right: -2,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY_BLUE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: BG,
  },
  avatarPlusText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 14,
    marginTop: -1,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 18,
  },

  row2: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },

  label: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: FIELD_BG,
    color: TEXT,
    fontSize: 14,
  },

  inputPressable: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: FIELD_BG,
    justifyContent: "center",
  },
  inputPressableText: {
    color: MUTED, // matches placeholder look in screenshot
    fontSize: 14,
  },

  error: {
    marginTop: 12,
    color: "#D92D20",
    textAlign: "center",
    fontSize: 13,
  },

  button: {
    marginTop: 18,
    height: 52,
    borderRadius: 10,
    backgroundColor: PRIMARY_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default InitialProfileScreen;
