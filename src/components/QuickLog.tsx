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
    <View style={styles.wrap}>
      <Text style={styles.title}>Quick Log</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {favorites.map((food) => (
          <TouchableOpacity
            key={food.id}
            style={styles.pill}
            onPress={() => onQuickAdd(food)}
            activeOpacity={0.85}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {food.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  row: {
    paddingBottom: 2,
  },
  pill: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 10,
    maxWidth: 180,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});
