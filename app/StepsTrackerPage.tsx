// app/StepsTrackerPage.tsx

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
import { ensureStepsAccess } from "@/services/health/stepsService";
import { formatPrettyDate } from "@/utils/date";

import {
  getHealthConnected,
  setHealthConnected,
} from "@/services/health/healthCache";
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

const StepsTrackerPage = () => {
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
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Today</Text>
              <Text style={styles.heroValue}>
                {data?.steps?.todaySteps?.toLocaleString?.() ?? "0"}
              </Text>
              <Text style={styles.heroSub}>steps</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>

              {(data?.steps?.last7Days ?? []).map((item) => (
                <View key={item.date} style={styles.row}>
                  <Text style={styles.dayText}>
                    {formatPrettyDate(item.date)}
                  </Text>
                  <Text style={styles.countText}>
                    {item.count.toLocaleString()}
                  </Text>
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
export default StepsTrackerPage;
