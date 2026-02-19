// app/add-food.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { mapFoodDetailToFood } from "@/mappers/foodMapper";
import { Food } from "@/models/models";
import { searchFoods } from "@/services/foodSearchService";
import { COLORS } from "@/theme/color";

// If you have a food type, import it; otherwise keep `any`
type FoodItem = any;

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AddFoodScreen() {
  const { addEntry } = useFoodLog();

  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const insets = useSafeAreaInsets();

  const [results, setResults] = useState<Food[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canLog = !!selected && qty > 0;

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const t = setTimeout(() => {
      handleSearch(q);
    }, 350);

    return () => clearTimeout(t);
  }, [search]);

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

  const handleSearch = async (raw: string) => {
    const query = (raw ?? search).trim();
    if (!query) {
      setResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await searchFoods(query);
      if (!res.success) {
        setResults([]);
        return;
      }

      const foods = (res.data ?? []).map(mapFoodDetailToFood);
      setResults(foods);
    } catch (err: any) {
      console.error("Search failed:", err);
      setSearchError("Search failed. Try again.");
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
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
          value={search}
          onChangeText={(t) => {
            setSearch(t);
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

            {search.trim().length === 0 ? (
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
                      {item?.name ?? item?.name ?? "Food"}
                    </Text>
                    {!!item?.englishName && (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {item.englishName}
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

        {/* error and loading states */}
        {searchLoading ? (
          <Text style={styles.muted}>Searching…</Text>
        ) : searchError ? (
          <Text style={styles.errorText}>{searchError}</Text>
        ) : null}

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
    backgroundColor: COLORS.textPrimary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: COLORS.textInverse, fontWeight: "900" },

  secondaryBtn: {
    marginTop: 10,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: COLORS.textPrimary, fontWeight: "800" },

  errorText: {
    color: COLORS.dangerRed,
    fontWeight: "700",
    marginBottom: 10,
  },
});
