// src/components/LoggedItem.tsx
import { FoodLogEntry } from "@/models/models";
import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type LoggedItemProps = {
  item: FoodLogEntry;
  onEdit: (entry: FoodLogEntry) => void;
  onStartRemove: (entry: FoodLogEntry) => void;
};

function getCalories(entry: FoodLogEntry) {
  const cals =
    entry.food.nutrients?.find((n) => n.name === "Calories")?.amount ?? 0;
  return cals * (entry.quantity ?? 1);
}

export const LoggedItem: React.FC<LoggedItemProps> = ({
  item,
  onEdit,
  onStartRemove,
}) => {
  const timestamp =
    item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);

  const timeString = timestamp.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const calories = getCalories(item);

  return (
    <View style={styles.wrap}>
      {/* time label */}
      <Text style={styles.time}>{timeString}</Text>

      <View style={styles.card}>
        {/* image placeholder */}
        <View style={styles.thumb} />

        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {item.quantity} {item.food.name}
          </Text>

          <Text style={styles.sub} numberOfLines={1}>
            {item.food.servingSize || "Serving"} • {Math.round(calories)} kcal
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="options-outline" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* Optional: keep delete accessible (long press on card) */}
        <TouchableOpacity
          onPress={() => onStartRemove(item)}
          style={styles.deleteBtn}
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceBorder,
    marginRight: 10,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  sub: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  iconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
});
