// app/SleepPage.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";
import { useSleep } from "@/hooks/useSleep";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";
import { ensureSleepAccess } from "@/services/health/sleepService";

import { COLORS } from "@/theme/color";

type PageState =
  | "no_data"
  | "checking_availability"
  | "missing_provider"
  | "requesting_permission"
  | "loading_data"
  | "ready"
  | "error";

const formatPrettyDate = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const SleepPage = () => {
  const [state, setState] = useState<PageState>("checking_availability");
  const [error, setError] = useState<string | null>(null);

  const { loading, data, error: hookError, loadSleep } = useSleep();

  const init = useCallback(async () => {
    try {
      setError(null);

      if (Platform.OS === "android") {
        setState("checking_availability");

        const availability = await checkAndroidHealthConnectAvailability();

        if (!availability.available) {
          setState("missing_provider");
          return;
        }
      }

      setState("requesting_permission");

      const access = await ensureSleepAccess();

      if (!access.ok) {
        setState("error");
        setError(access.reason ?? "Unable to access sleep data");
        return;
      }

      setState("loading_data");

      await loadSleep(); // ✅ ONLY CALL THIS
    } catch (err: any) {
      setState("error");
      setError(err?.message ?? "Failed to initialize sleep");
    }
  }, [loadSleep]);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (loading) return;

    if (hookError) {
      setState("error");
      return;
    }

    if (!data) return;

    const hasData = (data.last7Days ?? []).some((d) => d.hours > 0);

    setState(hasData ? "ready" : "no_data");
  }, [loading, hookError, data]);

  console.log("SleepPage: data loaded", { data, state, error });
  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Sleep" subtitle="Daily sleep history" />

      <ScrollView contentContainerStyle={styles.content}>
        {state === "checking_availability" ||
        state === "requesting_permission" ||
        state === "loading_data" ? (
          <View style={styles.centerCard}>
            <ActivityIndicator />
            <Text style={styles.infoText}>
              {state === "checking_availability" &&
                "Checking Health Connect..."}
              {state === "requesting_permission" && "Requesting permission..."}
              {state === "loading_data" && "Loading sleep data..."}
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

            <Pressable style={styles.secondaryBtn} onPress={init}>
              <Text style={styles.secondaryBtnText}>
                I already installed it
              </Text>
            </Pressable>
          </View>
        ) : null}

        {state === "error" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Could not load sleep data</Text>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.primaryBtn} onPress={init}>
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
          </View>
        ) : null}

        {state === "ready" ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Last Night</Text>
              <Text style={styles.heroValue}>
                {data?.lastNightHours?.toFixed(1) ?? "0"}
              </Text>
              <Text style={styles.heroSub}>hours</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>

              {(data?.last7Days ?? []).map((item) => (
                <View key={item.date} style={styles.row}>
                  <Text style={styles.dayText}>
                    {formatPrettyDate(item.date)}
                  </Text>
                  <Text style={styles.countText}>{item.hours.toFixed(1)}</Text>
                </View>
              ))}
            </View>
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
    padding: 16,
    gap: 16,
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
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 8,
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
});
export default SleepPage;
