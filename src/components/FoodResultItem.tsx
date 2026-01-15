// src/components/FoodResultItem.tsx
import { Food } from "@/models/models";
import { COLORS } from "@/theme/color";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- FoodResultItem Component ---
type FoodResultItemProps = {
  item: Food;
  onPress: (food: Food) => void;
};

export const FoodResultItem: React.FC<FoodResultItemProps> = ({
  item,
  onPress,
}) => (
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

const styles = StyleSheet.create({
  // --- Food Result Item Styles ---

  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  resultItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  resultItemDetails: {
    fontSize: 12,
    color: COLORS.grayDark,
    marginTop: 2,
  },
  resultItemActionText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: "bold",
  },
});