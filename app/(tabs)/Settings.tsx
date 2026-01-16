// app/(tabs)/Settings.tsx
import { NutrientKey, useProfile } from "@/context/ProfileContext";
import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type GoalRowProps = {
  label: string;
  value: string;
  unit: string;
  isLast?: boolean;
  highlight?: boolean;
};

function GoalRow({ label, value, unit, isLast, highlight }: GoalRowProps) {
  return (
    <View style={[styles.goalRow, isLast && styles.goalRowLast]}>
      <Text style={[styles.goalLabel, highlight && styles.goalLabelHighlight]}>
        {label}
      </Text>

      <View style={styles.goalRight}>
        <Text style={styles.goalValue}>{value}</Text>
        <Text style={styles.goalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function ProfileSummary({
  sex,
  age,
  weight,
  height,
}: {
  sex?: string;
  age?: string;
  weight?: string;
  height?: string;
}) {
  const hasAny = Boolean(sex || age || weight || height);

  if (!hasAny) {
    return (
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.infoTitle}>Profile</Text>
        </View>
        <Text style={styles.infoText}>
          Complete your profile to personalize recommendations.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons
          name="person-outline"
          size={18}
          color={COLORS.textSecondary}
        />
        <Text style={styles.infoTitle}>Profile Summary</Text>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryChip label="Sex" value={sex || "—"} />
        <SummaryChip label="Age" value={age ? `${age} yrs` : "—"} />
        <SummaryChip label="Weight" value={weight ? `${weight} kg` : "—"} />
        <SummaryChip label="Height" value={height ? `${height} cm` : "—"} />
      </View>
    </View>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { rdi, profile } = useProfile();
  const insets = useSafeAreaInsets();

  const macros: NutrientKey[] = useMemo(
    () => ["Calories", "Carbohydrate", "Protein", "Fat"],
    []
  );

  // Guard: avoid crashes if rdi not ready for any reason
  const safeRdi = rdi ?? ({} as any);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Your daily goals are based on your profile.
          </Text>
        </View>

        {/* Profile summary */}
        <ProfileSummary
          sex={profile?.sex}
          age={profile?.age}
          weight={profile?.weight}
          height={profile?.height}
        />

        {/* Goals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          <Text style={styles.sectionHint}>Read-only</Text>
        </View>

        <View style={styles.card}>
          {macros.map((key, idx) => {
            const amount =
              safeRdi?.[key]?.amount !== undefined
                ? String(safeRdi[key].amount)
                : "—";
            const unit = safeRdi?.[key]?.unit ?? "";

            return (
              <GoalRow
                key={key}
                label={key}
                value={amount}
                unit={unit}
                highlight={key === "Calories" || key === "Protein"}
                isLast={idx === macros.length - 1}
              />
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  header: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "left",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexBasis: "48%",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  chipLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  chipValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  goalRowLast: {
    borderBottomWidth: 0,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  goalLabelHighlight: {
    color: COLORS.textPrimary,
  },
  goalRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  goalUnit: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
  },
});
