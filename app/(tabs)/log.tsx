// app/(tabs)/log.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AnimatedMetricCard } from "@/components/AnimatedMetricCard";
import { useFoodLog } from "@/context/FoodLogContext";
import { useHydration } from "@/context/hydrationContext";
import { useHydrationToday } from "@/hooks/hydrationHooks";
import { Food } from "@/models/models";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

// ---------- helpers ----------
const formatDate = (d: Date) => {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const getKcalFromFood = (food: Food): number => {
  if (!food) return 0;

  const nutrients = Array.isArray(food.nutrients) ? food.nutrients : [];
  const energy = nutrients.find((n: any) => {
    const name = String(n?.name ?? "").toLowerCase();
    const unit = String(n?.unit ?? "").toLowerCase();
    return (
      name.includes("energy") ||
      name.includes("calorie") ||
      name.includes("kcal") ||
      unit === "kcal"
    );
  });

  const amt = energy?.amount;
  return typeof amt === "number" && isFinite(amt) ? amt : 0;
};

const getFoodTitle = (food: any): string => {
  return (
    food?.name ?? food?.title ?? food?.food_name ?? food?.label ?? "Food item"
  );
};

const getMealByTimestamp = (
  timestamp: number,
): "Breakfast" | "Lunch" | "Dinner" => {
  const date = new Date(timestamp);
  const hour = date.getHours(); // 0–23

  if (hour < 11) return "Breakfast"; // 12:00am–10:59am
  if (hour < 16) return "Lunch"; // 11:00am–3:59pm
  return "Dinner"; // 4:00pm–11:59pm
};

// ---------- main screen ----------
export const LogDashboard = () => {
  const { log } = useFoodLog();
  const { entries: waterEntries, addMl } = useHydration();
  const { totalMl, goalMl } = useHydrationToday();

  const { start, end } = getTodayWindow();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const insets = useSafeAreaInsets();

  const todaysFood = useMemo(() => {
    return (log ?? []).filter((e) => {
      const ts =
        typeof e.timestamp === "number"
          ? e.timestamp
          : new Date(e.timestamp).getTime();
      return ts >= startMs && ts < endMs;
    });
  }, [log, startMs, endMs]);

  const todaysWaterMl = useMemo(() => {
    let total = 0;
    for (const e of waterEntries ?? []) {
      const ts =
        typeof e.timestamp === "number"
          ? e.timestamp
          : new Date(e.timestamp).getTime();
      if (ts >= startMs && ts < endMs) total += e.amount_ml;
    }
    return total;
  }, [waterEntries, startMs, endMs]);

  const todaysCalories = useMemo(() => {
    let total = 0;
    for (const entry of todaysFood) {
      const kcalPerUnit = getKcalFromFood(entry.food);
      const qty = typeof entry.quantity === "number" ? entry.quantity : 1;
      total += kcalPerUnit * qty;
    }
    return Math.round(total);
  }, [todaysFood]);

  const grouped = useMemo(() => {
    const map: Record<"Breakfast" | "Lunch" | "Dinner", typeof todaysFood> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
    };

    for (const e of todaysFood) {
      const ts =
        typeof e.timestamp === "number"
          ? e.timestamp
          : new Date(e.timestamp).getTime();

      const meal = getMealByTimestamp(ts);
      map[meal].push(e);
    }

    return map;
  }, [todaysFood]);

  return (
    <SafeAreaView style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today</Text>
          <Text style={styles.headerDate}>{formatDate(new Date())}</Text>
        </View>

        {/* Metrics grid */}
        <View style={styles.grid}>
          <AnimatedMetricCard
            title="Calories"
            value={`${todaysCalories}`}
            subtitle="kcal today"
            icon="flame"
            onPress={() => router.push({ pathname: "/addFood" })}
          />

          <AnimatedMetricCard
            title="Water"
            value={`${totalMl}`}
            subtitle={`/${goalMl} ml today`}
            icon="water"
            onPress={() => router.push("/(tabs)/hydration")}
          />

          <AnimatedMetricCard
            title="Activity"
            value="—"
            subtitle="Coming soon"
            icon="walk"
            disabled
          />

          <AnimatedMetricCard
            title="Sleep"
            value="—"
            subtitle="Coming soon"
            icon="moon"
            disabled
          />
        </View>

        {/* Quick water buttons (minimal) */}
        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={() => addMl(250)}>
            <Text style={styles.quickBtnText}>+250 ml</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => addMl(500)}>
            <Text style={styles.quickBtnText}>+500 ml</Text>
          </Pressable>
        </View>

        {/* Food log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Food Log</Text>
            <Pressable
              onPress={() => router.push({ pathname: "/addFood" })}
              style={styles.linkBtn}
            >
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.linkBtnText}>Add Food</Text>
            </Pressable>
          </View>

          {todaysFood.length === 0 ? (
            <Text style={styles.emptyText}>No meals logged yet.</Text>
          ) : (
            <>
              {(["Breakfast", "Lunch", "Dinner"] as const).map((m) => {
                const items = grouped[m] ?? [];
                return (
                  <View key={m} style={styles.mealBlock}>
                    <Text style={styles.mealTitle}>{m}</Text>

                    {items.length === 0 ? (
                      <Text style={styles.muted}>—</Text>
                    ) : (
                      items.map((entry) => (
                        <View key={entry.localId} style={styles.foodRow}>
                          <Text style={styles.foodTitle}>
                            {getFoodTitle(entry.food)}
                          </Text>
                          <Text style={styles.foodMeta}>
                            {Math.round(
                              getKcalFromFood(entry.food) *
                                (entry.quantity ?? 1),
                            )}{" "}
                            kcal
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* Bottom spacer so pill tab bar doesn’t overlap */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Add Food */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push({ pathname: "/addFood" })}
      >
        <Ionicons name="add" size={26} color={COLORS.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },

  header: { marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary },
  headerDate: { marginTop: 4, fontSize: 13, opacity: 0.65 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  quickRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 10 },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  quickBtnText: { fontWeight: "800", color: COLORS.textPrimary },

  section: {
    marginTop: 10,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900" },

  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  linkBtnText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },

  emptyText: { opacity: 0.65, paddingVertical: 12 },

  mealBlock: { paddingTop: 10, paddingBottom: 6 },
  mealTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8 },
  muted: { opacity: 0.5 },

  foodRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  foodTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  foodMeta: { marginTop: 4, fontSize: 12, opacity: 0.65 },

  fab: {
    position: "absolute",
    right: 18,
    bottom: 94, // above your pill tab bar
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});

export default LogDashboard;
