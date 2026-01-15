// src/components/FoodResultItem.tsx
import { Food } from "@/models/models";
import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type FoodResultItemProps = {
  item: Food;
  onPress: (food: Food) => void;
};

export const FoodResultItem: React.FC<FoodResultItemProps> = ({
  item,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={() => onPress(item)}
    activeOpacity={0.85}
  >
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      {!!item.englishName && (
        <Text style={styles.eng} numberOfLines={1}>
          {item.englishName}
        </Text>
      )}
      <Text style={styles.meta} numberOfLines={1}>
        {item.servingSize || "1 serving"}
      </Text>
    </View>

    <View style={styles.right}>
      <Ionicons name="add" size={18} color={COLORS.textPrimary} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  eng: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  right: {
    marginLeft: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
});
