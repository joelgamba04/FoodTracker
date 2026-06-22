// app/SleepPage.tsx

import { Ionicons } from "@expo/vector-icons";
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
import ProgressRing from "@/components/ProgressRing";
import { useHealth } from "@/hooks/useHealth";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";

import {
  getHealthConnected,
  setHealthConnected,
} from "@/services/health/healthCache";
import { ensureSleepAccess } from "@/services/health/sleepService";
import { COLORS } from "@/theme/color";
import { useRouter } from "expo-router";

type PageState =
  | "connect_prompt"
  | "checking_availability"
  | "missing_provider"
  | "requesting_permission"
  | "loading_data"
  | "no_data"
  | "ready"
  | "error";

const SleepMetric = ({ icon, color, title, value, status }: any) => (
  <View style={styles.sleepMetric}>
    <View style={[styles.metricIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
    </View>

    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={[styles.metricStatus, { color }]}>{status}</Text>
  </View>
);

const SleepPage = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [state, setState] = useState<PageState>("connect_prompt");
  const [error, setError] = useState<string | null>(null);
  const { refreshHealth, data, loading, error: healthError } = useHealth();

  const sleepGoal = 8;
  const lastNightHours = data?.sleep?.lastNightHours ?? 0;
  const sleepPercent = Math.min(
    100,
    Math.round((lastNightHours / sleepGoal) * 100),
  );
  const sleepScore = Math.min(
    100,
    Math.round((lastNightHours / sleepGoal) * 100),
  );

  const sleepText = `${Math.floor(lastNightHours)}h ${Math.round(
    (lastNightHours % 1) * 60,
  )}m`;

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

        console.log("Health Connect availability:", availability);

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

      const access = await ensureSleepAccess();

      if (!access.ok) {
        setState("error");
        setError(access.reason ?? "Unable to access sleep data");
        return;
      }

      setState("loading_data");
      await setHealthConnected(); // Mark as connected to avoid showing connect prompt again
      await refreshHealth();
      setState("ready");
    } catch (err: any) {
      setState("error");
      setError(err?.message ?? "Failed to load sleep data");
    }
  }, [refreshHealth]);

  useEffect(() => {
    if (loading) return;

    if (healthError) {
      setState("error");
      setError(healthError);
      return;
    }

    if (!data) return;

    const sleep = data.sleep;

    if (!sleep) {
      setState("no_data");
      return;
    }

    const hasData =
      sleep.lastNightHours > 0 || sleep.last7Days.some((d) => d.hours > 0);

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

  console.log("SleepPage: data loaded", { data, state, error });
  return (
    <SafeAreaView style={styles.screen}>
      {/* header */}
      <AppHeader title="Sleep" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {state === "checking_availability" ? (
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

        {state === "requesting_permission" || state === "loading_data" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>
              {state === "requesting_permission"
                ? "Requesting Permission"
                : "Loading Sleep Data"}
            </Text>

            <Text style={styles.infoText}>
              {state === "requesting_permission"
                ? "Please allow access to your health data."
                : "Checking your available sleep records..."}
            </Text>
          </View>
        ) : null}

        {state === "missing_provider" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Health Connect required</Text>
            <Text style={styles.infoText}>
              Install Health Connect on Android so the app can read your sleep
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
              Connect Health Connect to display your sleep data from supported
              health apps and devices.
            </Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "error" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Could not load sleep data</Text>
            <Text style={styles.errorText}>
              {error ?? "Something went wrong while loading sleep data."}
            </Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "no_data" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>No sleep data found</Text>
            <Text style={styles.infoText}>
              We couldn't find any sleep data for the past 7 days. Make sure
              your device is tracking sleep and that you've granted permission
              to smart watch or health app to write sleep data to Health
              Connect. Sleep data should start appearing here within 24 hours
              after you get it set up.
            </Text>

            <Text style={styles.infoText}>
              Make sure another app is writing data to Health Connect:
              {"\n\n"}• Google Fit
              {"\n"}• Samsung Health
              {"\n"}• Fitbit
              {"\n"}• Smartwatch apps
            </Text>
          </View>
        ) : null}

        {state === "ready" ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>
                  <Text style={styles.blue}>Sleep{"\n"}</Text>
                  <Text style={styles.red}>Dashboard</Text>
                </Text>

                <Text style={styles.heroSubText}>Good sleep, better you.</Text>
                <View style={styles.yellowLine} />
              </View>

              <Image
                source={require("../assets/images/sleep/sleep.png")}
                style={[
                  styles.heroImage,
                  {
                    width: width * 0.55,
                    height: width * 0.38,
                  },
                ]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.sleepSummaryCard}>
              <View style={styles.scoreCol}>
                <Text style={styles.cardTitle}>Sleep Score</Text>
                <Text style={styles.scoreValue}>{sleepScore}</Text>
                <Text style={styles.scoreStatus}>Good</Text>
                <Text style={styles.scoreNote}>
                  You slept better than 78% of users
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.durationCol}>
                <Text style={styles.cardTitle}>Sleep Duration</Text>
                <Text style={styles.durationValue}>{sleepText}</Text>
                <Text style={styles.goalText}>of 8h goal</Text>
              </View>

              <ProgressRing
                percent={sleepPercent}
                color={COLORS.taguigBlue}
                image={require("../assets/images/sleep/moon.png")}
                imageScale={0.28}
                size={116}
                strokeWidth={9}
                label="of goal"
              />
            </View>

            <View style={styles.tipPill}>
              <View style={styles.tipIcon}>
                <Ionicons name="calendar" size={22} color="#FFFFFF" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>
                  Maintain a consistent sleep schedule
                </Text>
                <Text style={styles.tipText}>
                  Try to sleep and wake up at the same time every day.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color={COLORS.taguigBlue}
              />
            </View>

            <View style={styles.metricsCard}>
              <SleepMetric
                icon="moon"
                color={COLORS.taguigBlue}
                title="Time in Bed"
                value="7h 45m"
                status="Good"
              />
              <SleepMetric
                icon="bed"
                color={COLORS.taguigRed}
                title="Deep Sleep"
                value="2h 15m"
                status="Good"
              />
              <SleepMetric
                icon="cloudy-night"
                color={COLORS.taguigYellow}
                title="Light Sleep"
                value="3h 45m"
                status="Average"
              />
              <SleepMetric
                icon="sunny"
                color={COLORS.taguigBlue}
                title="Awake"
                value="45m"
                status="Good"
              />
            </View>

            {/* <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Sleep Stages</Text>
                <Text style={styles.learnMore}>ⓘ Learn more</Text>
              </View>

              <View style={styles.sleepStagePlaceholder}>
                <Text style={styles.placeholderText}>
                  Sleep stages chart placeholder
                </Text>
              </View>
            </View> */}

            {/* <View style={styles.bottomGrid}>
              <View style={styles.smallCard}>
                <Text style={styles.smallTitle}>Sleep Trend</Text>
                <Text style={styles.smallSub}>7 Days Average</Text>
                <Text style={styles.smallValue}>6h 24m</Text>
                <Text style={styles.greenText}>▲ 12% from last week</Text>
              </View>

              <View style={styles.smallCard}>
                <Text style={styles.smallTitle}>Best Sleep</Text>
                <Text style={styles.smallSub}>Wednesday</Text>
                <Text style={styles.smallValue}>7h 12m</Text>
                <Text style={styles.smallSub}>May 6, 2025</Text>
              </View>

              <View style={styles.smallCard}>
                <Text style={styles.smallTitle}>Sleep Goal</Text>
                <Text style={styles.smallSub}>8h per night</Text>

                <ProgressRing
                  percent={sleepPercent}
                  color={COLORS.taguigBlue}
                  image={require("../assets/images/sleep/moon.png")}
                  imageScale={0.25}
                  size={82}
                  strokeWidth={7}
                  label="Keep it up!"
                />
              </View>
            </View> */}

            {/* <Image
              source={require("../assets/images/sleep/sleep-banner.png")}
              style={[
                styles.banner,
                {
                  width: width * 0.92,
                  height: width * 0.22,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
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
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 46,
  },

  blue: {
    color: COLORS.taguigBlue,
  },

  red: {
    color: COLORS.taguigRed,
  },

  heroSubText: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  yellowLine: {
    marginTop: 14,
    width: 58,
    height: 5,
    borderRadius: 99,
    backgroundColor: COLORS.taguigYellow,
  },

  heroImage: {
    position: "absolute",
    right: -28,
    top: 36,
    zIndex: 2,
  },

  sleepSummaryCard: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  scoreCol: {
    flex: 1,
  },

  durationCol: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  scoreValue: {
    marginTop: 10,
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  scoreStatus: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  scoreNote: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  durationValue: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  goalText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  divider: {
    width: 1,
    height: 110,
    backgroundColor: "#EEF1F7",
    marginHorizontal: 16,
  },

  tipPill: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.taguigBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  tipTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  tipText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
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

  sleepMetric: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#EEF1F7",
  },

  metricIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  metricTitle: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },

  metricValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  metricStatus: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "800",
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

  learnMore: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  sleepStagePlaceholder: {
    height: 150,
    borderRadius: 16,
    backgroundColor: "#F3F6FB",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  bottomGrid: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },

  smallCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  smallTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  smallSub: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  smallValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  greenText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
    textAlign: "center",
  },

  banner: {
    marginTop: 20,
    alignSelf: "center",
  },
});
export default SleepPage;
