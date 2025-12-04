// app/(tabs)/Settings.tsx
import { NutrientKey, useProfile } from "@/context/ProfileContext";
import { useSteps } from "@/context/StepContext";

import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Theme Constants (Matching previous screens) ---
const PRIMARY_BLUE = "#007AFF";
const ACCENT_GREEN = "#4CD964";
const BACKGROUND_COLOR = "#f4f7f9";
const BORDER_COLOR = "#ddd";

// --- Reusable Goal Input Component ---
interface GoalInputProps {
  label: string;
  unit: string;
  value: string;
  isMacro?: boolean;
}

const GoalInput: React.FC<GoalInputProps> = ({
  label,
  unit,
  value,
  isMacro = false,
}) => (
  <View style={styles.row}>
    <Text style={[styles.label, isMacro && styles.macroLabel]}>{label}</Text>
    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        textAlign="right"
        placeholder="0"
        placeholderTextColor="#999"
        // CLIENT REQUEST: Fields are now read-only
        editable={false}
      />
      <Text style={styles.inputUnit}>{unit}</Text>
    </View>
  </View>
);

// --- Main Screen Component ---
export default function SettingsScreen() {
  const { rdi, profile } = useProfile();
  const { todaySteps, isAvailable, isLoading } = useSteps();

  const macros: NutrientKey[] = ["Calories", "Carbohydrate", "Protein", "Fat"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>Your Daily Goals</Text>

        {/* Optional: small profile summary at top */}
        {profile?.age && profile?.weight ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Based on your profile: {profile.sex}, {profile.age} yrs,{" "}
              {profile.weight} kg
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Macronutrient Goals</Text>

        <View style={styles.card}>
          {macros.map((key) => (
            <GoalInput
              key={key}
              label={key}
              unit={rdi[key].unit}
              value={rdi[key].amount.toString()}
              isMacro={true}
            />
          ))}
        </View>

        {/* --- Steps card --- */}
        <View style={styles.stepsCard}>
          <Text style={styles.sectionTitle}>Daily Steps</Text>

          {isLoading ? (
            <Text style={styles.stepsMuted}>Checking step data…</Text>
          ) : isAvailable === false ? (
            <Text style={styles.stepsMuted}>
              Step tracking is not available on this device.
            </Text>
          ) : todaySteps == null ? (
            <Text style={styles.stepsMuted}>
              Steps are not available yet. Try walking with the app open for a
              while.
            </Text>
          ) : (
            <View>
              <Text style={styles.stepsNumber}>
                {todaySteps.toLocaleString()}
              </Text>
              <Text style={styles.stepsMuted}>
                Steps recorded for today (midnight to now).
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: BACKGROUND_COLOR,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  macroLabel: {
    fontWeight: "700",
    color: PRIMARY_BLUE,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: 120,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    backgroundColor: BACKGROUND_COLOR,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    fontSize: 16,
    color: "#333",
    backgroundColor: "transparent",
  },
  inputUnit: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: PRIMARY_BLUE,
    fontWeight: "bold",
  },
  infoBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#e6f2ff",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  stepsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  stepsNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 4,
  },
  stepsMuted: {
    fontSize: 13,
    color: "#666",
  },
});
