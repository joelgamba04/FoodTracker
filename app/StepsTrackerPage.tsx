// app/StepsTrackerPage.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";

import { useHealth } from "@/hooks/useHealth";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";
import { ensureStepsAccess } from "@/services/health/stepsService";

import ProgressRing from "@/components/ProgressRing";
import {
  getHealthConnected,
  setHealthConnected,
} from "@/services/health/healthCache";
import { COLORS } from "@/theme/color";

const MetricItem = ({ icon, color, label, value, unit }: any) => (
  <View style={styles.metricItem}>
    <View style={[styles.metricIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
    </View>

    <Text style={styles.metricLabel}>{label}</Text>

    <Text style={styles.metricValue}>
      {value} <Text style={styles.metricUnit}>{unit}</Text>
    </Text>
  </View>
);

const Achievement = ({ title, subtitle, color }: any) => (
  <View style={styles.achievementItem}>
    <View style={[styles.badgeIcon, { backgroundColor: color }]}>
      <Ionicons name="star" size={26} color="#FFFFFF" />
    </View>

    <Text style={styles.achievementTitle}>{title}</Text>
    <Text style={styles.achievementSubtitle}>{subtitle}</Text>
  </View>
);

type PageState =
  | "connect_prompt"
  | "checking_availability"
  | "missing_provider"
  | "requesting_permission"
  | "loading_data"
  | "no_data"
  | "ready"
  | "error";

const StepsTrackerPage = () => {
  const router = useRouter();
  const [state, setState] = useState<PageState>("checking_availability");
  const [error, setError] = useState<string | null>(null);
  const { refreshHealth, data, loading, error: healthError } = useHealth();

  const { width } = useWindowDimensions();

  const stepsGoal = 10000;
  const todaySteps = data?.steps?.todaySteps ?? 0;
  const percent = Math.min(100, Math.round((todaySteps / stepsGoal) * 100));

  const distanceKm = (todaySteps * 0.0007).toFixed(2);
  const caloriesBurned = Math.round(todaySteps * 0.049);
  const activeMinutes = Math.round(todaySteps / 104);

  const chartWidth = Math.min(width - 64, 680);

  const waitForInteractions = () =>
    new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve();
      });
    });

  const load = useCallback(async () => {
    try {
      setError(null);

      if (Platform.OS === "android") {
        console.log("Checking Android Health Connect availability...");
        setState("checking_availability");

        const availability = await checkAndroidHealthConnectAvailability();

        if (availability.needsInstall) {
          setState("missing_provider");
          return;
        }

        if (!availability.available) {
          setState("missing_provider");
          return;
        }
      }

      setState("requesting_permission");

      await waitForInteractions(); // Wait for interactions to finish before requesting permissions

      const access = await ensureStepsAccess();

      if (!access.ok) {
        setState("error");
        setError(access.reason ?? "Unable to access steps");
        return;
      }

      setState("loading_data");
      await setHealthConnected(); // Mark as connected to avoid showing connect prompt again
      await refreshHealth();
      setState("ready");
    } catch (err: any) {
      setState("error");
      setError(err?.message ?? "Failed to load steps");
    }
  }, [refreshHealth]);

  useEffect(() => {
    if (loading) return;

    if (healthError) {
      setState("error");
      setError(healthError);
      return;
    }

    if (!data) {
      return;
    }
    const steps = data?.steps;

    if (!steps) {
      setState("no_data");
      return;
    }

    const hasData =
      steps.todaySteps > 0 || steps.last7Days.some((d) => d.count > 0);

    setState(hasData ? "ready" : "no_data");
  }, [loading, healthError, data]);

  useEffect(() => {
    // On initial load, check if we've already connected to Health Connect before and skip straight to loading data if so
    let active = true;

    const bootstrap = async () => {
      const connected = await getHealthConnected();

      if (!active) return;

      if (connected) {
        void load();
      } else {
        setState("connect_prompt");
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [load]);

  console.log("StepsTrackerPage: data loaded", { data, state, error });
  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Steps" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {state === "checking_availability" ||
        state === "requesting_permission" ||
        state === "loading_data" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>
              {state === "checking_availability" && "Checking Health Connect"}

              {state === "requesting_permission" && "Requesting Permission"}

              {state === "loading_data" && "Loading Step Data"}
            </Text>

            <Text style={styles.infoText}>
              {state === "checking_availability" &&
                "Checking if Health Connect is available..."}

              {state === "requesting_permission" &&
                "Please allow access to your health data."}

              {state === "loading_data" &&
                "Checking your available step records..."}
            </Text>
          </View>
        ) : null}

        {state === "missing_provider" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Health Connect required</Text>
            <Text style={styles.infoText}>
              Install Health Connect on Android so the app can read your step
              data.
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={openHealthConnectStorePage}
            >
              <Text style={styles.primaryBtnText}>Open Play Store</Text>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={load}>
              <Text style={styles.secondaryBtnText}>
                I already installed it
              </Text>
            </Pressable>
          </View>
        ) : null}

        {state === "connect_prompt" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Connect Health Data</Text>

            <Text style={styles.infoText}>
              Connect Health Connect to read your steps and sleep data.
            </Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "error" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Could not load steps</Text>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "no_data" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>No step data yet</Text>

            <Text style={styles.infoText}>
              Your app is connected, but no steps are available.
            </Text>

            <Text style={styles.infoText}>
              Make sure another app is writing data to Health Connect:
              {"\n\n"}• Google Fit
              {"\n"}• Samsung Health
              {"\n"}• Fitbit
              {"\n"}• Smartwatch apps
            </Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "ready" ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>
                  <Text style={styles.blue}>Steps{"\n"}</Text>
                  <Text style={styles.red}>Counter</Text>
                </Text>

                <Text style={styles.heroSubText}>Every step counts!</Text>

                <View style={styles.yellowLine} />
              </View>

              <Image
                source={require("../assets/images/steps/shoes.png")}
                style={[
                  styles.heroImage,
                  {
                    width: width * 0.48,
                    height: width * 0.32,
                  },
                ]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressLeft}>
                <Text style={styles.cardTitle}>Today's Steps</Text>

                <Text style={styles.stepsValue}>
                  {todaySteps.toLocaleString()}
                </Text>

                <Text style={styles.goalText}>
                  of {stepsGoal.toLocaleString()} steps goal
                </Text>

                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>
                    🏆 You're {percent}% of the way there!
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <ProgressRing
                percent={percent}
                color={COLORS.taguigRed}
                image={require("../assets/images/steps/walk.png")}
                size={170}
                label="Completed"
              />
            </View>

            <View style={styles.metricsCard}>
              <MetricItem
                icon="footsteps"
                color={COLORS.taguigBlue}
                label="Distance"
                value={distanceKm}
                unit="km"
              />

              <MetricItem
                icon="flame"
                color={COLORS.taguigYellow}
                label="Calories Burned"
                value={caloriesBurned}
                unit="kcal"
              />

              <MetricItem
                icon="stopwatch"
                color={COLORS.taguigRed}
                label="Active Time"
                value={activeMinutes}
                unit="min"
              />
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Steps Activity</Text>
                <Text style={styles.viewWeek}>View Week ›</Text>
              </View>

              {/* <StepsChart
                data={stepsChartData}
                width={chartWidth}
                height={190}
                maxValue={12000}
                barColor={COLORS.taguigRed}
                goal={10000}
              /> */}
            </View>

            <View style={styles.achievementCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <Text style={styles.viewWeek}>View All</Text>
              </View>

              <View style={styles.achievementRow}>
                <Achievement
                  title="10K Steps"
                  subtitle="Step 10,000 steps in a day"
                  color={COLORS.taguigBlue}
                />
                <Achievement
                  title="7 Day Streak"
                  subtitle="Reach your goal 7 days in a row"
                  color="#22C55E"
                />
                <Achievement
                  title="First Steps"
                  subtitle="Complete your first step goal"
                  color={COLORS.taguigYellow}
                />
              </View>
            </View>

            {/* <Image
              source={require("../assets/images/steps/steps-banner.png")}
              style={[
                styles.banner,
                {
                  width: width * 0.92,
                  height: width * 0.2,
                },
              ]}
              resizeMode="contain"
            /> */}

            <View style={{ height: 110 }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  centerCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.textPrimary,
    opacity: 0.75,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.dangerRed,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  heroCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  heroLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  heroSub: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },

  row: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  countText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  hero: {
    minHeight: 230,
    justifyContent: "center",
    position: "relative",
  },

  heroText: {
    zIndex: 3,
  },

  heroTitle: {
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 48,
  },

  blue: {
    color: COLORS.taguigBlue,
  },

  red: {
    color: COLORS.taguigRed,
  },

  heroSubText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  yellowLine: {
    marginTop: 14,
    width: 60,
    height: 5,
    borderRadius: 99,
    backgroundColor: COLORS.taguigYellow,
  },

  heroImage: {
    position: "absolute",
    right: 12,
    top: 40,
  },

  progressCard: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  progressLeft: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  stepsValue: {
    marginTop: 16,
    fontSize: 54,
    fontWeight: "900",
    color: COLORS.taguigRed,
  },

  goalText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  statusPill: {
    marginTop: 18,
    alignSelf: "flex-start",
    backgroundColor: "#EAFBEF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#16A34A",
  },

  divider: {
    width: 1,
    height: 120,
    backgroundColor: "#EEF1F7",
    marginHorizontal: 18,
  },

  metricsCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  metricItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#EEF1F7",
  },

  metricIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  metricLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },

  metricValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  metricUnit: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  chartCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  viewWeek: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  achievementCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  achievementRow: {
    flexDirection: "row",
    gap: 10,
  },

  achievementItem: {
    flex: 1,
  },

  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  achievementTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  achievementSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  banner: {
    marginTop: 20,
    alignSelf: "center",
  },
});
export default StepsTrackerPage;
