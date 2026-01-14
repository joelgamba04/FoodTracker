// app/(tabs)/ProfileScreen.tsx
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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

const PRIMARY_BLUE = "#007AFF";
const ACCENT_GREEN = "#4CD964";
const BACKGROUND_COLOR = "#f4f7f9";
const BORDER_COLOR = "#ddd";

type ProfileField = "age" | "sex" | "height" | "weight";

// helper to derive a gentle weight status
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

function getWeightStatus(form: {
  age: string;
  sex: string;
  weight: string;
}): WeightStatus | null {
  const age = parseFloat(form.age);
  const weightKg = parseFloat(form.weight);

  // If data is incomplete or clearly invalid, don’t show anything yet
  if (
    !Number.isFinite(age) ||
    !Number.isFinite(weightKg) ||
    age <= 18 ||
    weightKg <= 0
  ) {
    return null;
  }

  var score = 0;

  if (form.sex === "Male") {
    const RecommendedWeight = 60.5;
    score = (weightKg / RecommendedWeight) * 25;
  } else {
    const RecommendedWeight = 52.5;
    score = (weightKg / RecommendedWeight) * 25;
  }

  const diff = score - 25; // 0 = at recommended
  const absDiff = Math.abs(diff);

  // Define a gentle "normal" band around 25
  const NORMAL_BAND = 1.5; // you can tweak this: smaller = stricter middle

  // 1) Middle: close to recommended
  if (absDiff <= NORMAL_BAND) {
    return {
      category: "normal",
      label: "Within typical range",
      color: "#4CD964", // ACCENT_GREEN
      dotPosition: "center",
      message:
        "You’re within a common range for many adults. Keep focusing on balanced meals, movement, and good sleep to support your overall wellness.",
    };
  }

  // 2) Left extreme: lighter than recommended
  if (diff < 0) {
    return {
      category: "under",
      label: "Lighter than typical",
      color: "#5A9BFF", // soft blue
      dotPosition: "left",
      message:
        "You’re currently in a lighter range. If you feel well and energetic, that can be okay — but if you have concerns, a quick chat with a health professional is always best.",
    };
  }

  // 3) Right extreme: above recommended
  return {
    category: "over",
    label: "Above typical range",
    color: "#FFB347", // soft orange, less harsh than red
    dotPosition: "right",
    message:
      "You’re gently above the usual range. This is not a diagnosis — it’s just a guide. Small, sustainable changes in movement and food choices can already support your health.",
  };
}

export default function ProfileScreen() {
  const { profile, updateProfile, saveProfileToServer } = useProfile();
  const { logout } = useAuth();

  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // keep local form in sync when context profile changes (e.g. first load)
  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleProfileChange = useCallback(
    (field: ProfileField, value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(form);

      await saveProfileToServer(form);
      // updateProfile will recompute RDI + persist
      console.log("Profile updated & RDI recomputed:", form);
    } catch (e: any) {
      console.error("Error updating profile:", e);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // derive current status from the form (live as user types)
  const weightStatus = getWeightStatus(form);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingBottom: 50 + insets.bottom,
      }}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>👤 Your Personal Profile</Text>

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
                    form.sex === s ? styles.pillActive : styles.pillInactive,
                    { flex: 1, marginRight: s === "Male" ? 10 : 0 },
                  ]}
                  onPress={() => handleProfileChange("sex", s)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      form.sex === s
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

        {/* Gentle weight status card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Your Wellness Band</Text>

          {!weightStatus ? (
            <Text style={styles.statusHint}>
              Add your height and weight to see a gentle overview of where you
              currently sit. This is just a guide — not a diagnosis.
            </Text>
          ) : (
            <>
              <View style={styles.statusTagRow}>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: `${weightStatus.color}20` },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: weightStatus.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusTagText,
                      { color: weightStatus.color },
                    ]}
                  >
                    {weightStatus.label}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBar}>
                {/* left */}
                <View style={styles.statusBarSegment} />
                {/* center */}
                <View style={styles.statusBarSegment} />
                {/* right */}
                <View style={styles.statusBarSegment} />

                {/* dot */}
                <View
                  style={[
                    styles.statusBarDot,
                    weightStatus.dotPosition === "left" &&
                      styles.statusBarDotLeft,
                    weightStatus.dotPosition === "center" &&
                      styles.statusBarDotCenter,
                    weightStatus.dotPosition === "right" &&
                      styles.statusBarDotRight,
                    { borderColor: weightStatus.color },
                  ]}
                />
              </View>

              <Text style={styles.statusMessage}>{weightStatus.message}</Text>
            </>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "💾 Save Profile Changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// same FormInput & styles you already had
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: BACKGROUND_COLOR,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 20,
    textAlign: "center",
  },
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
      android: { elevation: 5 },
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
  row: { marginBottom: 15 },
  inputRow: { marginBottom: 15 },
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
  pillActive: { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE },
  pillInactive: { backgroundColor: "#fff", borderColor: BORDER_COLOR },
  pillText: { fontSize: 16, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  pillTextInactive: { color: "#555" },

  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 8,
  },
  statusHint: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  statusTagRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
    position: "relative",
  },
  statusBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e3e7ed",
    marginHorizontal: 2,
  },
  statusBarDot: {
    position: "absolute",
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
  },
  statusBarDotLeft: {
    left: "0%",
  },
  statusBarDotCenter: {
    left: "50%",
    marginLeft: -8,
  },
  statusBarDotRight: {
    right: 0,
  },
  statusMessage: {
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
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
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  logoutButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF3B30",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
});
