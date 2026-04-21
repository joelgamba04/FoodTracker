// app/AddFoodPage.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import AppHeader from "@/components/AppHeader";
import { useFoodLog } from "@/context/FoodLogContext";
import { isApiError } from "@/lib/apiClient";
import { Food } from "@/models/models";

import { COLORS } from "@/theme/color";
import { searchFoods } from "@/utils/mockFoodApi";

type FoodItem = any;

const makeLocalId = () => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const AddFoodPage = () => {
  const { addEntry } = useFoodLog();

  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const insets = useSafeAreaInsets();

  const [results, setResults] = useState<Food[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchSequence = useRef(0); // to track latest search
  const [pauseAutoSearch, setPauseAutoSearch] = useState(false); // to pause auto-search when error is encountered

  const canLog = !!selected && qty > 0;

  useEffect(() => {
    if (pauseAutoSearch) return;

    const q = search.trim();
    if (!q) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const t = setTimeout(() => {
      handleSearch(q);
    }, 350);

    return () => clearTimeout(t);
  }, [search, pauseAutoSearch]);

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
      setSearchError(null);
      return;
    }

    const seq = ++searchSequence.current; // increment sequence for this search

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await searchFoods(query);
      console.log("Search response:", res);

      if (seq !== searchSequence.current) {
        // A newer search has started, ignore this result
        return;
      }

      // if (!res.success) {
      //   setResults([]);
      //   setSearchError(res.message || "No results found.");
      //   return;
      // }

      // const foods = (res.data ?? []).map(mapFoodDetailToFood);

      if (res.length === 0) {
        setResults([]);
        setSearchError("No results found.");
        return;
      }

      setResults(res);
      setPauseAutoSearch(false); // reset pause on successful search
    } catch (err: unknown) {
      if (seq !== searchSequence.current) return;

      console.error("Search failed:", err);

      if (isApiError(err)) {
        switch (err.kind) {
          case "NETWORK":
            setSearchError(
              "No internet connection or server unreachable. Please connect to the internet and try again later.",
            );
            setPauseAutoSearch(true);
            break;

          case "TIMEOUT":
            setSearchError("Search timed out. Please try again.");
            break;

          case "SERVER_UNAVAILABLE":
            setSearchError(
              "Server is temporarily unavailable. Please contact support or try again later.",
            );
            setPauseAutoSearch(true);
            break;

          case "BAD_REQUEST":
            setSearchError(err.message || "Invalid search request.");
            break;

          default:
            setSearchError(err.message || "Search failed. Please try again.");
            break;
        }
      } else {
        setSearchError("Search failed. Please try again.");
      }

      setResults([]);
    } finally {
      if (seq === searchSequence.current) {
        setSearchLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { paddingBottom: insets.bottom }]}>
      {/* header */}
      <AppHeader title="Add Food" showBack onBackPress={() => router.back()} />

      {/* search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.iconPrimary} />
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setSelected(null);
            setPauseAutoSearch(false); // reset pause when user types
            setSearchError(null); // clear error on new input
          }}
          placeholder="Search food…"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
          onSubmitEditing={() => {
            setPauseAutoSearch(false);
            handleSearch(search);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* results */}
        {!selected ? (
          <>
            <Text style={styles.sectionTitle}>Results</Text>

            {search.trim().length === 0 ? (
              <Text style={styles.muted}>Type to search.</Text>
            ) : searchLoading ? (
              <Text style={styles.muted}>Searching…</Text>
            ) : searchError ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorText}>{searchError}</Text>

                <Pressable
                  style={styles.retryBtn}
                  onPress={() => {
                    setPauseAutoSearch(false);
                    handleSearch(search);
                  }}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </Pressable>
              </View>
            ) : results.length === 0 ? (
              <Text style={styles.muted}>No results.</Text>
            ) : (
              results.map((item) => (
                <Pressable
                  key={String(item.id)}
                  style={styles.row}
                  onPress={() => {
                    setSelected(item);
                    setQty(1);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item?.name ?? "Food"}</Text>
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
              <Text style={styles.selectedMeta}>
                {selected?.englishName ?? "—"}
              </Text>
              <Text style={styles.selectedMeta}>
                {"Serving Size: "}
                {selected?.servingSize ?? "—"}
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
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

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
  selectedMeta: { fontSize: 13, opacity: 0.75, marginTop: 2 },

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
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
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
  errorWrap: {
    gap: 10,
  },
  retryBtn: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  retryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
  },
});

export default AddFoodPage;
