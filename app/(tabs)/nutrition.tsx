// app/(tabs)/Nutrition.tsx

import NutrientCard from "@/components/NutrientCard";
import { useFoodLog } from "@/context/FoodLogContext";
import { useHydration } from "@/context/hydrationContext";
import { NutrientKey, useProfile } from "@/context/ProfileContext";
import { Nutrient } from "@/models/models";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// --- Helper Functions ---
const calculateTotals = (log: any[]): Nutrient[] => {
  const totals: { [key: string]: Nutrient } = {};
  log.forEach((entry) => {
    if (entry.food && entry.food.nutrients) {
      entry.food.nutrients.forEach((nutrient: Nutrient) => {
        if (!totals[nutrient.name]) {
          totals[nutrient.name] = { ...nutrient, amount: 0 };
        }
        totals[nutrient.name].amount += nutrient.amount * (entry.quantity ?? 1);
      });
    }
  });
  return Object.values(totals);
};

// --- Main Screen Component ---
export const NutritionScreen = () => {
  const insets = useSafeAreaInsets();
  const { log } = useFoodLog();
  const { rdi } = useProfile();
  const { entries: waterEntries, isLoading: isWaterLoading } = useHydration();

  const { start, end } = getTodayWindow();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const todayFoodLog = useMemo(() => {
    return (log ?? []).filter((e) => {
      const ts =
        typeof e.timestamp === "number"
          ? e.timestamp
          : new Date(e.timestamp as any).getTime();
      return ts >= startMs && ts < endMs;
    });
  }, [log, startMs, endMs]);

  const todayWaterLog = useMemo(() => {
    return (waterEntries ?? []).filter(
      (e) => e.timestamp >= startMs && e.timestamp < endMs,
    );
  }, [waterEntries, startMs, endMs]);

  const totalWaterMl = useMemo(() => {
    return todayWaterLog.reduce((sum, e) => sum + (e.amount_ml ?? 0), 0);
  }, [todayWaterLog]);

  const totals = useMemo(() => calculateTotals(todayFoodLog), [todayFoodLog]);

  const hasFood = todayFoodLog.length > 0;
  const hasWater = totalWaterMl > 0;

  // Better empty state: no food AND no water
  if (!hasFood && !hasWater) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Text style={styles.emptyHeading}>Today’s Logs</Text>
        <Text style={styles.emptyText}>Nothing to analyze yet!</Text>
        <Text style={styles.emptyText}>
          Add water from the Water icon, or log food to see totals and progress.
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
        paddingBottom: insets.bottom,
      }}
    >
      {/* Header */}
      <Text style={styles.mainHeading}>Today’s Logs</Text>
      <Text style={styles.subHeading}>Food + Water (today only)</Text>

      <ScrollView style={styles.container}>
        {/* --- DAILY TOTALS / PROGRESS --- */}
        <Text style={styles.sectionTitle}>Calories Goal</Text>
        <NutrientCard
          name={calorieData.name}
          consumed={calorieData.amount}
          recommended={rdi.Calories.amount}
          unit={rdi.Calories.unit}
        />

        <Text style={styles.sectionTitle}>Hydration Goal</Text>
        <NutrientCard
          name="Water"
          consumed={totalWaterMl}
          recommended={rdi.Water.amount}
          unit="ml"
        />

        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View>
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
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: COLORS.background,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subHeading: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    opacity: 0.8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 10,
  },

  emptyHeading: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginHorizontal: 40,
    lineHeight: 22,
  },
});

export default NutritionScreen;
