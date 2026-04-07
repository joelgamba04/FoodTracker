import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";
import { useSteps } from "@/hooks/useSteps";
import { COLORS } from "@/theme/color";

const formatPrettyDate = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const StepsTrackerPage = () => {
  const { loading, error, data, refresh } = useSteps();

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Steps" subtitle="Daily step history" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Today</Text>
          <Text style={styles.heroValue}>
            {loading ? "..." : `${data?.todaySteps?.toLocaleString?.() ?? 0}`}
          </Text>
          <Text style={styles.heroSub}>steps</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>

            <Pressable style={styles.refreshBtn} onPress={refresh}>
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading step data...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            (data?.last7Days ?? []).map((item) => (
              <View key={item.date} style={styles.row}>
                <View>
                  <Text style={styles.dayText}>
                    {formatPrettyDate(item.date)}
                  </Text>
                  <Text style={styles.sourceText}>
                    {item.source ? item.source : "Health data"}
                  </Text>
                </View>

                <Text style={styles.countText}>
                  {item.count.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  refreshText: {
    color: COLORS.textInverse,
    fontWeight: "800",
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
  sourceText: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.6,
  },
  countText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  centerState: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },
  muted: {
    opacity: 0.65,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
  },
});

export default StepsTrackerPage;
