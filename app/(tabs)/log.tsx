//app/(tabs)/log.tsx
// Main Log Screen with Edit and Delete Functionality
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

// =================================================================
// Context and Models
import { useFoodLog } from "@/context/FoodLogContext";
import { Food, FoodLogEntry } from "@/models/models";
import {
  addFoodLogEntry,
  deleteFoodLogEntry,
  updateFoodLog,
} from "@/services/foodLogService";
import { searchFoods } from "@/services/foodSearchService";
// =================================================================

import CustomConfirmationModal from "@/components/CustomConfirmationModal";
import { FoodResultItem } from "@/components/FoodResultItem";
import { LoggedItem } from "@/components/LoggedItem";
import { QuickLog } from "@/components/QuickLog";
import { mapFoodDetailToFood } from "@/mappers/foodMapper";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

// =================================================================
// --- Main Screen Component ---
// This component is renamed and exported directly.
// The FoodLogProvider is assumed to be wrapping the entire app/navigation.
// =================================================================
export default function LogScreen() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [mealType, setMealType] = useState<1 | 2 | 3>(1);

  // --- NEW STATE FOR MODAL CONTROL ---
  const [entryToDelete, setEntryToDelete] = useState<FoodLogEntry | null>(null);

  const insets = useSafeAreaInsets();

  // Destructure actions from the context
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
    const ts = new Date(e.timestamp as any);
    return ts >= start && ts < end;
  });

  const favoriteFoods = useMemo(() => {
    if (!log || log.length === 0) return [];

    const counts: Record<string, { food: Food; count: number }> = {};

    for (const entry of log) {
      const food = entry.food as Food;
      if (!food || !food.id) continue;

      if (!counts[food.id]) {
        counts[food.id] = { food, count: 0 };
      }

      const qty = entry.quantity ?? 1;
      counts[food.id].count += qty;
    }

    return Object.values(counts)
      .sort((a, b) => b.count - a.count) // highest count first
      .slice(0, 5) // top 5
      .map((item) => item.food);
  }, [log]);

  // --- Quantity Handlers ---
  const handleQuantityChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    setQuantity(cleanedText);
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
        console.error("Search failed:", res.message);
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

      // 1) Update locally right away
      updateEntry(localId, qty);

      // Reset UI immediately
      setEditingEntry(null);
      setQuantity("1");
      setSearch("");
      setResults([]);

      // 2) If it was never uploaded, you can't update server yet
      const serverId = editingEntry.serverFoodEntryId;
      if (!serverId) {
        patchEntry(localId, {
          syncStatus: "failed",
          lastSyncError:
            "This entry is not saved on the server yet. Upload first.",
        });
        return;
      }

      // 3) Attempt server update
      patchEntry(localId, { syncStatus: "pending", lastSyncError: null });

      try {
        const foodId = Number(editingEntry.food.id); // measure_id == food_id

        await updateFoodLog(serverId, {
          quantity: qty,
          measure_id: foodId,
        });

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

      mealType, // 1/2/3 if you have it
      syncStatus: "pending",
      serverMealId: null,
      serverFoodEntryId: null,
      lastSyncError: null,
    };

    // 1) Local-first: instant UI
    addEntry(newEntry);

    // reset UI immediately (do not wait for network)
    setSelectedFood(null);
    setQuantity("1");
    setSearch("");
    setResults([]);

    // 2) Best-effort upload
    try {
      const foodId = Number(newEntry.food.id);

      const res = await addFoodLogEntry({
        food_id: foodId,
        measure_id: foodId, // per backend rule
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

  // Unified handler for QuickLog and SearchResult tap (No Change)
  const handleSelectFood = useCallback((foodItem: Food) => {
    setSelectedFood(foodItem);
    setEditingEntry(null);
    setQuantity("1");
    setResults([]);
    setSearch("");
  }, []);

  // Handler to start editing a log entry
  const handleEditStart = useCallback((entry: FoodLogEntry) => {
    setEditingEntry(entry);
    setSelectedFood(null);
    setQuantity(String(entry.quantity));
    setResults([]);
    setSearch("");
  }, []);

  const handleStartRemove = (entry: FoodLogEntry) => {
    setEntryToDelete(entry);
  };

  const handleConfirmDeletion = async () => {
    if (!entryToDelete) return;

    const entry = entryToDelete;

    // close modal immediately
    setEntryToDelete(null);

    // 1) remove locally first (instant UI)
    removeEntry(entry.localId);

    // 2) if it was never uploaded, stop here
    if (!entry.serverFoodEntryId) return;

    // 3) attempt server delete
    try {
      await deleteFoodLogEntry(entry.serverFoodEntryId);
    } catch (e: any) {
      // Optional rollback (recommended early dev so you notice failures)
      addEntry(entry);
    }
  };

  const handleCancelDeletion = () => {
    setEntryToDelete(null); // Hide modal
  };
  // -----------------------------

  // Determine which input/action area to show (No Change)
  const isSearching = !!search.trim() && !searchLoading;
  const isShowingResults = results.length > 0 && !selectedFood && !editingEntry;
  const isShowingActionForm = selectedFood || editingEntry;
  const isShowingLoggedFood = todayLog.length > 0;

  // Set the current food for display in the action form (No Change)
  const currentFood = editingEntry ? editingEntry.food : selectedFood;
  const actionButtonText = editingEntry ? `Update` : `Log`;
  const cancelButtonText = editingEntry ? "Cancel Edit" : "Clear Selection";

  // Show global loading state (No Change)
  if (isLogLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.listEmptyText}>Loading saved log data...</Text>
      </SafeAreaView>
    );
  }

  // Determine modal message
  const modalMessage = entryToDelete
    ? `Are you sure you want to remove ${entryToDelete.food.name} (${entryToDelete.quantity} servings)? This action cannot be undone.`
    : "";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        paddingBottom: 50 + insets.bottom,
      }}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>🍽️ Log Your Meal</Text>

        {/* --- Food Search Section --- */}
        <View style={styles.searchBarContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for food, e.g., 'rice', 'gabi'"
            placeholderTextColor="#888"
            style={styles.input}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={searchLoading || !search.trim()}
          >
            {searchLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- QUICK LOG INTEGRATION --- */}
        {!isSearching && !isShowingActionForm && (
          <QuickLog favorites={favoriteFoods} onQuickAdd={handleSelectFood} />
        )}

        {/* --- Main Scrollable Content Area --- */}
        <ScrollView
          style={styles.contentScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Selected Food / Editing Input Section --- */}
          {isShowingActionForm && currentFood && (
            <View style={styles.selectedFoodContainer}>
              <Text style={styles.selectedFoodTitle}>
                {editingEntry ? "Editing Log Entry" : "Add New Food"}
              </Text>
              <Text style={styles.selectedFoodDetails}>
                {currentFood.name} - Serving: {currentFood.servingSize}
              </Text>

              {currentFood.englishName ? (
                <Text style={styles.selectedFoodDetails}>
                  {currentFood.englishName}
                </Text>
              ) : null}

              {/* QUANTITY CONTROL SECTION */}
              <View style={styles.quantityControl}>
                {/* Minus Button */}
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(-1)}
                  disabled={Number(quantity) <= 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>

                {/* Quantity Input */}
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  maxLength={4}
                />

                {/* Plus Button */}
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Log Button */}
              <TouchableOpacity
                style={styles.logButton}
                onPress={handleLogAction}
                // Also disabled if the quantity is 0
                disabled={Number(quantity) <= 0}
              >
                <Text style={styles.logButtonText}>{actionButtonText}</Text>
              </TouchableOpacity>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.logButton, styles.cancelButton]}
                onPress={() => {
                  setEditingEntry(null);
                  setSelectedFood(null);
                  setQuantity("1");
                }}
              >
                <Text style={styles.logButtonText}>{cancelButtonText}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- Search Results List --- */}
          {isShowingResults && (
            <>
              <Text style={styles.logHeading}>Search Results</Text>
              {results.map((item) => (
                <FoodResultItem
                  key={item.id}
                  item={item}
                  onPress={handleSelectFood}
                />
              ))}
            </>
          )}

          {/* --- Today's Log Section --- */}
          {!isShowingResults && !isShowingActionForm && (
            <>
              <Text style={styles.logHeading}>
                📝 Today's Log — {new Date().toLocaleDateString()}
              </Text>
              {isShowingLoggedFood ? (
                // Use the new prop onStartRemove
                todayLog.map((item) => (
                  <LoggedItem
                    key={item.localId}
                    item={item}
                    onEdit={handleEditStart}
                    onStartRemove={handleStartRemove}
                  />
                ))
              ) : (
                <Text style={styles.listEmptyText}>
                  Nothing logged yet. Start searching or use Quick Log!
                </Text>
              )}
            </>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* --- MOVED MODAL TO THE ROOT OF LogScreen --- */}
        <CustomConfirmationModal
          isVisible={!!entryToDelete} // Modal is visible if entryToDelete is set
          title="Confirm Deletion"
          message={modalMessage}
          onConfirm={handleConfirmDeletion}
          onCancel={handleCancelDeletion}
        />
      </View>
    </SafeAreaView>
  );
}

// =================================================================
// --- Stylesheet ---
// =================================================================

const styles = StyleSheet.create({
  // Global Styles
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.bg,
  },
  contentScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },

  // --- Search Bar Styles ---
  searchBarContainer: {
    flexDirection: "row",
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  resultsList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  listEmptyText: {
    textAlign: "center",
    color: COLORS.grayDark,
    padding: 10,
    fontStyle: "italic",
  },

  // --- Selected Food & Quantity Control Styles ---
  selectedFoodContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  selectedFoodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  selectedFoodDetails: {
    fontSize: 14,
    color: "#888",
    marginBottom: 15,
  },
  // Quantity Control
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quantityButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  quantityButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "300",
  },
  quantityInput: {
    width: 70,
    height: 45,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 5,
  },

  // Log Button Style
  logButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  logButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: COLORS.grayDark,
  },

  // --- Today's Log Styles ---
  logHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
});
