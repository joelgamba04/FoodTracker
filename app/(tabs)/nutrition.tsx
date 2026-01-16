// app/(tabs)/nutrition.tsx
import NutrientCard from "@/components/NutrientCard";
import { useFoodLog } from "@/context/FoodLogContext";
import { NutrientKey, useProfile } from "@/context/ProfileContext";
import { Nutrient } from "@/models/models";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// --- Helper Functions ---
function calculateTotals(log: any[]): Nutrient[] {
  const totals: { [key: string]: Nutrient } = {};
  log.forEach((entry) => {
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

// --- Main Screen Component ---
export default function NutritionScreen() {
  const { log } = useFoodLog();
  const { rdi } = useProfile();

  const { start, end } = getTodayWindow();
  const insets = useSafeAreaInsets();

  const todayLog = log.filter((e) => {
    const ts = new Date(e.timestamp as any);
    return ts >= start && ts < end;
  });

  const totals = calculateTotals(todayLog);

  if (totals.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={styles.emptyHeading}>Nutrition Overview</Text>
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
    unit: rdi.Calories.unit,
  };

  const macroNutrients: NutrientKey[] = ["Carbohydrate", "Protein", "Fat"];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingBottom: 50 + insets.bottom,
      }}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.mainHeading}>Daily Nutrition Summary</Text>

        {/* --- CALORIES SECTION --- */}
        <Text style={styles.sectionTitle}>Calories Goal</Text>
        <NutrientCard
          name={calorieData.name}
          consumed={calorieData.amount}
          recommended={rdi.Calories.amount}
          unit={rdi.Calories.unit}
        />

        {/* --- MACRO NUTRIENTS SECTION --- */}
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroContainer}>
          {macroNutrients.map((key) => {
            const nutrientTotal =
              totals.find((n) => n.name === key)?.amount || 0;
            const goal = rdi[key];

            return (
              <NutrientCard
                key={key}
                name={key}
                consumed={nutrientTotal}
                recommended={goal.amount}
                unit={goal.unit}
                isMacro
              />
            );
          })}
        </View>
        {/* Spacer for end of scroll */}
        <View style={{ height: 50 }} />
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
    backgroundColor: COLORS.background,
  },
  mainHeading: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 15,
    marginBottom: 10,
  },

  emptyHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginHorizontal: 40,
    lineHeight: 24,
  },
  macroContainer: {},
});
