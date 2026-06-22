// app/(tabs)/DashboardPage.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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

import MetricLine from "@/components/MetricLine";
import ProgressRing from "@/components/ProgressRing";
import SleepQualityChart from "@/components/SleepChart";
import SmallMetricCard from "@/components/SmallMetricCard";
import StepsChart from "@/components/StepsChart";

const sampleSleepQuality = [
  { value: 78, label: "Mon" },
  { value: 85, label: "Tue" },
  { value: 72, label: "Wed" },
  { value: 91, label: "Thu" },
  { value: 80, label: "Fri" },
  { value: 88, label: "Sat" },
  { value: 84, label: "Sun" },
];
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

const getTimestampMs = (timestamp: unknown): number => {
  if (typeof timestamp === "number") return timestamp;
  if (typeof timestamp === "string") {
    const parsed = Number(timestamp);
    if (!Number.isNaN(parsed)) return parsed;
    return new Date(timestamp).getTime();
  }
  if (timestamp instanceof Date) return timestamp.getTime();
  return NaN;
};

// ---------- main screen ----------
export const DashboardPage = () => {
  const { width, height } = useWindowDimensions();
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

  // helpers for screen size
  const scale = Math.min(width / 390, height / 844);
  const rf = (size: number, min = size * 0.82, max = size * 1.15) => {
    return Math.min(Math.max(size * scale, min), max);
  };

  const rs = (size: number, min = size * 0.85, max = size * 1.2) => {
    return Math.min(Math.max(size * scale, min), max);
  };
  const isSmallPhone = width < 370;

  const burnedCalories = useMemo(() => {
    if (todaySteps === null || todaySteps === undefined) return null;
    const caloriesPerStep = 0.04; // estimated kcal burned per step
    return Math.round(todaySteps * caloriesPerStep);
  }, [todaySteps]);

  const burnedCaloriesDisplay =
    burnedCalories === null ? "Unavailable" : `${burnedCalories} kcal`;

  const chartWidth = Math.min(width - 58, 680);
  const barSpacing = Math.max(16, chartWidth / 13);

  const todaysFood = useMemo(() => {
    return (log ?? []).filter((e) => {
      const ts = getTimestampMs(e.timestamp);
      return ts >= startMs && ts < endMs;
    });
  }, [log, startMs, endMs]);

  const todaysFoodCalories = useMemo(() => {
    return todaysFood.reduce((total, entry) => {
      console.log("Calculating calories for entry:", entry);
      const kcalPerServing = getKcalFromFood(entry.food);
      const quantity = typeof entry.quantity === "number" ? entry.quantity : 1;

      return total + kcalPerServing * quantity;
    }, 0);
  }, [todaysFood]);

  const todaysCalories = Math.round(todaysFoodCalories);

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

  const caloriePercent = useMemo(() => {
    if (!calorieRDI || calorieRDI <= 0) return 0;
    return Math.min(100, Math.round((todaysCalories / calorieRDI) * 100));
  }, [todaysCalories, calorieRDI]);

  const goToAddFood = () => {
    router.push("/AddFoodPage");
  };

  const stepsChartData = health?.steps?.last7Days?.length
    ? health.steps.last7Days.map((item) => ({
        label: new Date(item.date).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        value: item.count,
      }))
    : [
        { label: "Mon", value: 8234 },
        { label: "Tue", value: 6102 },
        { label: "Wed", value: 9876 },
        { label: "Thu", value: 7543 },
        { label: "Fri", value: 5231 },
        { label: "Sat", value: 10245 },
        { label: "Sun", value: 4995 },
      ];

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
            <View style={styles.heroImages}>
              <Image
                source={require("../../assets/images/header_asset_left.png")}
                style={styles.foodImageLeft}
                resizeMode="contain"
              />

              <Image
                source={require("../../assets/images/header_asset_right.png")}
                style={styles.foodImageRight}
                resizeMode="contain"
              />
            </View>

            <Text
              style={[
                styles.greeting,
                {
                  fontSize: rf(34, 24, 38),
                  marginTop: rs(15, 12, 24),
                },
              ]}
            >
              <Text style={styles.redText}>Good </Text>
              <Text style={styles.blueText}>Morning!</Text> 👋
            </Text>

            <Text
              style={[
                styles.greetingSub,
                {
                  fontSize: rf(16, 12, 18),
                },
              ]}
            >
              Let's make today a healthy one.
            </Text>
          </View>

          {/* TODO Date row */}
          {/* <View style={styles.dateRow}>
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
          </View> */}

          <Pressable
            onPress={goToAddFood}
            style={[
              styles.calorieCard,
              {
                padding: rs(16, 12, 18),
                gap: isSmallPhone ? 8 : 12,
              },
            ]}
          >
            <View style={styles.calorieLeft}>
              <Text style={[styles.cardTitle, { fontSize: rf(15, 12, 16) }]}>
                Calories Left
              </Text>
              <Text style={[styles.caloriesLeft, { fontSize: rf(40, 28, 58) }]}>
                {caloriesLeft}
              </Text>
              <Text style={styles.smallMuted}>food left</Text>

              <View style={styles.goalPill}>
                <Ionicons name="flame" size={14} color={COLORS.taguigBlue} />
                <Text style={[styles.goalText, { fontSize: rf(12, 10, 13) }]}>
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
                value={burnedCaloriesDisplay}
              />
              <MetricLine
                icon="flame"
                color={COLORS.taguigYellow}
                label="Remaining"
                value={`${caloriesLeft} kcal`}
              />
            </View>

            <View style={styles.calorieRingWrap}>
              <ProgressRing
                percent={caloriePercent}
                color={COLORS.dashboardRing}
                image={require("../../assets/images/apple.png")}
                imageScale={0.7}
                size={rs(112, 92, 120)}
                strokeWidth={9}
                label=""
                showPercent={false}
              />
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
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View
                  style={[
                    styles.chartIcon,
                    { backgroundColor: COLORS.taguigBlue },
                  ]}
                >
                  <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.chartTitle}>Steps</Text>
                <Text style={styles.chartPeriod}>7 Days</Text>
              </View>

              <StepsChart
                data={stepsChartData}
                width={chartWidth}
                height={isSmallPhone ? 155 : 180}
                maxValue={20000}
                color={COLORS.taguigRed}
                goal={10000}
              />
            </View>
          </Pressable>
          <Pressable onPress={() => router.push("/SleepPage")}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View
                  style={[
                    styles.chartIcon,
                    { backgroundColor: COLORS.taguigBlue },
                  ]}
                >
                  <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.chartTitle}>Sleep Quality</Text>
                <Text style={styles.chartPeriod}>7 Days</Text>
              </View>

              <SleepQualityChart data={sampleSleepQuality} width={chartWidth} />
            </View>
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
    minHeight: 150,
    marginHorizontal: -16,
    overflow: "hidden",
    justifyContent: "center",
  },

  heroImages: {
    ...StyleSheet.absoluteFillObject,
  },

  foodImageLeft: {
    position: "absolute",
    left: -25,
    top: 55,
    width: 150,
    height: 150,
  },
  foodImageRight: {
    position: "absolute",
    right: -35,
    top: 45,
    width: 165,
    height: 165,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },

  greeting: {
    marginTop: 52,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    zIndex: 2,
  },
  greetingSub: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textAlign: "center",
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  smallCardsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
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
  dateNum: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary },
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
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  calorieLeft: { flex: 0.9 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
  caloriesLeft: { fontSize: 46, fontWeight: "900", color: COLORS.taguigRed },
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
    flex: 1.05,
    justifyContent: "center",
    gap: 10,
  },

  calorieRingWrap: {
    flex: 0.9,
    alignItems: "center",
    justifyContent: "center",
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

  chartCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  chartIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  chartTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  chartSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  chartPeriod: {
    marginLeft: "auto",
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEF1F7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  chartPeriodText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  chartBody: {
    marginTop: 4,
    marginLeft: -10,
    overflow: "hidden",
  },
});

export default DashboardPage;
