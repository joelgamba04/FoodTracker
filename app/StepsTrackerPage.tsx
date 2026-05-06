// app/StepsTrackerPage.tsx

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
import { useSteps } from "@/hooks/useSteps";
import type { StepsSummary } from "@/models/stepsModel";
import {
  checkAndroidHealthConnectAvailability,
  openHealthConnectStorePage,
} from "@/services/health/healthConnectInstall";
import {
  ensureStepsAccess,
  readStepsSummary,
} from "@/services/health/stepsService";
import { COLORS } from "@/theme/color";
import { router } from "expo-router";

type PageState =
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

const StepsTrackerPage = () => {
  const [state, setState] = useState<PageState>("checking_availability");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StepsSummary | null>(null);
  const { loading, data: stepsData, error: stepsError, loadSteps } = useSteps();

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(null);

      if (Platform.OS === "android") {
        setState("checking_availability");

        const availability = await checkAndroidHealthConnectAvailability();

        if (!availability.available) {
          setState("missing_provider");
          return;
        }
      }

      setState("requesting_permission");
      const access = await ensureStepsAccess();

      if (!access.ok) {
        setState("error");
        setError(access.reason ?? "Unable to access steps");
        return;
      }

      setState("loading_data");
      const summary = await readStepsSummary();
      setData(summary);
      setState("ready");
    } catch (err: any) {
      setState("error");
      setError(err?.message ?? "Failed to load steps");
    }
  }, []);

  const init = async () => {
    // 1. check Health Connect
    const availability = await checkAndroidHealthConnectAvailability();

    if (!availability.available) {
      setState("missing_provider");
      return;
    }

    // 2. request permission
    const access = await ensureStepsAccess();

    if (!access.ok) {
      setState("error");
      return;
    }

    // 3. load steps
    await loadSteps();

    setState("ready");
  };
  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Steps" showBack onBackPress={() => router.back()} />

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
              {state === "loading_data" && "Loading step data..."}
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

        {state === "error" ? (
          <View style={styles.centerCard}>
            <Text style={styles.title}>Could not load steps</Text>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable style={styles.primaryBtn} onPress={load}>
              <Text style={styles.primaryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {state === "ready" ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Today</Text>
              <Text style={styles.heroValue}>
                {data?.todaySteps?.toLocaleString?.() ?? "0"}
              </Text>
              <Text style={styles.heroSub}>steps</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>

              {(data?.last7Days ?? []).map((item) => (
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
