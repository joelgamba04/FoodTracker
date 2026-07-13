// src/components/SleepChart.tsx

import { SleepDay } from "@/models/sleepModel";
import { COLORS } from "@/theme/color";
import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type SleepChartProps = {
  data: SleepDay[];
  goal?: number;
  showHeader?: boolean;
  compact?: boolean;
};

const formatDayLabel = (value: string) => {
  // Supports both "Mon" and ISO/date strings such as "2026-07-07".
  if (/^[A-Za-z]{3}$/.test(value)) return value;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 3);
  }

  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const SleepChart = ({
  data,
  goal = 8,
  showHeader = true,
  compact = false,
}: SleepChartProps) => {
  const chartData = useMemo(
    () =>
      data.slice(-7).map((item) => ({
        ...item,
        hours: Number.isFinite(item.hours) ? Math.max(item.hours, 0) : 0,
        dayLabel: formatDayLabel(item.date),
      })),
    [data],
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showHeader ? (
        <View style={styles.header}>
          <Text style={styles.title}>Last 7 Days</Text>
          <Text style={styles.goal}>Goal {goal}h</Text>
        </View>
      ) : null}

      <View style={[styles.chart, compact && styles.chartCompact]}>
        {chartData.map((item, index) => {
          const percent =
            goal > 0 ? Math.min(100, (item.hours / goal) * 100) : 0;

          return (
            <View
              key={`${item.date}-${index}`}
              style={styles.dayColumn}
              accessible
              accessibilityLabel={`${item.dayLabel}: ${item.hours.toFixed(1)} hours`}
            >
              <View style={styles.track}>
                {item.hours > 0 ? (
                  <View
                    style={[
                      styles.fill,
                      {
                        height: `${Math.max(percent, 7)}%`,
                      },
                    ]}
                  />
                ) : null}
              </View>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={styles.value}
              >
                {item.hours > 0 ? `${item.hours.toFixed(1)}h` : "0h"}
              </Text>

              <Text numberOfLines={1} style={styles.day}>
                {item.dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  containerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    minHeight: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  goal: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },
  chart: {
    height: 170,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 5,
  },
  chartCompact: {
    height: 150,
    paddingHorizontal: 6,
    gap: 3,
  },
  dayColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  track: {
    flex: 1,
    width: "70%",
    minWidth: 12,
    maxWidth: 24,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#E6ECF8",
  },
  fill: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.taguigBlue,
  },
  value: {
    width: "100%",
    marginTop: 6,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  day: {
    width: "100%",
    marginTop: 2,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.textSecondary,
  },
});

export default memo(SleepChart);
