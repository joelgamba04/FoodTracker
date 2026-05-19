// app/SleepPage.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";
import { useHealth } from "@/hooks/useHealth";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";
import { formatPrettyDate } from "@/utils/date";

import { ensureSleepAccess } from "@/services/health/sleepService";
import { COLORS } from "@/theme/color";
import { useRouter } from "expo-router";

type PageState =
  | "checking_availability"
  | "missing_provider"
  | "requesting_permission"
  | "no_data"
  | "loading_data"
  | "ready"
  | "provider_update_required"
  | "error";

const SleepPage = () => {
  const router = useRouter();
  const [state, setState] = useState<PageState>("checking_availability");
  const [error, setError] = useState<string | null>(null);
  const { refreshHealth, data, loading, error: healthError } = useHealth();

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

        if (availability.needsUpdate) {
          setState("provider_update_required");
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
      return;
    }

    const sleep = data?.sleep;

    if (!sleep) {
      setState("error");
      return;
    }

    const hasData =
      sleep.lastNightHours > 0 || sleep.last7Days.some((d) => d.hours > 0);

    setState(hasData ? "ready" : "no_data");
  }, [loading, healthError, data]);

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
            <Text style={styles.title}>Connect Health Data</Text>

            <Text style={styles.infoText}>
              Connect Health Connect to read your steps and sleep data.
            </Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
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

        {state === "provider_update_required" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Health Connect update required</Text>
            <Text style={styles.infoText}>
              Update Health Connect on Android so the app can read your step
              data.
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={openHealthConnectStorePage}
            >
              <Text style={styles.primaryBtnText}>Open Play Store</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "error" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Could not load sleep data</Text>
            <Text style={styles.errorText}>{error}</Text>

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
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Last Night</Text>
              <Text style={styles.heroValue}>
                {data?.sleep?.lastNightHours?.toFixed(1) ?? "0"}
              </Text>
              <Text style={styles.heroSub}>hours</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>

              {(data?.sleep?.last7Days ?? []).map((item) => (
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
