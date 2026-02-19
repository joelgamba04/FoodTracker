import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ---------- animated metric card ----------
export const AnimatedMetricCard = ({
  title,
  value,
  subtitle,
  icon,
  onPress,
  disabled,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
}) => {
  const press = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const handlePressIn = () => {
    press.value = withTiming(0.98, {
      duration: 90,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePressOut = () => {
    press.value = withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.cubic),
    });
  };

  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Animated.View
      entering={FadeInDown.duration(260).springify()}
      style={styles.gridItem}
    >
      <Animated.View style={[styles.card, rStyle]}>
        <Wrapper
          onPress={disabled ? undefined : onPress}
          onPressIn={disabled ? undefined : handlePressIn}
          onPressOut={disabled ? undefined : handlePressOut}
          style={{ flex: 1 }}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Ionicons name={icon} size={18} color={COLORS.iconPrimary} />
          </View>

          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </Wrapper>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gridItem: {
    width: "50%",
    padding: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 12, fontWeight: "700", opacity: 0.7 },
  cardValue: { fontSize: 26, fontWeight: "900", color: COLORS.textPrimary },
  cardSubtitle: { marginTop: 6, fontSize: 12, opacity: 0.65 },
});
