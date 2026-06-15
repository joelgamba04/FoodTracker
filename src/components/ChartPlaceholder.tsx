import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
const ChartPlaceholder = ({ title, subtitle, color }: any) => (
  <View style={styles.chartCard}>
    <View style={styles.chartHeader}>
      <View style={[styles.chartIcon, { backgroundColor: color }]}>
        <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
      </View>
      <View>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="add"
        size={26}
        color={color}
        style={{ marginLeft: "auto" }}
      />
    </View>

    <View style={styles.chartPlaceholder}>
      <Text style={styles.placeholderText}>Chart Placeholder</Text>
    </View>
  </View>
);

export default ChartPlaceholder;

const styles = StyleSheet.create({
  chartCard: {
    marginTop: 16,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  chartIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chartTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary },
  chartSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  chartPlaceholder: {
    marginTop: 16,
    height: 160,
    borderRadius: 16,
    backgroundColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
});
