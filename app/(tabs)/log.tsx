import React, { useState } from "react";
import {
  ActivityIndicator, // Used for better buttons/list items
  FlatList, // To handle notches and safe areas
  Platform, // To show loading state
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Assuming Food, FoodLogEntry, searchFoods, and useFoodLog are correctly imported
import { useFoodLog } from "@/context/FoodLogContext";
import { Food, FoodLogEntry } from "@/models/models";
import { searchFoods } from "@/utils/foodApi";
import { SafeAreaView } from "react-native-safe-area-context";

type FoodResultItemProps = {
  item: Food;
  onPress: (food: Food) => void;
};

// --- Component for a single food item in the search results ---
const FoodResultItem: React.FC<FoodResultItemProps> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.resultItem} onPress={() => onPress(item)}>
    <View>
      <Text style={styles.resultItemName}>{item.name}</Text>
      {/* Assuming item.servingSize exists */}
      <Text style={styles.resultItemDetails}>
        Serving: {item.servingSize || "N/A"}
      </Text>
    </View>
    <Text style={styles.resultItemActionText}>+</Text>
  </TouchableOpacity>
);

type LoggedItemProps = {
  item: FoodLogEntry;
};

// --- Component for a single logged item ---
const LoggedItem: React.FC<LoggedItemProps> = ({ item }) => (
  <View style={styles.logItemContainer}>
    <Text style={styles.logItemText}>
      <Text style={styles.logItemQuantity}>{item.quantity}x </Text>
      {item.food.name}
    </Text>
    {/* Assuming item.food.servingSize exists */}
    <Text style={styles.logItemDetails}>{item.food.servingSize}</Text>
  </View>
);

// --- Main Screen Component ---
export default function LogScreen() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const { log, addEntry } = useFoodLog();

  const handleSearch = async () => {
    if (!search.trim()) return; // Prevent empty search
    setLoading(true);
    // Clear old results while searching
    setResults([]);
    // Ensure the selection view is hidden when starting a new search
    setSelectedFood(null);

    try {
      const foods = await searchFoods(search);
      setResults(foods);
    } catch (error) {
      console.error("Search failed:", error);
      // Optionally show a user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  const addFoodToLog = () => {
    const qty = Number(quantity);
    if (selectedFood && qty > 0) {
      addEntry({ food: selectedFood, quantity: qty });
      // Reset after successful log
      setSelectedFood(null);
      setQuantity("1");
      setSearch("");
      setResults([]); // Clear search results after logging
    }
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    // You might want to scroll to the selection area here
  };

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
            onSubmitEditing={handleSearch} // Search on keyboard 'Go'
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading || !search.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Search Results List --- */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => {
            if (loading) return null;
            if (search.trim() && results.length === 0) {
              return (
                <Text style={styles.listEmptyText}>
                  No results found. Try a different query.
                </Text>
              );
            }
            return null;
          }}
          renderItem={({ item }) => (
            <FoodResultItem item={item} onPress={handleSelectFood} />
          )}
          style={styles.resultsList}
        />

        {/* --- Selected Food & Quantity Input Section --- */}
        {selectedFood && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedHeading}>Log Quantity for:</Text>
            <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>

            <View style={styles.quantityInputGroup}>
              <TextInput
                value={quantity}
                onChangeText={(text) =>
                  setQuantity(text.replace(/[^0-9.]/g, ""))
                } // Only allow numbers
                keyboardType="numeric"
                style={styles.quantityInput}
                placeholder="Qty"
                maxLength={4}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addFoodToLog}
                disabled={Number(quantity) <= 0}
              >
                <Text style={styles.addButtonText}>➕ Add to Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- Today's Log Section --- */}
        <Text style={styles.logHeading}>📝 Today's Log</Text>
        <FlatList
          data={log}
          keyExtractor={(_, idx) => idx.toString()}
          ListEmptyComponent={() => (
            <Text style={styles.listEmptyText}>
              Nothing logged yet. Start searching above!
            </Text>
          )}
          renderItem={({ item }) => <LoggedItem item={item} />}
          style={styles.logList}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
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
    backgroundColor: "#f4f7f9", // Light gray background for the screen
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
      android: {
        elevation: 3,
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    // No border here, the container provides the style
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

  // --- Search Results List Styles ---
  resultsList: {
    maxHeight: 200, // Constrain height for better layout
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

  // --- Selected Food Section Styles ---
  selectedContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: ACCENT_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedHeading: {
    fontSize: 14,
    color: GRAY_DARK,
    marginBottom: 5,
  },
  selectedFoodName: {
    fontSize: 20,
    fontWeight: "700",
    color: ACCENT_COLOR,
    marginBottom: 15,
  },
  quantityInputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityInput: {
    width: 60,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    fontSize: 16,
    marginRight: 10,
    color: "#333",
  },
  addButton: {
    flex: 1,
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // --- Log List Styles ---
  logHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
  },
  logList: {
    flex: 1, // Take up remaining space
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
      android: {
        elevation: 1,
      },
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
