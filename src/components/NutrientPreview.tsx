import { Food, Nutrient } from "@/src/models/models";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface NutrientPreviewProps {
  food: Food;
  quantity: number;
}

const NutrientPreview: React.FC<NutrientPreviewProps> = ({
  food,
  quantity,
}) => {
  if (quantity <= 0 || !food.nutrients || food.nutrients.length === 0) {
    return null;
  }

  // Filter for key nutrients (Macros + Calories) for a concise preview
  const keyNutrients = food.nutrients.filter((n) =>
    ["Calories", "Protein", "Carbohydrate", "Fat"].includes(n.name)
  );

  return (
    <View style={previewStyles.container}>
      <Text style={previewStyles.heading}>
        Nutritional Impact ({food.servingSize})
      </Text>
      <View style={previewStyles.grid}>
        {keyNutrients.map((nutrient: Nutrient) => (
          <View key={nutrient.name} style={previewStyles.item}>
            <Text style={previewStyles.value}>
              {(nutrient.amount * quantity).toFixed(
                nutrient.name === "Calories" ? 0 : 1
              )}
            </Text>
            <Text style={previewStyles.label}>
              {nutrient.unit} {nutrient.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const previewStyles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    width: "48%", // Allows two items per row
    marginBottom: 8,
    alignItems: "center",
    paddingVertical: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: "900",
    color: "#007AFF", // Primary Blue
  },
  label: {
    fontSize: 12,
    color: "#555",
  },
});

export default NutrientPreview;