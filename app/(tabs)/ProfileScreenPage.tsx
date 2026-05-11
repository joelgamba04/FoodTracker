// app/(tabs)/ProfileScreenPage.tsx

import AppHeader from "@/components/AppHeader";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import { AUTHENTICATED_AUTH_MODE } from "@/constants/authModeConstants";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { isApiError } from "@/lib/apiClient";
import { COLORS } from "@/theme/color";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type ProfileField = "age" | "sex" | "height" | "weight";

// helper to derive a weight status
type WeightStatus =
  | {
      category: "under";
      label: "Lighter than typical";
      color: string;
      dotPosition: "left";
      message: string;
    }
  | {
      category: "normal";
      label: "Within typical range";
      color: string;
      dotPosition: "center";
      message: string;
    }
  | {
      category: "over";
      label: "Above typical range";
      color: string;
      dotPosition: "right";
      message: string;
    };

const getWeightStatus = (form: {
  age: string;
  sex: string;
  weight: string;
}): WeightStatus | null => {
  const age = parseFloat(form.age);
  const weightKg = parseFloat(form.weight);

  if (
    !Number.isFinite(age) ||
    !Number.isFinite(weightKg) ||
    age <= 18 ||
    weightKg <= 0
  ) {
    return null;
  }

  let score = 0;

  if (form.sex === "Male") {
    const RecommendedWeight = 60.5;
    score = (weightKg / RecommendedWeight) * 25;
  } else {
    const RecommendedWeight = 52.5;
    score = (weightKg / RecommendedWeight) * 25;
  }

  const diff = score - 25;
  const absDiff = Math.abs(diff);
  const NORMAL_BAND = 1.5;

  if (absDiff <= NORMAL_BAND) {
    return {
      category: "normal",
      label: "Within typical range",
      color: COLORS.accentGreen,
      dotPosition: "center",
      message:
        "You’re within a common range for many adults. Keep focusing on balanced meals, movement, and good sleep to support your overall wellness.",
    };
  }

  if (diff < 0) {
    return {
      category: "under",
      label: "Lighter than typical",
      color: COLORS.softBlue,
      dotPosition: "left",
      message:
        "You’re currently in a lighter range. If you feel well and energetic, that can be okay — but if you have concerns, a quick chat with a health professional is always best.",
    };
  }

  return {
    category: "over",
    label: "Above typical range",
    color: COLORS.softOrange,
    dotPosition: "right",
    message:
      "You’re gently above the usual range. This is not a diagnosis — it’s just a guide. Small, sustainable changes in movement and food choices can already support your health.",
  };
};

