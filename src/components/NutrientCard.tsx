// src/components/NutrientCard.tsx
import { COLORS } from "@/theme/color";
import React from "react";
import {
    DimensionValue,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";


function getBarColor(percent: number) {
  if (percent > 1.2) return COLORS.dangerRed;
  if (percent < 0.6) return COLORS.warningYellow;
  return COLORS.accentGreen;
}

// --- Reusable Nutrient Card Component ---
interface NutrientCardProps {
  name: string;
  consumed: number;
  recommended: number;
  unit: string;
  isMacro?: boolean;
}

export const NutrientCard: React.FC<NutrientCardProps> = ({
  name,
  consumed,
  recommended,
  unit,
  isMacro = false,
}) => {
  const percent = recommended > 0 ? consumed / recommended : 0;
  const MAX_BAR_PERCENT = 1.5;
  const cappedPercent = Math.min(percent, MAX_BAR_PERCENT);
  const visualWidthPercent = (cappedPercent / MAX_BAR_PERCENT) * 100;

  const barWidth: DimensionValue = `${visualWidthPercent}%`;
  const color = getBarColor(percent);
  const markerPosition = `${(1 / MAX_BAR_PERCENT) * 100}%`;

  return (
    <View style={[styles.card, isMacro && styles.macroCard]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, isMacro && styles.macroTitle]}>
          {name}
        </Text>
        <Text style={styles.cardGoal}>
          Goal: {recommended.toFixed(0)}
          {unit}
        </Text>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.bar,
              {
                width: barWidth,
                backgroundColor: color,
              },
            ]}
          />
          <View style={[styles.marker, { left: markerPosition }]} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.consumedText}>
            Consumed:{" "}
            <Text style={{ color }}>
              {consumed.toFixed(name === "Calories" ? 0 : 1)}
            </Text>
            {unit}
          </Text>
          {percent > 1.2 ? (
            <Text style={styles.statusTextRed}>⚠️ Over Target</Text>
          ) : percent < 0.6 ? (
            <Text style={styles.statusTextYellow}>📉 Lacking</Text>
          ) : (
            <Text style={styles.statusTextGreen}>✅ On Track</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  macroCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  macroTitle: {
    color: COLORS.primary,
  },
  cardGoal: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  barContainer: {
    marginTop: 5,
  },
  barBackground: {
    height: 12,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
    position: "absolute",
    left: 0,
    top: 0,
  },
  marker: {
    position: "absolute",
    top: 0,
    width: 2,
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 1,
    zIndex: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },
  consumedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  statusTextGreen: {
    color: COLORS.accentGreen,
    fontWeight: "bold",
    fontSize: 14,
  },
  statusTextYellow: {
    color: COLORS.warningYellow,
    fontWeight: "bold",
    fontSize: 14,
  },
  statusTextRed: {
    color: COLORS.dangerRed,
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default NutrientCard;