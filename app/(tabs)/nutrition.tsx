import { ARBITRARY_RDI } from "@/constants/recommendedDailyIntake";
import { useFoodLog } from "@/context/FoodLogContext";
import { Nutrient } from "@/models/models";
import React from "react";
import {
  DimensionValue,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Theme Constants ---
const PRIMARY_BLUE = "#007AFF"; // Used for headers and markers
const ACCENT_GREEN = "#4CD964"; // Used for normal/on-track progress
const WARNING_YELLOW = "#FFCC00"; // Used for lacking progress
const DANGER_RED = "#FF3B30"; // Used for excessive progress
const GRAY_LIGHT = "#e8e8e8"; // Background for bars
const BACKGROUND_COLOR = "#f4f7f9"; // Screen background

// --- Helper Functions (Kept as is, but logic is fine) ---
function calculateTotals(log: any[]): Nutrient[] {
  const totals: { [key: string]: Nutrient } = {};
  log.forEach((entry) => {
    // Check if food and nutrients exist before iterating
    if (entry.food && entry.food.nutrients) {
      entry.food.nutrients.forEach((nutrient: Nutrient) => {
        if (!totals[nutrient.name]) {
          totals[nutrient.name] = { ...nutrient, amount: 0 };
        }
        totals[nutrient.name].amount += nutrient.amount * entry.quantity;
      });
    }
  });
  return Object.values(totals);
}

function getBarColor(percent: number) {
  if (percent > 1.2) return DANGER_RED; // Overeating
  if (percent < 0.6) return WARNING_YELLOW; // Severely lacking
  return ACCENT_GREEN; // Normal
}

// --- Reusable Nutrient Card Component ---
interface NutrientCardProps {
  name: string;
  consumed: number;
  recommended: number;
  unit: string;
  isMacro?: boolean; // Highlight Macros (Protein, Carbs, Fat)
}

const NutrientCard: React.FC<NutrientCardProps> = ({
  name,
  consumed,
  recommended,
  unit,
  isMacro = false,
}) => {
  const percent = consumed / recommended;
  // Set a max width for the bar to visually represent "too much" (e.g., 150%)
  const MAX_BAR_PERCENT = 1.5;
  // 1. Calculate the percentage of the RDI consumed, capped at MAX_VISUAL_PERCENT
  const cappedPercent = Math.min(percent, MAX_BAR_PERCENT);

  // 2. Map the capped percent to a percentage width of the parent container (barBackground).
  // Example: If consumed is 100% (percent=1), the bar should fill (1 / 1.5) * 100 = 66.67% of the background width.
  const visualWidthPercent = (cappedPercent / MAX_BAR_PERCENT) * 100;

  const barWidth: DimensionValue = `${visualWidthPercent}%`;
  const color = getBarColor(percent);

  // The 100% RDI marker should always be at (1 / MAX_VISUAL_PERCENT) * 100% of the barBackground.
  const markerPosition = `${(1 / MAX_BAR_PERCENT) * 100}%`;

  return (
    <View style={[styles.card, isMacro && styles.macroCard]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, isMacro && styles.macroTitle]}>
          {name}
        </Text>
        <Text style={styles.cardGoal}>
          Goal: {recommended.toFixed(0)}
          {unit}
        </Text>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.bar,
              {
                // CORRECTED: Use the calculated percentage width
                width: barWidth,
                backgroundColor: color,
              },
            ]}
          />
          {/* CORRECTED: Marker is now positioned using percentage */}
          <View style={[styles.marker, { left: markerPosition }]} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.consumedText}>
            Consumed:{" "}
            <Text style={{ color }}>
              {consumed.toFixed(name === "Calories" ? 0 : 1)}
            </Text>
            {unit}
          </Text>
          {percent > 1.2 ? (
            <Text style={styles.statusTextRed}>⚠️ Over Target</Text>
          ) : percent < 0.6 ? (
            <Text style={styles.statusTextYellow}>📉 Lacking</Text>
          ) : (
            <Text style={styles.statusTextGreen}>✅ On Track</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// --- Main Screen Component ---
export default function NutritionScreen() {
  const { log } = useFoodLog();
  const totals = calculateTotals(log);

  if (totals.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={styles.emptyHeading}>📊 Nutrition Overview</Text>
        <Text style={styles.emptyText}>Nothing to analyze yet!</Text>
        <Text style={styles.emptyText}>
          Log some food to see your daily totals and progress.
        </Text>
      </SafeAreaView>
    );
  }

  const calorieData = totals.find((n) => n.name === "Calories") || {
    name: "Calories",
    amount: 0,
    unit: "kcal",
  };
  const macroNutrients = ["Protein", "Carbohydrate", "Fat"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView style={styles.container}>
        <Text style={styles.mainHeading}>📊 Daily Nutrition Summary</Text>
        {/* --- CALORIES SECTION (Big Card) --- */}
        <Text style={styles.sectionTitle}>Calories Goal</Text>
        <NutrientCard
          name={calorieData.name}
          consumed={calorieData.amount}
          recommended={ARBITRARY_RDI["Calories"].amount}
          unit={ARBITRARY_RDI["Calories"].unit}
        />
        {/* --- MACRO NUTRIENTS SECTION --- */}
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroContainer}>
          {macroNutrients.map((name) => {
            const recommended = ARBITRARY_RDI[name].amount;
            const consumed =
              totals.find((nutrient) => nutrient.name === name)?.amount || 0;
            const unit = ARBITRARY_RDI[name].unit;

            return (
              <NutrientCard
                key={name}
                name={name}
                consumed={consumed}
                recommended={recommended}
                unit={unit}
                isMacro={true}
              />
            );
          })}
        </View>
        <View style={{ height: 50 }} /> {/* Spacer for end of scroll */}
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
  mainHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 20,
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },

  // --- Card Styles (Reusable Component) ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  macroCard: {
    // Style specific to macro cards if needed (e.g., a subtle border)
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  macroTitle: {
    color: PRIMARY_BLUE,
  },
  cardGoal: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },

  // --- Bar and Progress Styles ---
  barContainer: {
    marginTop: 5,
  },
  barBackground: {
    height: 12, // Thinner bar for a modern look
    backgroundColor: GRAY_LIGHT,
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
    position: "absolute",
    left: 0,
    top: 0,
  },
  marker: {
    position: "absolute",
    top: 0,
    width: 2,
    height: "100%",
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 1,
    zIndex: 10, // Ensure marker is always visible on top
  },

  // --- Summary Text Styles ---
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },
  consumedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  statusTextGreen: {
    color: ACCENT_GREEN,
    fontWeight: "bold",
    fontSize: 14,
  },
  statusTextYellow: {
    color: WARNING_YELLOW,
    fontWeight: "bold",
    fontSize: 14,
  },
  statusTextRed: {
    color: DANGER_RED,
    fontWeight: "bold",
    fontSize: 14,
  },

  // --- Empty State Styles ---
  emptyHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginHorizontal: 40,
    lineHeight: 24,
  },
  macroContainer: {
    // You can wrap macros in a container if you want them side-by-side on large screens
    // For now, keep them stacked for mobile screens (default Flow)
  },
});
