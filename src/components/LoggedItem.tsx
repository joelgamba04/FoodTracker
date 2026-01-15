// src/components/LoggedItem.tsx
import { FoodLogEntry } from "@/models/models";
import { COLORS } from "@/theme/color";
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
  // Now triggers a callback with the item details to start the removal process in the parent component
  onStartRemove: (entry: FoodLogEntry) => void;
};

export const LoggedItem: React.FC<LoggedItemProps> = ({
  item,
  onEdit,
  onStartRemove,
}) => {
  const timestamp =
    item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
  const timeString = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleRemovePress = () => {
    // Call the parent handler instead of managing local modal state
    onStartRemove(item);
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
          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRemovePress} // Triggers parent handler
        >
          <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: COLORS.primary,
  },
  logItemTimestamp: {
    fontSize: 12,
    color: COLORS.grayDark,
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