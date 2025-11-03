import React, { useCallback, useEffect, useState } from "react";
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
// ✅ UPDATED IMPORTS: We no longer import FoodLogProvider here.
import { useFoodLog } from "@/context/FoodLogContext";
import { Food, FoodLogEntry } from "@/models/models";
import { getFavoriteFoods, searchFoods } from "@/utils/foodApi";
// =================================================================

// --- QuickLog Component ---
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
      <Text style={styles.resultItemDetails}>
        Serving: {item.servingSize || "N/A"}
      </Text>
    </View>
    <Text style={styles.resultItemActionText}>+</Text>
  </TouchableOpacity>
);

// --- LoggedItem Component ---
type LoggedItemProps = {
  item: FoodLogEntry;
};

const LoggedItem: React.FC<LoggedItemProps> = ({ item }) => {
  // Format the time for display, handling Date objects
  const timestamp =
    item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
  const timeString = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.logItemContainer}>
      <Text style={styles.logItemText}>
        <Text style={styles.logItemQuantity}>{item.quantity}x </Text>
        {item.food.name}
      </Text>
      <Text style={styles.logItemDetails}>{timeString}</Text>
    </View>
  );
};

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
  const [favorites, setFavorites] = useState<Food[]>([]);

  // ✅ Get state and actions from the context
  const { log, addEntry, isLoading: isLogLoading } = useFoodLog();

  // Load Favorites on Mount
  useEffect(() => {
    async function loadFavorites() {
      try {
        const favs = await getFavoriteFoods();
        setFavorites(favs);
      } catch (error) {
        console.error("Failed to load favorites:", error);
      }
    }
    loadFavorites();
  }, []);

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
    if (!search.trim()) return;
    setSearchLoading(true);
    setResults([]);
    setSelectedFood(null);

    try {
      const foods = await searchFoods(search);
      setResults(foods);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addFoodToLog = () => {
    const qty = Number(quantity);
    if (selectedFood && qty > 0) {
      // Add the entry, including the current timestamp
      // Type assertion added for compatibility with FoodLogEntry definition
      addEntry({
        food: selectedFood,
        quantity: qty,
        timestamp: new Date(),
      } as FoodLogEntry);

      // Reset after successful log
      setSelectedFood(null);
      setQuantity("1");
      setSearch("");
      setResults([]); // Clear search results after logging
    }
  };

  // Unified handler for QuickLog and SearchResult tap
  const handleSelectFood = useCallback((foodItem: Food) => {
    setSelectedFood(foodItem);
    setQuantity("1"); // Reset quantity when new food is selected
    setResults([]);
    setSearch("");
  }, []);

  // Determine which main content area to show
  const isSearching = !!search.trim() && !searchLoading;
  const isShowingResults = results.length > 0 && !selectedFood;
  const isShowingLoggedFood = log.length > 0;

  // Show global loading state while log data is being loaded from local storage
  if (isLogLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.listEmptyText}>Loading saved log data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f7f9" }}>
      <View style={styles.container}>
        <Text style={styles.heading}>🍽️ Log Your Meal</Text>

        {/* --- Food Search Section --- */}
        <View style={styles.searchBarContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for food, e.g., 'apple', 'egg'"
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
        {!isSearching && !selectedFood && (
          <QuickLog favorites={favorites} onQuickAdd={handleSelectFood} />
        )}

        {/* --- Main Scrollable Content Area --- */}
        <ScrollView
          style={styles.contentScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Selected Food & Quantity Input Section --- */}
          {selectedFood && (
            <View style={styles.selectedFoodContainer}>
              <Text style={styles.selectedFoodTitle}>
                Add {selectedFood.name}
              </Text>
              <Text style={styles.selectedFoodDetails}>
                Serving: {selectedFood.servingSize}
              </Text>

              {/* QUANTITY CONTROL SECTION */}
              <View style={styles.quantityControl}>
                {/* Minus Button */}
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => adjustQuantity(-1)}
                  disabled={Number(quantity) <= 1} // Disable when quantity is 1
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
                onPress={addFoodToLog}
                disabled={Number(quantity) <= 0}
              >
                <Text style={styles.logButtonText}>
                  Log {selectedFood.name}
                </Text>
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

          {/* --- Today's Log Section (Default view) --- */}
          {!isShowingResults && !selectedFood && (
            <>
              <Text style={styles.logHeading}>📝 Today's Log</Text>
              {isShowingLoggedFood ? (
                log.map((item, idx) => <LoggedItem key={idx} item={item} />)
              ) : (
                <Text style={styles.listEmptyText}>
                  Nothing logged yet. Start searching or use Quick Log!
                </Text>
              )}
            </>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =================================================================
// --- Stylesheet ---
// =================================================================

const PRIMARY_COLOR = "#007AFF"; // Blue
const ACCENT_COLOR = "#4CD964"; // Green
const GRAY_LIGHT = "#e8e8e8";
const GRAY_DARK = "#555";

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
  // New Styles for Quantity Control
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
    marginTop: 20,
    alignItems: "center",
  },
  logButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
  logItemText: {
    fontSize: 16,
    color: "#333",
  },
  logItemQuantity: {
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  logItemDetails: {
    fontSize: 12,
    color: GRAY_DARK,
  },
});
