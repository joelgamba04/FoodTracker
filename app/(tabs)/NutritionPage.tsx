// app/(tabs)/NutritionPage.tsx

import AppHeader from "@/components/AppHeader";
import NutrientCard from "@/components/NutrientCard";
import { useFoodLog } from "@/context/FoodLogContext";
import { useHydration } from "@/context/hydrationContext";
import { useProfile } from "@/context/ProfileContext";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";
import React, { useMemo } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// --- Helper Methods ---
const calculateTotals = (log: any[]) => {
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;

  log.forEach((entry) => {
    const food = entry.food;
    if (!food) return;

    const qty = entry.quantity ?? 1;
    const useGrams = entry.useGrams ?? false;

    const baseGrams = food.serving?.grams ?? 100;

    const totalGrams = useGrams ? (entry.grams ?? 0) : qty * baseGrams;

    const factor = baseGrams ? totalGrams / baseGrams : qty;

    calories += food.calories * factor;
    protein += food.protein * factor;
    fat += food.fat * factor;
    carbs += food.carbs * factor;
  });

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  };
};

// --- Main Screen Component ---
export const NutritionPage = () => {
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

  const calorieData = {
    name: "Calories",
    amount: totals.calories,
    unit: rdi.Calories.unit,
  };

  const macroNutrients = [
    {
      key: "Carbohydrate",
      value: totals.carbs,
    },
    {
      key: "Protein",
      value: totals.protein,
    },
    {
      key: "Fat",
      value: totals.fat,
    },
  ];

  return (
    <ImageBackground
      source={require("../../assets/images/foodlogbg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView
        style={{
          flex: 1,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Page header */}
        <AppHeader title="Today’s Logs" subtitle="Food + Water (today only)" />

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
            {macroNutrients.map((item) => (
              <NutrientCard
                key={item.key}
                name={item.key}
                consumed={item.value}
                recommended={rdi[item.key].amount}
                unit={rdi[item.key].unit}
                isMacro
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: "transparent",
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

export default NutritionPage;
