// app/StepsTrackerPage.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
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

import { useHealth } from "@/hooks/useHealth";
import {
  getHealthConnected,
  setHealthConnected,
} from "@/services/health/healthCache";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";
import { ensureStepsAccess } from "@/services/health/stepsService";

import ProgressRing from "@/components/ProgressRing";
import StepsChart from "@/components/StepsChart";

import { COLORS } from "@/theme/color";

const MetricItem = ({
  icon,
  color,
  label,
  value,
  unit,
  stacked = false,
}: any) => (
  <View style={[styles.metricItem, stacked && styles.metricItemStacked]}>
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

  const { width, height } = useWindowDimensions();

  // screen size helpers
  const isSmallPhone = width < 380;
  const isVerySmallPhone = width < 340;
  const isTablet = width >= 768;
  const horizontalPadding = isSmallPhone ? 16 : 24;
  const contentMaxWidth = isTablet ? 620 : 520;
  const availableContentWidth = Math.min(
    width - horizontalPadding * 2,
    contentMaxWidth,
  );
  const scale = Math.min(width / 390, height / 844);

  const USE_MOCK_DATA = __DEV__;
  const mockSteps = [
    { label: "Thu", value: 3200 },
    { label: "Fri", value: 7100 },
    { label: "Sat", value: 10500 },
    { label: "Sun", value: 4500 },
    { label: "Mon", value: 8900 },
    { label: "Tue", value: 12000 },
    { label: "Wed", value: 6800 },
  ];

  const rf = (size: number, min = size * 0.82, max = size * 1.15) =>
    Math.min(Math.max(size * scale, min), max);

  const rs = (size: number, min = size * 0.85, max = size * 1.2) =>
    Math.min(Math.max(size * scale, min), max);

  const chartWidth = Math.max(
    260,
    Math.min(availableContentWidth - rs(32, 24, 40), 560),
  );

  const stepsChartData = data?.steps?.last7Days?.length
    ? data.steps.last7Days.map((item) => ({
        label: new Date(item.date).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        value: item.count,
      }))
    : [
        { label: "Mon", value: 0 },
        { label: "Tue", value: 0 },
        { label: "Wed", value: 0 },
        { label: "Thu", value: 0 },
        { label: "Fri", value: 0 },
        { label: "Sat", value: 0 },
        { label: "Sun", value: 0 },
      ];
  const stepsGoal = 10000;
  const todaySteps = data?.steps?.todaySteps ?? 0;
  const percent = Math.min(100, Math.round((todaySteps / stepsGoal) * 100));

  const distanceKm = (todaySteps * 0.0007).toFixed(2);
  const caloriesBurned = Math.round(todaySteps * 0.049);
  const activeMinutes = Math.round(todaySteps / 104);

  const weeklySteps = USE_MOCK_DATA ? mockSteps : stepsChartData;

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
        // console.log("Checking Android Health Connect availability...");
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

  // console.log("StepsTrackerPage: data loaded", { data, state, error });
  return (
    <ImageBackground
      source={require("../assets/images/foodlogbg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable style={styles.circleBtn} onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={COLORS.textPrimary}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: 120,
            },
          ]}
        >
          <View style={[styles.contentInner, { maxWidth: contentMaxWidth }]}>
            {state === "checking_availability" ||
            state === "requesting_permission" ||
            state === "loading_data" ? (
              <View style={styles.centerCard}>
                <Text style={styles.title}>
                  {state === "checking_availability" &&
                    "Checking Health Connect"}

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
                  Install Health Connect on Android so the app can read your
                  step data.
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
                  Make sure another app is WRITING STEP data to Health Connect:
                  {"\n\n"}• Google Health (Fitbit trackers, Pixel Watch)
                  {"\n"}• Samsung Health ( Galaxy Watch)
                  {"\n"}• Garmin Connect (Garmin watches)
                </Text>

                <Pressable style={styles.primaryBtn} onPress={load}>
                  <Text style={styles.primaryBtnText}>Refresh</Text>
                </Pressable>
              </View>
            ) : null}

            {state === "ready" || USE_MOCK_DATA ? (
              <>
                <View
                  style={[
                    styles.hero,
                    {
                      minHeight: isSmallPhone
                        ? rs(180, 150, 200)
                        : rs(210, 180, 230),
                    },
                  ]}
                >
                  <View style={styles.heroText}>
                    <Text
                      style={[
                        styles.heroTitle,
                        {
                          fontSize: rf(42, 30, 46),
                          lineHeight: rf(46, 34, 50),
                        },
                      ]}
                    >
                      <Text style={styles.blue}>Steps{"\n"}</Text>
                      <Text style={styles.red}>Counter</Text>
                    </Text>

                    <Text style={styles.heroSubText}>Every step counts!</Text>
                    <View style={styles.yellowLine} />
                  </View>

                  <Image
                    source={require("../assets/images/steps/shoes.png")}
                    style={[
                      styles.shoesImage,
                      {
                        width: isSmallPhone
                          ? availableContentWidth * 0.48
                          : availableContentWidth * 0.58,
                        height: isSmallPhone
                          ? availableContentWidth * 0.32
                          : availableContentWidth * 0.38,
                        right: isSmallPhone ? -16 : -26,
                        top: isSmallPhone ? 50 : 34,
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>

                <View
                  style={[
                    styles.progressCard,
                    {
                      padding: rs(18, 12, 20),
                      flexDirection: isVerySmallPhone ? "column" : "row",
                      alignItems: isVerySmallPhone ? "stretch" : "center",
                    },
                  ]}
                >
                  <View style={styles.progressLeft}>
                    <Text
                      style={[styles.cardTitle, { fontSize: rf(18, 14, 20) }]}
                    >
                      Today's Steps
                    </Text>

                    <Text
                      style={[styles.stepsValue, { fontSize: rf(48, 34, 52) }]}
                    >
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

                  {!isVerySmallPhone ? <View style={styles.divider} /> : null}

                  <View
                    style={
                      isVerySmallPhone ? styles.ringWrapperSmall : undefined
                    }
                  >
                    <ProgressRing
                      percent={percent}
                      color={COLORS.taguigRed}
                      image={require("../assets/images/steps/walk.png")}
                      imageScale={0.5}
                      size={rs(128, 92, 138)}
                      strokeWidth={isSmallPhone ? 8 : 10}
                      label=""
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.metricsCard,
                    {
                      paddingVertical: rs(16, 10, 18),
                      flexDirection: isVerySmallPhone ? "column" : "row",
                    },
                  ]}
                >
                  <MetricItem
                    icon="footsteps"
                    color={COLORS.taguigBlue}
                    label="Distance"
                    value={distanceKm}
                    unit="km"
                    stacked={isVerySmallPhone}
                  />

                  <MetricItem
                    icon="flame"
                    color={COLORS.taguigYellow}
                    label="Calories Burned"
                    value={caloriesBurned}
                    unit="kcal"
                    stacked={isVerySmallPhone}
                  />

                  <MetricItem
                    icon="stopwatch"
                    color={COLORS.taguigRed}
                    label="Active Time"
                    value={activeMinutes}
                    unit="min"
                    stacked={isVerySmallPhone}
                  />
                </View>

                <View style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.sectionTitle}>Steps Activity</Text>
                    {/* <Text style={styles.viewWeek}>View Week ›</Text> */}
                  </View>

                  <StepsChart
                    data={weeklySteps}
                    width={chartWidth}
                    height={isSmallPhone ? 155 : 180}
                    maxValue={20000}
                    color={COLORS.taguigRed}
                    fillColor={COLORS.taguigRed}
                    goal={10000}
                  />
                </View>

                <View style={{ height: 8 }} />
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
  },
  contentInner: {
    width: "100%",
    alignSelf: "center",
  },
  topBar: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    marginLeft: 16,
    marginTop: 12,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  centerCard: {
    marginTop: 16,
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
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  heroText: {
    zIndex: 3,
  },

  heroTitle: {
    fontWeight: "900",
  },

  blue: {
    color: COLORS.taguigBlue,
  },

  red: {
    color: COLORS.taguigRed,
  },

  heroSubText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  yellowLine: {
    marginTop: 12,
    width: 54,
    height: 5,
    borderRadius: 99,
    backgroundColor: COLORS.taguigYellow,
  },

  heroImage: {
    position: "absolute",
    right: 12,
    top: 40,
  },

  shoesImage: {
    position: "absolute",
    zIndex: 2,
  },

  progressCard: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 18,
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
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  stepsValue: {
    marginTop: 12,
    fontWeight: "900",
    color: COLORS.taguigRed,
  },

  goalText: {
    fontSize: 15,
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

  ringWrapperSmall: {
    marginTop: 18,
    alignSelf: "center",
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

  metricItemStacked: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F7",
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
    overflow: "hidden",
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
