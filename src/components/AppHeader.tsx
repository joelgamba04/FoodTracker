// src/components/AppHeader.tsx

import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode; // Optional component to render on the right side of the header (e.g., a settings icon) for future extensibility
}

export const AppHeader = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightComponent,
}: AppHeaderProps) => {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable onPress={handleBack} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.iconPrimary} />
          <Text style={styles.headerBtnText}>Back</Text>
        </Pressable>
      ) : (
        <></>
      )}

      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSlot}>
        {rightComponent ?? <View style={styles.rightPlaceholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtnText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "left",
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  rightSlot: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  rightPlaceholder: {
    width: 60,
  },
});

export default AppHeader;
