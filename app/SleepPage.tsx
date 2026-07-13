// app/SleepPage.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import ProgressRing from "@/components/ProgressRing";
import SleepChart from "@/components/SleepChart";
import { useHealth } from "@/hooks/useHealth";
import { SleepDay } from "@/models/sleepModel";
import {
  getHealthConnected,
  setHealthConnected,
} from "@/services/health/healthCache";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";
import { ensureSleepAccess } from "@/services/health/sleepService";
import { COLORS } from "@/theme/color";

type PageState =
  | "connect_prompt"
  | "checking_availability"
  | "missing_provider"
  | "requesting_permission"
  | "loading_data"
  | "no_data"
  | "ready"
  | "error";

type SleepMetricProps = {
  image: any;
  title: string;
  value: string;
  status: string;
  compact?: boolean;
};

const USE_SAMPLE_SLEEP_DATA = __DEV__;

const SAMPLE_SLEEP = {
  lastNightHours: 7.75,
  last7Days: [
    { date: "Mon", hours: 8 },
    { date: "Tue", hours: 6 },
    { date: "Wed", hours: 9 },
    { date: "Thu", hours: 7 },
    { date: "Fri", hours: 5 },
    { date: "Sat", hours: 10 },
    { date: "Sun", hours: 4.995 },
  ],
};

const formatSleepTime = (hoursValue: number) => {
  const safeHours = Number.isFinite(hoursValue) ? Math.max(hoursValue, 0) : 0;
  const hours = Math.floor(safeHours);
  const minutes = Math.round((safeHours % 1) * 60);

  if (minutes === 60) {
    return `${hours + 1}h 0m`;
  }

  return `${hours}h ${minutes}m`;
};

const getSleepStatus = (hoursValue: number) => {
  if (hoursValue >= 7 && hoursValue <= 9) return "Good";
  if (hoursValue >= 6) return "Average";
  return "Needs rest";
};

const SleepMetric = ({
  image,
  title,
  value,
  status,
  compact = false,
}: SleepMetricProps) => (
  <View style={[styles.sleepMetric, compact && styles.sleepMetricCompact]}>
    <Image
      source={image}
      style={[styles.metricImage, compact && styles.metricImageCompact]}
      resizeMode="contain"
    />

    <Text style={[styles.metricTitle, compact && styles.metricTitleCompact]}>
      {title}
    </Text>
    <Text style={[styles.metricValue, compact && styles.metricValueCompact]}>
      {value}
    </Text>
    <Text style={styles.metricStatus}>{status}</Text>
  </View>
);

