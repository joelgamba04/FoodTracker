// app/(tabs)/log.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
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

import { useFoodLog } from "@/context/FoodLogContext";
import { Food, FoodLogEntry } from "@/models/models";
import {
  addFoodLogEntry,
  deleteFoodLogEntry,
  updateFoodLog,
} from "@/services/foodLogService";
import { searchFoods } from "@/services/foodSearchService";

import CustomConfirmationModal from "@/components/CustomConfirmationModal";
import { FoodResultItem } from "@/components/FoodResultItem";
import { LoggedItem } from "@/components/LoggedItem";
import { QuickLog } from "@/components/QuickLog";
import { mapFoodDetailToFood } from "@/mappers/foodMapper";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

export default function LogScreen() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [mealType, setMealType] = useState<1 | 2 | 3>(1);

  const [entryToDelete, setEntryToDelete] = useState<FoodLogEntry | null>(null);

  const insets = useSafeAreaInsets();

  const {
    log,
    addEntry,
    removeEntry,
    updateEntry,
    isLoading: isLogLoading,
    patchEntry,
  } = useFoodLog();

  const { start, end } = getTodayWindow();
  const todayLog = log.filter((e) => {
    const ts =
      e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
    return ts >= start && ts < end;
  });

  const favoriteFoods = useMemo(() => {
    if (!log || log.length === 0) return [];
    const counts: Record<string, { food: Food; count: number }> = {};

    for (const entry of log) {
      const food = entry.food as Food;
      if (!food?.id) continue;

      if (!counts[food.id]) counts[food.id] = { food, count: 0 };
      counts[food.id].count += entry.quantity ?? 1;
    }

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((x) => x.food);
  }, [log]);

  const handleQuantityChange = (text: string) => {
    setQuantity(text.replace(/[^0-9.]/g, ""));
  };

  const adjustQuantity = (delta: number) => {
    const currentQ = Number(quantity) || 0;
    const newQ = Math.max(1, currentQ + delta);
    setQuantity(String(newQ));
  };

  const handleSearch = async () => {
    const query = search.trim();
    if (!query) return;

    setSearchLoading(true);
    setResults([]);
    setSelectedFood(null);
    setEditingEntry(null);

    try {
      const res = await searchFoods(query);

      if (!res.success) {
        setResults([]);
        return;
      }

      const foods = (res.data ?? []).map(mapFoodDetailToFood);
      setResults(foods);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogAction = async () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return;

    if (editingEntry) {
      const localId = editingEntry.localId;

      updateEntry(localId, qty);

      setEditingEntry(null);
      setQuantity("1");
      setSearch("");
      setResults([]);

      const serverId = editingEntry.serverFoodEntryId;
      if (!serverId) {
        patchEntry(localId, {
          syncStatus: "failed",
          lastSyncError: "This entry is not saved on the server yet.",
        });
        return;
      }

      patchEntry(localId, { syncStatus: "pending", lastSyncError: null });

      try {
        const foodId = Number(editingEntry.food.id);
        await updateFoodLog(serverId, { quantity: qty, measure_id: foodId });
        patchEntry(localId, { syncStatus: "synced", lastSyncError: null });
      } catch (e: any) {
        patchEntry(localId, {
          syncStatus: "failed",
          lastSyncError: e?.message ?? "Failed to update on server",
        });
      }
      return;
    }

    if (!selectedFood) return;

    const localId =
      Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const newEntry: FoodLogEntry = {
      localId,
      food: selectedFood,
      quantity: qty,
      timestamp: new Date(),
      mealType,
      syncStatus: "pending",
      serverMealId: null,
      serverFoodEntryId: null,
      lastSyncError: null,
    };

    addEntry(newEntry);

    setSelectedFood(null);
    setQuantity("1");
    setSearch("");
    setResults([]);

    try {
      const foodId = Number(newEntry.food.id);

      const res = await addFoodLogEntry({
        food_id: foodId,
        measure_id: foodId,
        quantity: newEntry.quantity,
        meal_type: newEntry.mealType ?? 1,
        notes: "",
      });

      if (!res.success) {
        patchEntry(localId, {
          syncStatus: "failed",
          lastSyncError: res.message ?? "Upload failed",
        });
        return;
      }

      patchEntry(localId, {
        syncStatus: "synced",
        serverMealId: res.data.meal,
        serverFoodEntryId: res.data.foodEntry,
        lastSyncError: null,
      });
    } catch (e: any) {
      patchEntry(localId, {
        syncStatus: "failed",
        lastSyncError: e?.message ?? "Network error",
      });
    }
  };

  const handleSelectFood = useCallback((foodItem: Food) => {
    setSelectedFood(foodItem);
    setEditingEntry(null);
    setQuantity("1");
    setResults([]);
    setSearch("");
  }, []);

  const handleEditStart = useCallback((entry: FoodLogEntry) => {
    setEditingEntry(entry);
    setSelectedFood(null);
    setQuantity(String(entry.quantity));
    setResults([]);
    setSearch("");
  }, []);

  const handleStartRemove = (entry: FoodLogEntry) => setEntryToDelete(entry);

  const handleConfirmDeletion = async () => {
    if (!entryToDelete) return;

    const entry = entryToDelete;
    setEntryToDelete(null);

    removeEntry(entry.localId);

    if (!entry.serverFoodEntryId) return;

    try {
      await deleteFoodLogEntry(entry.serverFoodEntryId);
    } catch (e: any) {
      // optional rollback
      addEntry(entry);
    }
  };

  const handleCancelDeletion = () => setEntryToDelete(null);

  const isShowingResults = results.length > 0 && !selectedFood && !editingEntry;
  const isShowingActionForm = !!selectedFood || !!editingEntry;

  const currentFood = editingEntry ? editingEntry.food : selectedFood;
  const actionButtonText = editingEntry ? "Update" : "Log";
  const cancelButtonText = editingEntry ? "Cancel Edit" : "Clear Selection";

  if (isLogLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.helperText}>Loading saved log data...</Text>
      </SafeAreaView>
    );
  }

  const modalMessage = entryToDelete
    ? `Remove ${entryToDelete.food.name} (${entryToDelete.quantity} servings)?`
    : "";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingBottom: 50 + insets.bottom,
      }}
    >
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Log Your Meal</Text>

        {/* Search pill */}
        <View style={styles.searchPill}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleSearch}
            disabled={searchLoading || !search.trim()}
            style={styles.searchRightIcon}
          >
            {searchLoading ? (
              <ActivityIndicator size="small" color={COLORS.textMuted} />
            ) : (
              <Ionicons
                name="chevron-down"
                size={18}
                color={COLORS.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick log */}
        {!isShowingResults && !isShowingActionForm && (
          <QuickLog favorites={favoriteFoods} onQuickAdd={handleSelectFood} />
        )}

        <ScrollView
          style={styles.contentScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Selected food / edit panel (keep for now; UI update later if needed) */}
          {isShowingActionForm && currentFood && (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>
                {editingEntry ? "Editing" : "Selected"}
              </Text>
              <Text style={styles.actionFoodName}>{currentFood.name}</Text>
              {!!currentFood.englishName && (
                <Text style={styles.actionSub}>{currentFood.englishName}</Text>
              )}
              <Text style={styles.actionSub}>
                {currentFood.servingSize || "1 serving"}
              </Text>

              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={[
                    styles.qtyBtn,
                    Number(quantity) <= 1 && styles.qtyBtnDisabled,
                  ]}
                  onPress={() => adjustQuantity(-1)}
                  disabled={Number(quantity) <= 1}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  maxLength={4}
                />

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => adjustQuantity(1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogAction}
                disabled={Number(quantity) <= 0}
              >
                <Text style={styles.primaryBtnText}>{actionButtonText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setEditingEntry(null);
                  setSelectedFood(null);
                  setQuantity("1");
                }}
              >
                <Text style={styles.secondaryBtnText}>{cancelButtonText}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search results */}
          {isShowingResults && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.sectionLabel}>Search Results</Text>
              <View style={styles.sectionDivider} />
              {results.map((item) => (
                <FoodResultItem
                  key={item.id}
                  item={item}
                  onPress={handleSelectFood}
                />
              ))}
            </View>
          )}

          {/* Today's Log */}
          {!isShowingResults && !isShowingActionForm && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="restaurant-outline"
                  size={16}
                  color={COLORS.iconPrimary}
                />
                <Text style={styles.sectionLabel}>Today’s Log</Text>
              </View>
              <View style={styles.sectionDivider} />

              {todayLog.length > 0 ? (
                todayLog.map((item) => (
                  <LoggedItem
                    key={item.localId}
                    item={item}
                    onEdit={handleEditStart}
                    onStartRemove={handleStartRemove}
                  />
                ))
              ) : (
                <Text style={styles.helperText}>
                  Nothing logged yet. Search or use Quick Log.
                </Text>
              )}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <CustomConfirmationModal
          isVisible={!!entryToDelete}
          title="Confirm Deletion"
          message={modalMessage}
          onConfirm={handleConfirmDeletion}
          onCancel={handleCancelDeletion}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 14,
  },

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

  contentScroll: {
    flex: 1,
    marginTop: 10,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginTop: 10,
    marginBottom: 12,
  },

  helperText: {
    color: "#8A8F98",
    fontSize: 13,
    lineHeight: 18,
  },

  // Action card (temporary UI – can be redesigned later)
  actionCard: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  actionFoodName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  actionSub: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  quantityRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyBtnText: {
    color: COLORS.textInverse,
    fontSize: 20,
    fontWeight: "700",
  },
  qtyInput: {
    width: 72,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceMuted,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },

  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 15,
  },
});
