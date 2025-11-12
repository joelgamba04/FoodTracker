import { useFoodLog } from "@/context/FoodLogContext";
import { FoodLogEntry } from "@/models/models";
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
import { SafeAreaView } from "react-native-safe-area-context";

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const getCalories = (entry: FoodLogEntry) => {
  const list = entry.food?.nutrients ?? [];
  const cal =
    list.find((nutrient) => nutrient.name === "Calories")?.amount ?? 0;
  return cal * (entry.quantity ?? 1);
};

const sumBy = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Compute macro totals for a set of entries
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

// Group entries by yyyy-mm-dd
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
  // Convert to sections sorted desc by date
  const sections = Array.from(map.entries())
    .map(([key, entries]) => {
      const date = new Date(key);
      const totals = dayTotals(entries);
      return {
        title: `${formatDate(
          new Date(entries[0].timestamp as any)
        )} — ${Math.round(totals.kcal)} kcal`,
        subtitle: `P ${Math.round(totals.protein)}g • C ${Math.round(
          totals.carbs
        )}g • F ${Math.round(totals.fat)}g`,
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

// Date filter helpers
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

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const after =
      range === "7" ? daysAgo(7) : range === "30" ? daysAgo(30) : null;

    const base = (log ?? []).filter((foodLogEntry: FoodLogEntry) => {
      const ts = new Date(foodLogEntry.timestamp as any);
      if (after && ts < after) return false;
      if (!lower) return true;
      const name = foodLogEntry.food?.name?.toLowerCase() ?? "";
      return name.includes(lower);
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
    <SafeAreaView style={{ flex: 1 }}>
      {/* Controls */}
      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods…"
          placeholderTextColor="#888"
          style={styles.search}
        />
        <View style={styles.rangeWrap}>
          <RangeButton
            label="All"
            active={range === "all"}
            onPress={() => setRange("all")}
          />
          <RangeButton
            label="7d"
            active={range === "7"}
            onPress={() => setRange("7")}
          />
          <RangeButton
            label="30d"
            active={range === "30"}
            onPress={() => setRange("30")}
          />
        </View>
      </View>

      <SectionList
        sections={filtered}
        keyExtractor={(item: FoodLogEntry) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.secHeader}>
            <Text style={styles.secTitle}>{section.title}</Text>
            <Text style={styles.secSubtitle}>{section.subtitle}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>
                {item.food?.name ?? "Unnamed item"}
              </Text>
              <Text style={styles.itemSub}>
                {formatTime(new Date(item.timestamp as any))}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.itemKcal}>
                {Math.round(getCalories(item))}
              </Text>
              <Text style={styles.itemKcalUnit}>kcal</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.listPad}
      />
    </SafeAreaView>
  );
}

// ——— Small components
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
    >
      <Text style={[styles.rangeText, active ? styles.rangeTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ——— Styles
const BLUE = "#007AFF";
const DANGER = "#d7263d";
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dim: { opacity: 0.7, marginTop: 6 },
  h1: { fontSize: 20, fontWeight: "700" },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    backgroundColor: "#f4f7f9",
  },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  rangeWrap: { flexDirection: "row", gap: 8 },
  rangeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  rangeBtnActive: { borderColor: BLUE, backgroundColor: "#eef5ff" },
  rangeText: { color: "#333", fontWeight: "600" },
  rangeTextActive: { color: BLUE },
  listPad: { padding: 16, paddingBottom: 100 },
  secHeader: { marginTop: 8, marginBottom: 6 },
  secTitle: { fontSize: 16, fontWeight: "700", color: BLUE },
  secSubtitle: { fontSize: 12, opacity: 0.7 },
  itemRow: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingVertical: 10,
  },
  itemTitle: { fontWeight: "600", fontSize: 15 },
  itemSub: { opacity: 0.6, marginTop: 2 },
  itemKcal: { fontSize: 18, fontWeight: "800" },
  itemKcalUnit: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  sep: { height: 1, backgroundColor: "#eee" },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 10,
  },
  btn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutline: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd" },
  btnOutlineText: { color: "#333" },
  btnDanger: { backgroundColor: DANGER },
});