const ProfileScreenPage = () => {
  const { profile, updateProfile, saveProfileToServer } = useProfile();
  const { logout, authMode } = useAuth();

  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleProfileChange = useCallback(
    (field: ProfileField, value: string) => {
      setError(null);
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const doSave = async () => {
    setSaving(true);
    setError(null);

    let localSaved = false;

    try {
      // 1) Always save locally first
      await updateProfile(form);
      localSaved = true;

      // 2) If authenticated, try syncing to backend
      if (authMode === AUTHENTICATED_AUTH_MODE) {
        await saveProfileToServer(form);
      }

      return {
        ok: true as const,
        localSaved: true,
        serverSynced: authMode !== AUTHENTICATED_AUTH_MODE ? null : true,
      };
    } catch (e: unknown) {
      console.error("Error updating profile:", e);

      // Local save failed
      if (!localSaved) {
        setError(
          "Failed to save your profile on this device. Please try again.",
        );
        return {
          ok: false as const,
          localSaved: false,
          serverSynced: null,
        };
      }

      // Local save succeeded, but backend sync failed
      if (isApiError(e)) {
        switch (e.kind) {
          case "NETWORK":
            setError(
              "Saved on this device, but can’t connect to the server right now.",
            );
            break;

          case "TIMEOUT":
            setError(
              "Saved on this device, but server sync timed out. Please try again later.",
            );
            break;

          case "SERVER_UNAVAILABLE":
            setError(
              "Saved on this device, but the server is temporarily unavailable.",
            );
            break;

          case "UNAUTHORIZED":
            setError(
              "Saved on this device, but your session expired. Please log in again.",
            );
            break;

          default:
            setError(
              e.message || "Saved on this device, but server sync failed.",
            );
            break;
        }
      } else {
        setError("Saved on this device, but server sync failed.");
      }

      return {
        ok: false as const,
        localSaved: true,
        serverSynced: false,
      };
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    console.log("Save button pressed with form data:", form);
    // Prevent double prompts while already saving
    if (saving) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    Alert.alert(
      "Save changes?",
      "This will update your profile details.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          style: "default",
          onPress: async () => {
            const result = await doSave();

            if (result.ok) {
              Alert.alert("Saved", "Your profile has been updated.");
              return;
            }

            if (result.localSaved && result.serverSynced === false) {
              Alert.alert(
                "Saved locally",
                "Your profile was saved on this device, but server sync failed.",
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const weightStatus = useMemo(() => getWeightStatus(form), [form]);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  // Check if there are any changes compared to the original profile
  const hasChanges = useMemo(() => {
    return (
      form.age !== profile.age ||
      form.sex !== profile.sex ||
      form.height !== profile.height ||
      form.weight !== profile.weight
    );
  }, [form, profile]);

  // Validation helper to check form inputs before enabling save
  const validateForm = () => {
    if (!form.age || !form.height || !form.weight) {
      return "Please enter your age, height, and weight.";
    }

    const ageNum = Number(form.age);
    if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 120) {
      return "Please enter a valid age.";
    }

    const heightNum = Number(form.height);
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      return "Please enter a valid height.";
    }

    const weightNum = Number(form.weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      return "Please enter a valid weight.";
    }

    return null;
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      {/* Header (match Settings / History hierarchy) */}
      <AppHeader
        title="Profile"
        subtitle="Update your details to personalize daily goals."
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { flexGrow: 1, paddingBottom: insets.bottom },
          ]}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          {/* Basic information card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pillsRow}>
              {(["Male", "Female"] as const).map((s) => {
                const active = form.sex === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.pill,
                      active ? styles.pillActive : styles.pillInactive,
                    ]}
                    onPress={() => handleProfileChange("sex", s)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        active
                          ? styles.pillTextActive
                          : styles.pillTextInactive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FormInput
              label="Age"
              unit="yrs"
              keyboardType="numeric"
              value={form.age}
              onChangeText={(val) =>
                handleProfileChange("age", val.replace(/[^0-9]/g, ""))
              }
            />

            <FormInput
              label="Height"
              unit="cm"
              keyboardType="numeric"
              value={form.height}
              onChangeText={(val) =>
                handleProfileChange("height", val.replace(/[^0-9.]/g, ""))
              }
            />

            <FormInput
              label="Weight"
              unit="kg"
              keyboardType="numeric"
              value={form.weight}
              onChangeText={(val) =>
                handleProfileChange("weight", val.replace(/[^0-9.]/g, ""))
              }
            />
          </View>

          {/* Wellness band (monochrome-friendly) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wellness Band</Text>

            {!weightStatus ? (
              <Text style={styles.bodyText}>
                Add your age, sex, and weight to see a gentle overview. This is
                a guide only — not a diagnosis.
              </Text>
            ) : (
              <>
                <View
                  style={[
                    styles.statusTag,
                    { borderColor: weightStatus.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      { color: weightStatus.color },
                    ]}
                  >
                    {weightStatus.label}
                  </Text>
                </View>

                <View style={styles.band}>
                  <View
                    style={[
                      styles.bandSeg,
                      { backgroundColor: COLORS.softBlue },
                    ]}
                  />
                  <View
                    style={[
                      styles.bandSeg,
                      { backgroundColor: COLORS.accentGreen },
                    ]}
                  />
                  <View
                    style={[
                      styles.bandSeg,
                      { backgroundColor: COLORS.softOrange },
                    ]}
                  />

                  <View
                    style={[
                      styles.bandDot,
                      { backgroundColor: weightStatus.color },
                      weightStatus.dotPosition === "left" && styles.bandDotLeft,
                      weightStatus.dotPosition === "center" &&
                        styles.bandDotCenter,
                      weightStatus.dotPosition === "right" &&
                        styles.bandDotRight,
                    ]}
                  />
                </View>

                <Text style={styles.bodyText}>{weightStatus.message}</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              console.log("Opening privacy modal");
              setPrivacyVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (saving || !hasChanges) && styles.primaryBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || !hasChanges}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>
              {saving ? "Saving…" : hasChanges ? "Save changes" : "No changes"}
            </Text>
          </TouchableOpacity>

          {/* Destructive outline */}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrivacyPolicyModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />
    </SafeAreaView>
  );
};

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
  <View style={{ marginTop: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputPill}>
      <TextInput
        style={styles.input}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={COLORS.textMuted}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 18, paddingTop: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    marginBottom: 6,
  },

  pillsRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  pillInactive: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.surfaceBorder,
  },
  pillText: { fontSize: 14, fontWeight: "900" },
  pillTextActive: { color: COLORS.primary },
  pillTextInactive: { color: COLORS.textPrimary },

  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  unit: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.textMuted,
    marginLeft: 10,
  },

  statusTag: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 10,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  band: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 10,
  },
  bandSeg: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    marginHorizontal: 3,
    opacity: 0.95,
  },
  bandDot: {
    position: "absolute",
    top: -7,
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  bandDotLeft: { left: 0 },
  bandDotCenter: { left: "50%", marginLeft: -8 },
  bandDotRight: { right: 0 },

  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  errorText: {
    marginTop: 2,
    marginBottom: 10,
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: "900",
  },

  logoutBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "900",
  },
  settingRow: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
});

export default ProfileScreenPage;
