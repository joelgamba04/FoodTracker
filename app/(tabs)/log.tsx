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
import { SafeAreaView } from "react-native-safe-area-context";

// =================================================================
// Context and Models
import { useFoodLog } from "@/context/FoodLogContext";
import { Food, FoodLogEntry } from "@/models/models";
import { AddFoodLogEntry, UpdateFoodLog } from "@/services/foodLogService";
import { SearchFoods } from "@/services/foodSearchService";
// =================================================================

import CustomConfirmationModal from "@/components/CustomConfirmationModal"; // <--- Imported Modal
import { FoodDetail } from "@/models/foodModels";
import { getTodayWindow } from "@/utils/date";

// --- Theme Constants ---
const PRIMARY_COLOR = "#007AFF"; // Blue
const ACCENT_COLOR = "#4CD964"; // Green (Log/Update)
const DANGER_RED = "#FF3B30"; // Red for delete
const GRAY_LIGHT = "#e8e8e8";
const GRAY_DARK = "#555";

// --- QuickLog Component (No Change) ---
interface QuickLogProps {
  favorites: Food[];
  onQuickAdd: (food: Food) => void;
}

const QuickLog: React.FC<QuickLogProps> = ({ favorites, onQuickAdd }) => (
  <View style={styles.quickLogContainer}>
    <Text style={styles.quickLogHeading}>⚡ Quick Log</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickLogScrollViewContent}
    >
      {favorites.map((food) => (
        <TouchableOpacity
          key={food.id}
          style={styles.pill}
          onPress={() => onQuickAdd(food)}
        >
          <Text style={styles.pillText}>{food.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// --- FoodResultItem Component ---
type FoodResultItemProps = {
  item: Food;
  onPress: (food: Food) => void;
};

const FoodResultItem: React.FC<FoodResultItemProps> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.resultItem} onPress={() => onPress(item)}>
    <View>
      <Text style={styles.resultItemName}>{item.name}</Text>
      {item.englishName ? (
        <Text style={styles.resultItemName}>{item.englishName}</Text>
      ) : null}
      <Text style={styles.resultItemDetails}>
        Serving: {item.servingSize || "N/A"}
      </Text>
    </View>
    <Text style={styles.resultItemActionText}>+</Text>
  </TouchableOpacity>
);

// --- LoggedItem Component (MODIFIED for Edit/Delete) ---
type LoggedItemProps = {
  item: FoodLogEntry;
  onEdit: (entry: FoodLogEntry) => void;
  // Now triggers a callback with the item details to start the removal process in the parent component
  onStartRemove: (entryId: string, foodName: string, quantity: number) => void;
};

const LoggedItem: React.FC<LoggedItemProps> = ({
  item,
  onEdit,
  onStartRemove,
}) => {
  // Local state for modal visibility removed

  const timestamp =
    item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
  const timeString = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleRemovePress = () => {
    // Call the parent handler instead of managing local modal state
    onStartRemove(item.localId, item.food.name, item.quantity);
  };

  return (
    <View style={styles.logItemContainer}>
      <View style={styles.logItemDetailsContainer}>
        <Text style={styles.logItemText}>
          <Text style={styles.logItemQuantity}>{item.quantity}x </Text>
          {item.food.name}
        </Text>
        {item.food.englishName ? (
          <Text style={{ color: "#777" }}>{item.food.englishName}</Text>
        ) : null}
        <Text style={styles.logItemTimestamp}>{timeString}</Text>
      </View>
      <View style={styles.logItemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(item)}
        >
          <Text style={[styles.actionButtonText, { color: PRIMARY_COLOR }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRemovePress} // Triggers parent handler
        >
          <Text style={[styles.actionButtonText, { color: DANGER_RED }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function mapFoodSearchItemToFood(item: FoodDetail): Food {
  const defaultMeasure =
    item.measures?.find((m) => m.is_default === 1) ?? item.measures?.[0];

  const servingSize =
    defaultMeasure?.measure_label && defaultMeasure?.weight_g
      ? `${defaultMeasure.measure_label} (${Number(defaultMeasure.weight_g)}g)`
      : defaultMeasure?.measure_label ?? "1 serving";

  return {
    id: String(item.food_id),
    name: item.filipino_name,
    englishName: item.english_name,
    servingSize,
    nutrients: [
      {
        name: "Calories",
        unit: "kcal",
        amount: Number(item.energy_kcal ?? 0),
      },
      {
        name: "Carbohydrate",
        unit: "g",
        amount: Number(item.carbohydrate_g ?? 0),
      },
      {
        name: "Protein",
        unit: "g",
        amount: Number(item.protein_g ?? 0),
      },
      {
        name: "Fat",
        unit: "g",
        amount: Number(item.fat_g ?? 0),
      },
    ],
  };
}

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
  const [entryToDelete, setEntryToDelete] = useState<{
    id: string;
    foodName: string;
    quantity: number;
  } | null>(null);

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
    const q = search.trim();
    if (!q) return;

    setSearchLoading(true);
    setResults([]);
    setSelectedFood(null);
    setEditingEntry(null);

    try {
      const res = await SearchFoods(q);

      if (!res.success) {
        console.error("Search failed:", res.message);
        setResults([]);
        return;
      }

      const foods = (res.data ?? []).map(mapFoodSearchItemToFood);
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

        await UpdateFoodLog(serverId, {
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

      const res = await AddFoodLogEntry({
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

  // --- NEW HANDLERS FOR MODAL ---
  const handleStartRemove = (
    id: string,
    foodName: string,
    quantity: number
  ) => {
    // Set the data for the item to be deleted, which makes the modal visible
    setEntryToDelete({ id, foodName, quantity });
  };

  const handleConfirmDeletion = () => {
    if (entryToDelete) {
      removeEntry(entryToDelete.id);
      setEntryToDelete(null); // Hide modal
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
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.listEmptyText}>Loading saved log data...</Text>
      </SafeAreaView>
    );
  }

  // Determine modal message
  const modalMessage = entryToDelete
    ? `Are you sure you want to remove ${entryToDelete.foodName} (${entryToDelete.quantity} servings)? This action cannot be undone.`
    : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f7f9" }}>
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
                    onStartRemove={handleStartRemove} // Pass the new handler
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
    backgroundColor: "#f4f7f9",
  },
  contentScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f7f9",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: PRIMARY_COLOR,
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
    backgroundColor: PRIMARY_COLOR,
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

  // --- Quick Log Styles ---
  quickLogContainer: {
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: "#f4f7f9",
  },
  quickLogHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  quickLogScrollViewContent: {
    paddingBottom: 5,
  },
  pill: {
    backgroundColor: "#E0E7FF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#C5D0FF",
  },
  pillText: {
    color: "#0055FF",
    fontWeight: "600",
    fontSize: 14,
  },

  // --- Search Results List Styles ---
  resultsList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
  },
  resultItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  resultItemDetails: {
    fontSize: 12,
    color: GRAY_DARK,
    marginTop: 2,
  },
  resultItemActionText: {
    fontSize: 24,
    color: PRIMARY_COLOR,
    fontWeight: "bold",
  },
  listEmptyText: {
    textAlign: "center",
    color: GRAY_DARK,
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
    backgroundColor: PRIMARY_COLOR,
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
    backgroundColor: ACCENT_COLOR,
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
    backgroundColor: GRAY_DARK,
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
    borderBottomColor: GRAY_LIGHT,
  },
  logItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  logItemDetailsContainer: {
    flex: 1,
    marginRight: 10,
  },
  logItemText: {
    fontSize: 16,
    color: "#333",
  },
  logItemQuantity: {
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  logItemTimestamp: {
    fontSize: 12,
    color: GRAY_DARK,
  },
  // Styles for actions
  logItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