const SleepPage = () => {
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  const isTinyPhone = width < 360;
  const isSmallPhone = width < 390;
  const isTablet = width >= 768;
  const scale = Math.min(width / 390, height / 844);

  const rf = (size: number, min = size * 0.82, max = size * 1.15) =>
    Math.min(Math.max(size * scale, min), max);

  const rs = (size: number, min = size * 0.85, max = size * 1.2) =>
    Math.min(Math.max(size * scale, min), max);

  const contentMaxWidth = isTablet ? 560 : 430;
  const ringSize = isTinyPhone ? 88 : isSmallPhone ? 96 : 112;
  const shouldStackSummary = width < 370;
  const metricCompact = width < 390;

  const [state, setState] = useState<PageState>("connect_prompt");
  const [error, setError] = useState<string | null>(null);
  const { refreshHealth, data, loading, error: healthError } = useHealth();

  const sleepGoal = 8;

  const sleepData = useMemo(() => {
    if (USE_SAMPLE_SLEEP_DATA) {
      return SAMPLE_SLEEP;
    }

    return data?.sleep ?? null;
  }, [data?.sleep]);

  const lastNightHours = sleepData?.lastNightHours ?? 0;
  const last7Days: SleepDay[] = sleepData?.last7Days ?? [];

  const sleepPercent = Math.min(
    100,
    Math.max(0, Math.round((lastNightHours / sleepGoal) * 100)),
  );

  const sleepScore = sleepPercent;
  const sleepText = formatSleepTime(lastNightHours);
  const sleepStatus = getSleepStatus(lastNightHours);

  const averageSleep = last7Days.length
    ? last7Days.reduce((sum, item) => sum + (item.hours || 0), 0) /
      last7Days.length
    : 0;

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
        setState("checking_availability");

        const availability = await checkAndroidHealthConnectAvailability();

        if (availability.needsInstall || !availability.available) {
          setState("missing_provider");
          return;
        }
      }

      setState("requesting_permission");

      await waitForInteractions();

      const access = await ensureSleepAccess();

      if (!access.ok) {
        setState("error");
        setError(access.reason ?? "Unable to access sleep data");
        return;
      }

      setState("loading_data");
      await setHealthConnected();
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

  return (
    <ImageBackground
      source={require("../assets/images/foodlogbg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.screen}>
        <View style={[styles.topBar, { maxWidth: contentMaxWidth }]}>
          <Pressable
            style={[
              styles.circleBtn,
              {
                width: rs(48, 42, 52),
                height: rs(48, 42, 52),
                borderRadius: rs(24, 21, 26),
              },
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={isSmallPhone ? 24 : 28}
              color={COLORS.textPrimary}
            />
          </Pressable>

          {USE_SAMPLE_SLEEP_DATA ? (
            <View style={styles.devPill}>
              <Text style={styles.devPillText}>Dev sample</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: isSmallPhone ? 16 : 22,
              maxWidth: contentMaxWidth,
            },
          ]}
        >
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
                to a smart watch or health app to write sleep data to Health
                Connect.
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

          {state === "ready" || USE_SAMPLE_SLEEP_DATA ? (
            <>
              <View style={[styles.hero, { minHeight: rs(190, 155, 220) }]}>
                <View style={styles.heroText}>
                  <Text
                    style={[
                      styles.heroTitle,
                      {
                        fontSize: rf(40, 30, 46),
                        lineHeight: rf(44, 34, 50),
                      },
                    ]}
                  >
                    <Text style={styles.blue}>Sleep{"\n"}</Text>
                    <Text style={styles.red}>Dashboard</Text>
                  </Text>

                  <Text
                    style={[styles.heroSubText, { fontSize: rf(16, 12, 18) }]}
                  >
                    Good sleep, better you.
                  </Text>

                  <View style={styles.yellowLine} />
                </View>

                <Image
                  source={require("../assets/images/sleep/sleep.png")}
                  style={[
                    styles.heroImage,
                    {
                      width: isSmallPhone ? width * 0.45 : width * 0.52,
                      height:
                        (isSmallPhone ? width * 0.45 : width * 0.52) * 0.67,
                      right: isSmallPhone ? -18 : -30,
                      top: isSmallPhone ? 50 : 36,
                      opacity: isTinyPhone ? 0.9 : 1,
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>

              <View
                style={[
                  styles.summaryCard,
                  {
                    padding: rs(18, 14, 20),
                    flexDirection: shouldStackSummary ? "column" : "row",
                    alignItems: shouldStackSummary ? "stretch" : "center",
                    gap: shouldStackSummary ? 16 : 0,
                  },
                ]}
              >
                <View style={styles.scoreCol}>
                  <Text
                    style={[styles.cardTitle, { fontSize: rf(16, 13, 18) }]}
                  >
                    Sleep Score
                  </Text>

                  <Text
                    style={[styles.scoreValue, { fontSize: rf(46, 34, 52) }]}
                  >
                    {sleepScore}
                  </Text>

                  <Text
                    style={[styles.scoreStatus, { fontSize: rf(20, 15, 22) }]}
                  >
                    {sleepStatus}
                  </Text>

                  {!isSmallPhone && (
                    <Text style={styles.scoreNote}>
                      Average this week: {formatSleepTime(averageSleep)}
                    </Text>
                  )}
                </View>

                {!shouldStackSummary ? <View style={styles.divider} /> : null}

                <View style={styles.durationCol}>
                  <Text
                    style={[styles.cardTitle, { fontSize: rf(16, 13, 18) }]}
                  >
                    Sleep Duration
                  </Text>

                  <Text
                    style={[styles.durationValue, { fontSize: rf(32, 24, 38) }]}
                  >
                    {sleepText}
                  </Text>

                  <Text style={styles.goalText}>of 8h goal</Text>
                </View>

                <View
                  style={[
                    styles.ringWrap,
                    shouldStackSummary && styles.ringWrapStacked,
                  ]}
                >
                  <ProgressRing
                    percent={sleepPercent}
                    color={COLORS.taguigBlue}
                    size={ringSize}
                    strokeWidth={isSmallPhone ? 8 : 9}
                    label="of 8h goal"
                  />
                </View>
              </View>

              <Pressable
                style={styles.tipPill}
                accessibilityRole="button"
                accessibilityLabel="Sleep tip"
              >
                <Image
                  source={require("../assets/images/sleep/bed.png")}
                  style={styles.tipImage}
                  resizeMode="contain"
                />

                <View style={styles.tipCopy}>
                  <Text style={styles.tipTitle}>
                    Maintain a consistent sleep schedule
                  </Text>
                  <Text style={styles.tipText}>
                    Try to sleep and wake up at the same time every day.
                  </Text>
                </View>

                {/* <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={COLORS.taguigBlue}
                /> */}
              </Pressable>
              {/* 
              <View style={styles.metricsCard}>
                <SleepMetric
                  image={require("../assets/images/sleep/moon.png")}
                  title="Time in Bed"
                  value={sleepText}
                  status={sleepStatus}
                  compact={metricCompact}
                />
                <SleepMetric
                  image={require("../assets/images/sleep/bed.png")}
                  title="Deep Sleep"
                  value="2h 15m"
                  status="Good"
                  compact={metricCompact}
                />
                <SleepMetric
                  image={require("../assets/images/sleep/zzz.png")}
                  title="Light Sleep"
                  value="3h 45m"
                  status="Average"
                  compact={metricCompact}
                />
                <SleepMetric
                  image={require("../assets/images/sleep/sun.png")}
                  title="Awake"
                  value="45m"
                  status="Good"
                  compact={metricCompact}
                />
              </View> */}

              <View style={styles.chartCard}>
                <SleepChart
                  data={last7Days}
                  goal={sleepGoal}
                  compact={isSmallPhone}
                />
              </View>

              <View style={{ height: 110 }} />
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
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
  topBar: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...cardShadow,
  },
  devPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#D8E6FF",
  },
  devPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingTop: 14,
    paddingBottom: 120,
    gap: 14,
  },
  centerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: "center",
    gap: 12,
    ...cardShadow,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: COLORS.textPrimary,
    opacity: 0.75,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: COLORS.dangerRed,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: "800",
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
    zIndex: 2,
  },
  summaryCard: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    ...cardShadow,
  },
  scoreCol: {
    flex: 0.9,
    minWidth: 82,
  },
  durationCol: {
    flex: 1,
    minWidth: 94,
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrapStacked: {
    alignSelf: "center",
  },
  cardTitle: {
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  scoreValue: {
    marginTop: 8,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },
  scoreStatus: {
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },
  scoreNote: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  durationValue: {
    marginTop: 8,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  goalText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    height: 96,
    backgroundColor: "#EEF1F7",
    marginHorizontal: 12,
  },
  tipPill: {
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    padding: 12,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipImage: {
    width: 42,
    height: 42,
  },
  tipCopy: {
    flex: 1,
    minWidth: 0,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  tipText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  metricsCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    ...cardShadow,
  },
  sleepMetric: {
    flexBasis: "22%",
    flexGrow: 1,
    minWidth: 72,
    alignItems: "center",
    padding: 8,
    borderRadius: 18,
    backgroundColor: "#F8FAFF",
  },
  sleepMetricCompact: {
    flexBasis: "45%",
    minWidth: 130,
  },
  metricImage: {
    width: 42,
    height: 42,
  },
  metricImageCompact: {
    width: 36,
    height: 36,
  },
  metricTitle: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  metricTitleCompact: {
    fontSize: 11,
  },
  metricValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  metricValueCompact: {
    fontSize: 15,
  },
  metricStatus: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  chartCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    ...cardShadow,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  learnMore: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },
  weekChart: {
    height: 180,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
  },
  dayColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 0,
  },
  barTrack: {
    flex: 1,
    width: "72%",
    maxWidth: 28,
    minWidth: 14,
    borderRadius: 999,
    backgroundColor: "#E6ECF8",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.taguigBlue,
  },
  barValue: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});

export default SleepPage;
