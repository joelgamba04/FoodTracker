// app/add-food.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useFoodLog } from "@/context/FoodLogContext";
import { COLORS } from "@/theme/color";

// If you have a food type, import it; otherwise keep `any`
type FoodItem = any;

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Replace this with your real search:
 * - from your old log.tsx
 * - or from foodLogService.ts
 */
function searchFoods(allFoods: FoodItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allFoods
    .filter((f) => {
      const name = (f?.name ?? f?.title ?? "").toLowerCase();
      return name.includes(q);
    })
    .slice(0, 30);
}

export default function AddFoodScreen() {
  const { addEntry } = useFoodLog();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const insets = useSafeAreaInsets();

  /**
   * Replace this with your real master food list source.
   * Example: const allFoods = useFoods(); or import a JSON list.
   */
  const allFoods: FoodItem[] = []; // <-- plug your dataset here

  const results = useMemo(
    () => searchFoods(allFoods, query),
    [allFoods, query],
  );

  const canLog = !!selected && qty > 0;

  const onLog = async () => {
    if (!selected) return;

    await addEntry({
      localId: makeLocalId(),
      timestamp: Date.now(),
      food: selected,
      quantity: qty,
      syncStatus: "pending",
      lastSyncError: null,
      mealType: 1, // TODO: add a picker for mealType later (Breakfast/Lunch/Dinner)
    });

    router.back();
  };

  return (
    <SafeAreaView style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.iconPrimary} />
          <Text style={styles.headerBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Add Food</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.iconPrimary} />
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelected(null);
          }}
          placeholder="Search food…"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* results */}
        {!selected ? (
          <>
            <Text style={styles.sectionTitle}>Results</Text>

            {query.trim().length === 0 ? (
              <Text style={styles.muted}>Type to search.</Text>
            ) : results.length === 0 ? (
              <Text style={styles.muted}>No results.</Text>
            ) : (
              results.map((item, idx) => (
                <Pressable
                  key={`${idx}-${item?.id ?? item?.name ?? "food"}`}
                  style={styles.row}
                  onPress={() => {
                    setSelected(item);
                    setQty(1);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {item?.name ?? item?.title ?? "Food"}
                    </Text>
                    {!!item?.description && (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={COLORS.iconPrimary}
                  />
                </Pressable>
              ))
            )}
          </>
        ) : (
          <>
            {/* selected */}
            <Text style={styles.sectionTitle}>Selected</Text>
            <View style={styles.selectedCard}>
              <Text style={styles.selectedTitle}>
                {selected?.name ?? selected?.title ?? "Food"}
              </Text>

              <View style={styles.qtyRow}>
                <Pressable
                  style={[styles.qtyBtn, qty <= 1 && { opacity: 0.4 }]}
                  disabled={qty <= 1}
                  onPress={() => setQty((v) => Math.max(1, v - 1))}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={COLORS.iconPrimary}
                  />
                </Pressable>

                <Text style={styles.qtyValue}>{qty}</Text>

                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQty((v) => v + 1)}
                >
                  <Ionicons name="add" size={18} color={COLORS.iconPrimary} />
                </Pressable>
              </View>

              <Pressable
                style={[styles.primaryBtn, !canLog && { opacity: 0.5 }]}
                disabled={!canLog}
                onPress={onLog}
              >
                <Text style={styles.primaryBtnText}>Log</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryBtn}
                onPress={() => {
                  setSelected(null);
                  setQty(1);
                }}
              >
                <Text style={styles.secondaryBtnText}>Clear Selection</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  headerBtnText: { fontWeight: "700", color: COLORS.textPrimary },
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },

  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  sectionTitle: { fontSize: 13, fontWeight: "900", marginBottom: 10 },
  muted: { opacity: 0.6 },

  row: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  rowTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  rowSub: { marginTop: 4, fontSize: 12, opacity: 0.65 },

  selectedCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  selectedTitle: { fontSize: 16, fontWeight: "900", marginBottom: 12 },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 14,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: "900",
    minWidth: 30,
    textAlign: "center",
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: COLORS.textPrimary, fontWeight: "900" },

  secondaryBtn: {
    marginTop: 10,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: COLORS.textPrimary, fontWeight: "800" },
});
