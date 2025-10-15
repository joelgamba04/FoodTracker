import React, { useState } from "react";
import {
  Platform, // For shadow styles
  ScrollView, // Used for custom buttons
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

// --- Data (Kept as is) ---
const DEFAULT_RDI = {
  Calories: { name: "Calories", amount: 2000, unit: "kcal" },
  Protein: { name: "Protein", amount: 50, unit: "g" },
  Carbohydrate: { name: "Carbohydrate", amount: 300, unit: "g" },
  Fat: { name: "Fat", amount: 70, unit: "g" },
  Fiber: { name: "Fiber", amount: 30, unit: "g" },
  Calcium: { name: "Calcium", amount: 1000, unit: "mg" },
  Iron: { name: "Iron", amount: 18, unit: "mg" },
  Sodium: { name: "Sodium", amount: 2300, unit: "mg" },
  Potassium: { name: "Potassium", amount: 4700, unit: "mg" },
};

const illnesses = ["None", "Diabetes", "Hypertension", "Kidney Disease"];

const illnessRdiAdjustments: Record<
  string,
  Partial<Record<keyof typeof DEFAULT_RDI, number>>
> = {
  Diabetes: { Carbohydrate: 200 },
  Hypertension: { Sodium: 1500 },
  "Kidney Disease": { Protein: 40, Sodium: 1200 },
};

type NutrientKey = keyof typeof DEFAULT_RDI;
type ProfileField = "age" | "height" | "weight" | "illness" | "medicines";

// --- Main Screen Component ---
export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    age: "",
    height: "",
    weight: "",
    illness: "None",
    medicines: "",
  });

  const [rdi, setRdi] = useState(DEFAULT_RDI);

  const handleProfileChange = (field: ProfileField, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIllnessChange = (illness: string) => {
    setProfile((prev) => ({
      ...prev,
      illness,
    }));

    // Adjust RDI based on illness (Keep logic as is)
    if (illness !== "None" && illnessRdiAdjustments[illness]) {
      setRdi((prevRdi) => {
        const adjustments = illnessRdiAdjustments[illness];
        const newRdi = { ...prevRdi };
        (Object.keys(adjustments) as NutrientKey[]).forEach((nutrient) => {
          if (newRdi[nutrient]) {
            newRdi[nutrient].amount = adjustments[nutrient]!;
          }
        });
        return newRdi;
      });
    } else {
      setRdi(DEFAULT_RDI);
    }
  };

  const handleSave = () => {
    // TODO: Save profile and RDI to context or persistent storage
    alert("Profile and RDI updated! (Implement persistence for real use)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>👤 Your Profile</Text>
        {/* --- Card: Basic Information --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Basic Information</Text>

          <FormInput
            label="Age"
            unit=""
            keyboardType="numeric"
            value={profile.age}
            onChangeText={(val) => handleProfileChange("age", val)}
          />
          <FormInput
            label="Height"
            unit="cm"
            keyboardType="numeric"
            value={profile.height}
            onChangeText={(val) => handleProfileChange("height", val)}
          />
          <FormInput
            label="Weight"
            unit="kg"
            keyboardType="numeric"
            value={profile.weight}
            onChangeText={(val) => handleProfileChange("weight", val)}
          />
        </View>
        {/* --- Card: Health Conditions --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Health Conditions</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Medical Illness:</Text>
            <View style={styles.illnessPillsContainer}>
              {illnesses.map((ill) => (
                <TouchableOpacity
                  key={ill}
                  style={[
                    styles.pill,
                    profile.illness === ill
                      ? styles.pillActive
                      : styles.pillInactive,
                  ]}
                  onPress={() => handleIllnessChange(ill)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      profile.illness === ill
                        ? styles.pillTextActive
                        : styles.pillTextInactive,
                    ]}
                  >
                    {ill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Maintenance Medicines:</Text>
            <TextInput
              style={styles.textArea}
              value={profile.medicines}
              onChangeText={(val) => handleProfileChange("medicines", val)}
              placeholder="List current medications and dosages..."
              multiline={true}
              numberOfLines={4}
            />
          </View>
        </View>
        {/* --- Card: Adjusted RDI Summary --- */}
        <View style={[styles.card, styles.rdiCard]}>
          <Text style={styles.cardHeader}>🎯 Your Adjusted Daily Goals</Text>
          <View style={styles.rdiGrid}>
            {(Object.keys(rdi) as NutrientKey[]).map((key) => (
              <View key={key} style={styles.rdiItem}>
                <Text style={styles.rdiValue}>
                  {rdi[key].amount}
                  <Text style={styles.rdiUnit}> {rdi[key].unit}</Text>
                </Text>
                <Text style={styles.rdiLabel}>{key}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* --- Save Button --- */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Save Profile Changes</Text>
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
  <View style={styles.row}>
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
  textArea: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#333",
    height: 100, // Fixed height for text area
    textAlignVertical: "top", // For Android multi-line
    fontSize: 16,
  },

  // --- Pills (Illness Selection) Styles ---
  illnessPillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
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
    fontSize: 14,
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#fff",
  },
  pillTextInactive: {
    color: "#555",
  },

  // --- RDI Grid Styles ---
  rdiCard: {
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_GREEN, // Highlight this card
  },
  rdiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 5,
  },
  rdiItem: {
    width: "30%", // Allows three items per row with some padding/margin
    marginBottom: 15,
    alignItems: "center",
    padding: 5,
    backgroundColor: BACKGROUND_COLOR, // Subtle background for RDI value
    borderRadius: 8,
  },
  rdiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_BLUE,
  },
  rdiUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY_BLUE,
  },
  rdiLabel: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
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
