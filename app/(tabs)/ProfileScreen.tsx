// app/(tabs)/ProfileScreen.tsx
import { useProfile } from "@/context/ProfileContext";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_BLUE = "#007AFF";
const ACCENT_GREEN = "#4CD964";
const BACKGROUND_COLOR = "#f4f7f9";
const BORDER_COLOR = "#ddd";

type ProfileField = "age" | "sex" | "height" | "weight";

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();

  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // updateProfile will recompute RDI + persist
      console.log("Profile updated & RDI recomputed:", form);
    } catch (e: any) {
      console.error("Error updating profile:", e);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
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
      <Text style={styles.inputUnit}>{unit ? unit : null}</Text>
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
});
