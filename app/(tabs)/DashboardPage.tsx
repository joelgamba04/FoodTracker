// app/(tabs)/DashboardPage.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useFoodLog } from "@/context/FoodLogContext";
import { useProfile } from "@/context/ProfileContext";
import { useHydrationToday } from "@/hooks/hydrationHooks";
import { useHealth } from "@/hooks/useHealth";
import { Food } from "@/models/models";
import { getHealthConnected } from "@/services/health/healthCache";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

import ChartPlaceholder from "@/components/ChartPlaceholder";
import MetricLine from "@/components/MetricLine";
import SmallMetricCard from "@/components/SmallMetricCard";

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
export const DashboardPage = () => {
  const router = useRouter();
  const { log } = useFoodLog();
  const { rdi } = useProfile();

  const { totalMl, goalMl } = useHydrationToday();

  const { start, end } = getTodayWindow();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const insets = useSafeAreaInsets();

  const { data: health, loadCachedHealth } = useHealth();
  const [healthConnected, setHealthConnected] = useState(false);

  const todaySteps = health?.steps?.todaySteps ?? null;
  const lastNightHours = health?.sleep?.lastNightHours ?? null;

  const hasStepsData = typeof todaySteps === "number" && todaySteps > 0;
  const hasSleepData = typeof lastNightHours === "number" && lastNightHours > 0;

  const todaysFood = useMemo(() => {
    return (log ?? []).filter((e) => {
      const ts =
        typeof e.timestamp === "number"
          ? e.timestamp
          : new Date(e.timestamp).getTime();
      return ts >= startMs && ts < endMs;
    });
  }, [log, startMs, endMs]);

  const todaysCalories = useMemo(() => {
    let total = 0;
    for (const entry of todaysFood) {
      const kcalPerUnit = getKcalFromFood(entry.food);
      const qty = typeof entry.quantity === "number" ? entry.quantity : 1;
      total += kcalPerUnit * qty;
    }
    return Math.round(total);
  }, [todaysFood]);

  const calorieRDI = useMemo(() => {
    const amount = rdi?.Calories?.amount;
    return typeof amount === "number" && isFinite(amount) ? amount : 1600;
  }, [rdi]);

  const waterRDI = useMemo(() => {
    const amount = rdi?.Water?.amount;
    return typeof amount === "number" && isFinite(amount) ? amount : goalMl;
  }, [rdi, goalMl]);

  const caloriesLeft = useMemo(() => {
    return Math.max(0, calorieRDI - todaysCalories);
  }, [calorieRDI, todaysCalories]);

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

  const goToAddFood = () => {
    router.push("/AddFoodPage");
  };

  const stepsValue = !healthConnected
    ? "Setup"
    : hasStepsData
      ? todaySteps.toLocaleString()
      : "No data";

  const stepsSubtitle = !healthConnected
    ? "Tap to connect"
    : hasStepsData
      ? "steps today"
      : "Open steps page";

  const sleepValue = !healthConnected
    ? "Setup"
    : hasSleepData
      ? lastNightHours.toFixed(1)
      : "No data";

  const sleepSubtitle = !healthConnected
    ? "Tap to connect"
    : hasSleepData
      ? "hrs last night"
      : "Open sleep page";

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadHealth = async () => {
        const connected = await getHealthConnected();

        if (!active) return;

        setHealthConnected(connected);

        if (connected) {
          await loadCachedHealth();
        }
      };

      void loadHealth();

      return () => {
        active = false;
      };
    }, [loadCachedHealth]),
  );

  console.log("Health data on dashboard:", health);

  return (
    <ImageBackground
      source={require("../../assets/images/login_bg.png")}
      style={styles.bg}
      imageStyle={styles.bgImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 110 + insets.bottom },
          ]}
        >
          <View style={styles.hero}>
            {/* <View style={styles.heroImages}>
              <View style={styles.foodImageLeft}>
                <Text style={styles.placeholderText}>Food Image</Text>
              </View>

              <View style={styles.foodImageRight}>
                <Text style={styles.placeholderText}>Meal Image</Text>
              </View>
            </View> */}

            <Text style={styles.greeting}>
              <Text style={styles.redText}>Good </Text>
              <Text style={styles.blueText}>Morning!</Text> 👋
            </Text>

            <Text style={styles.greetingSub}>
              Let's make today a healthy one.
            </Text>
          </View>

          <View style={styles.dateRow}>
            {[8, 9, 10, 11, 12, 13, 14].map((day) => {
              const active = day === 10;

              return (
                <View key={day} style={styles.dateItem}>
                  <Text style={styles.dateWeek}>
                    {["Su", "S", "M", "T", "W", "Th", "F"][day - 8]}
                  </Text>

                  <View
                    style={[styles.dateCircle, active && styles.dateActive]}
                  >
                    <Text
                      style={[styles.dateNum, active && styles.dateNumActive]}
                    >
                      {day}
                    </Text>
                  </View>

                  {active && <View style={styles.dateUnderline} />}
                </View>
              );
            })}
          </View>

          <Pressable onPress={goToAddFood} style={styles.calorieCard}>
            <View style={styles.calorieLeft}>
              <Text style={styles.cardTitle}>Calories Left</Text>
              <Text style={styles.caloriesLeft}>{caloriesLeft}</Text>
              <Text style={styles.smallMuted}>food left</Text>

              <View style={styles.goalPill}>
                <Ionicons name="flame" size={14} color={COLORS.taguigBlue} />
                <Text style={styles.goalText}>
                  {calorieRDI.toLocaleString()} kcal goal
                </Text>
              </View>
            </View>

            <View style={styles.calorieMiddle}>
              <MetricLine
                icon="disc-outline"
                color={COLORS.taguigRed}
                label="Food"
                value={`${todaysCalories} kcal`}
              />
              <MetricLine
                icon="water"
                color={COLORS.taguigBlue}
                label="Burned"
                value="400 kcal"
              />
              <MetricLine
                icon="flame"
                color={COLORS.taguigYellow}
                label="Remaining"
                value={`${caloriesLeft} kcal`}
              />
            </View>

            <View style={styles.progressCircle}>
              <Text style={styles.progressEmoji}>🍎</Text>
            </View>
          </Pressable>

          <View style={styles.smallCardsRow}>
            <SmallMetricCard
              color={COLORS.taguigBlue}
              icon="water"
              title="Water Intake"
              value={waterRDI > 0 ? `${(totalMl / 1000).toFixed(1)} L` : "0 L"}
              subtitle={`/ ${(goalMl / 1000).toFixed(1)} L goal`}
              percent={Math.min(100, Math.round((totalMl / goalMl) * 100))}
              onPress={() => router.push("/HydrationPage")}
            />

            <SmallMetricCard
              color={COLORS.taguigBlue}
              icon="walk"
              title="Steps"
              value={hasStepsData ? todaySteps.toLocaleString() : "0"}
              subtitle="/ 10,000 steps"
              percent={
                hasStepsData
                  ? Math.min(100, Math.round((todaySteps / 10000) * 100))
                  : 0
              }
              onPress={() => router.push("/StepsTrackerPage")}
            />

            <SmallMetricCard
              color="#0B3D91"
              icon="moon"
              title="Sleep"
              value={hasSleepData ? `${lastNightHours.toFixed(1)}h` : "0h"}
              subtitle="/ 8 h goal"
              percent={
                hasSleepData
                  ? Math.min(100, Math.round((lastNightHours / 8) * 100))
                  : 0
              }
              onPress={() => router.push("/SleepPage")}
            />
          </View>

          <Pressable onPress={() => router.push("/StepsTrackerPage")}>
            <ChartPlaceholder
              title="Steps"
              subtitle="7 Days"
              color={COLORS.taguigRed}
            />
          </Pressable>
          <Pressable onPress={() => router.push("/SleepPage")}>
            <ChartPlaceholder
              title="Sleep Quality"
              subtitle="7 Days"
              color={COLORS.taguigBlue}
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: COLORS.whiteBGTransparent,
  },

  bgImage: {
    width: "100%",
    height: "100%",
  },
  screen: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 16 },

  hero: {
    minHeight: 270,
    marginHorizontal: -16,
    alignItems: "center",
    overflow: "hidden",
  },

  heroTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 2,
  },

  bellWrap: { position: "relative" },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.taguigRed,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },

  heroImages: {
    ...StyleSheet.absoluteFillObject,
  },
  foodImageLeft: {
    position: "absolute",
    left: -20,
    top: 80,
    width: 170,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  foodImageRight: {
    position: "absolute",
    right: -24,
    top: 78,
    width: 170,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  greeting: {
    marginTop: 90,
    fontSize: 30,
    fontWeight: "900",
    zIndex: 2,
  },
  greetingSub: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "600",
    zIndex: 2,
  },
  redText: { color: COLORS.taguigRed },
  blueText: { color: COLORS.taguigBlue },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -26,
    marginBottom: 18,
  },
  dateItem: { alignItems: "center", flex: 1 },
  dateWeek: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary },
  dateCircle: {
    marginTop: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 9,
    borderColor: "#2DBE45",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  progressEmoji: { fontSize: 42 },

  smallCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  dateActive: {
    backgroundColor: COLORS.taguigRed,
    borderColor: COLORS.taguigRed,
  },
  dateNum: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  dateNumActive: { color: "#FFFFFF" },
  dateUnderline: {
    marginTop: 8,
    width: 34,
    height: 4,
    borderRadius: 99,
    backgroundColor: COLORS.taguigRed,
  },

  calorieCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  calorieLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
  caloriesLeft: { fontSize: 54, fontWeight: "900", color: COLORS.taguigRed },
  smallMuted: { color: COLORS.textSecondary, fontWeight: "600" },
  goalPill: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#EAF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goalText: { color: COLORS.taguigBlue, fontWeight: "800", fontSize: 12 },

  calorieMiddle: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },

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

export default DashboardPage;
