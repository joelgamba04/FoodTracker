// src/app/(tabs)/history.tsx
import { LoggedItem } from "@/components/LoggedItem";
import { useFoodLog } from "@/context/FoodLogContext";
import { FoodLogEntry } from "@/models/models";
import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const sumBy = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const getCalories = (entry: FoodLogEntry) => {
  const list = entry.food?.nutrients ?? [];
  const cal =
    list.find((nutrient) => nutrient.name === "Calories")?.amount ?? 0;
  return cal * (entry.quantity ?? 1);
};

function dayTotals(entries: FoodLogEntry[]) {
  const pick = (name: string) =>
    sumBy(
      entries.map((entry) => {
        const unit =
          entry.food?.nutrients?.find((nutrient) => nutrient.name === name)
            ?.amount ?? 0;
        return unit * (entry.quantity ?? 1);
      })
    );
  return {
    kcal: sumBy(entries.map(getCalories)),
    protein: pick("Protein"),
    carbs: pick("Carbohydrate"),
    fat: pick("Fat"),
  };
}

function groupByDay(all: FoodLogEntry[]) {
  const map = new Map<string, FoodLogEntry[]>();
  for (const e of all) {
    const date = new Date(e.timestamp as any);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;

    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }

  const sections = Array.from(map.entries())
    .map(([key, entries]) => {
      const totals = dayTotals(entries);
      return {
        title: `${formatDate(new Date(entries[0].timestamp as any))}`,
        subtitle: `Protein ${Math.round(totals.protein)}g • Carbs ${Math.round(
          totals.carbs
        )}g • Fat ${Math.round(totals.fat)}g`,
        kcal: Math.round(totals.kcal),
        dateKey: key,
        data: entries.sort(
          (a, b) =>
            +new Date(b.timestamp as any) - +new Date(a.timestamp as any)
        ),
      };
    })
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

  return sections;
}

const daysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function HistoryScreen() {
  const { log, isLoading } = useFoodLog();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<"all" | "7" | "30">("all");
  const insets = useSafeAreaInsets();

  const filteredSections = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const after =
      range === "7" ? daysAgo(7) : range === "30" ? daysAgo(30) : null;

    const base = (log ?? []).filter((entry: FoodLogEntry) => {
      const ts = new Date(entry.timestamp as any);
      if (after && ts < after) return false;

      if (!lower) return true;
      const name = entry.food?.name?.toLowerCase() ?? "";
      const english = entry.food?.englishName?.toLowerCase() ?? "";
      return name.includes(lower) || english.includes(lower);
    });

    return groupByDay(base);
  }, [log, query, range]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.dim}>Loading history…</Text>
      </SafeAreaView>
    );
  }

  if (!log || log.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.h1}>No history yet</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Controls */}
      <View style={styles.controls}>
        {/* Search pill (same look as log page) */}
        <View style={styles.searchPill}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Placeholder"
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => {}}
            style={styles.searchRightIcon}
            hitSlop={10}
          >
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Range buttons */}
        <View style={styles.rangeWrap}>
          <RangeButton
            label="ALL"
            active={range === "all"}
            onPress={() => setRange("all")}
          />
          <RangeButton
            label="7D"
            active={range === "7"}
            onPress={() => setRange("7")}
          />
          <RangeButton
            label="30D"
            active={range === "30"}
            onPress={() => setRange("30")}
          />
        </View>
      </View>

      <SectionList
        sections={filteredSections}
        keyExtractor={(item: FoodLogEntry) => item.localId}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderTop}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionKcal}>{section.kcal} kcal</Text>
            </View>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            <View style={styles.sectionDivider} />
          </View>
        )}
        renderItem={({ item }) => (
          <LoggedItem
            item={item}
            // History is read-only for now:
            onEdit={() => {}}
            onStartRemove={() => {}}
            disableActions={true}
          />
        )}
        SectionSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

function RangeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.rangeBtn, active ? styles.rangeBtnActive : null]}
      activeOpacity={0.85}
    >
      <Text style={[styles.rangeText, active ? styles.rangeTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.background,
  },
  dim: { opacity: 0.7, marginTop: 6, color: COLORS.textSecondary },
  h1: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },

  controls: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    gap: 10,
  },

  // Search pill (same design language as log page)
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  searchRightIcon: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  rangeWrap: {
    flexDirection: "row",
    gap: 10,
  },
  rangeBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.background,
  },
  rangeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  rangeText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  rangeTextActive: {
    color: COLORS.primary,
  },

  listPad: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 100,
  },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 6,
  },
  sectionHeaderTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textMuted,
  },
  sectionKcal: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textMuted,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  sectionDivider: {
    marginTop: 10,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
});
