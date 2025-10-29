import React, { useState } from "react";
import {
  Platform,
  ScrollView, // For the save button
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

// Default RDI values
const DEFAULT_RDI = {
  Calories: { name: "Calories", amount: 2000, unit: "kcal" },
  Protein: { name: "Protein", amount: 50, unit: "g" },
  Carbohydrate: { name: "Carbohydrate", amount: 300, unit: "g" },
  Fat: { name: "Fat", amount: 70, unit: "g" },
};

type RdiKey = keyof typeof DEFAULT_RDI;

// --- Reusable Goal Input Component ---
interface GoalInputProps {
  label: string;
  unit: string;
  value: string;
  onChangeText: (text: string) => void;
  isMacro?: boolean;
}

const GoalInput: React.FC<GoalInputProps> = ({
  label,
  unit,
  value,
  onChangeText,
  isMacro = false,
}) => (
  <View style={styles.row}>
    <Text style={[styles.label, isMacro && styles.macroLabel]}>{label}</Text>
    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        // Only allow numbers to be entered
        onChangeText={(text) => onChangeText(text.replace(/[^0-9.]/g, ""))}
        value={value}
        textAlign="right"
        placeholder="0"
        placeholderTextColor="#999"
        editable={false}
      />
      <Text style={styles.inputUnit}>{unit}</Text>
    </View>
  </View>
);

// --- Main Screen Component ---
export default function SettingsScreen() {
  // You should lift this state up to a context/provider for app-wide use!
  const [rdi, setRdi] = useState(DEFAULT_RDI);

  const handleChange = (name: RdiKey, value: string) => {
    // Only update if the value is a valid number (or empty string)
    const numericValue = value === "" ? 0 : Number(value);
    setRdi((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        amount: numericValue,
      },
    }));
  };

  const macros: RdiKey[] = ["Calories", "Protein", "Carbohydrate", "Fat"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>Your Daily Goals</Text>

        <Text style={styles.sectionTitle}>Macronutrient Goals</Text>

        {/* --- Card: Macronutrients --- */}
        <View style={styles.card}>
          {macros.map((key) => (
            <GoalInput
              key={key}
              label={key}
              unit={rdi[key].unit}
              value={rdi[key].amount.toString()}
              onChangeText={(val) => handleChange(key, val)}
              isMacro={true} // Apply macro highlighting
            />
          ))}
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
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },

  // --- Card Styles ---
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

  // --- Form Row Styles ---
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
    // Ensures the input area has a controlled width
    width: 120,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    backgroundColor: BACKGROUND_COLOR, // Slight contrast for the input field
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    fontSize: 16,
    color: "#333",
    // Remove background from input, use inputGroup background instead
    backgroundColor: "transparent",
  },
  inputUnit: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: PRIMARY_BLUE,
    fontWeight: "bold",
  },
});
