// src/components/QuickLog.tsx
import { Food } from "@/models/models";
import { COLORS } from "@/theme/color";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface QuickLogProps {
  favorites: Food[];
  onQuickAdd: (food: Food) => void;
}

export const QuickLog: React.FC<QuickLogProps> = ({
  favorites,
  onQuickAdd,
}) => {
  if (!favorites.length) return null;

  return (
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
};

const styles = StyleSheet.create({
  quickLogContainer: {
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: COLORS.bg,
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
});
