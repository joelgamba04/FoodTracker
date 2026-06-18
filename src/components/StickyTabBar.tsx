// src/components/StickyTabBar.tsx
import { COLORS } from "@/theme/color";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ItemLayout = { x: number; width: number };

const BAR_H = 66;
const CENTER_SIZE = 58;
const PAD = 8;

export const StickyTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Build visible routes first (same rule as render)
  const visibleRoutes = useMemo(() => {
    return state.routes.filter((r) => {
      const options = descriptors[r.key]?.options;
      if (r.name === "index") return false;
      if ((options as any)?.href === null) return false;
      return true;
    });
  }, [state.routes, descriptors]);

  // Map nav active route -> visible index
  const activeVisibleIndex = useMemo(() => {
    const activeKey = state.routes[state.index]?.key;
    const idx = visibleRoutes.findIndex((r) => r.key === activeKey);
    return idx >= 0 ? idx : 0;
  }, [state.index, state.routes, visibleRoutes]);

  const layouts = useRef<Record<number, ItemLayout>>({});
  const [ready, setReady] = useState(false);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const prevIndexRef = useRef(activeVisibleIndex);

  const onItemLayout = useCallback(
    (vIndex: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      layouts.current[vIndex] = { x, width };

      const allMeasured =
        Object.keys(layouts.current).length === visibleRoutes.length;

      if (allMeasured && !ready) {
        const cur = layouts.current[activeVisibleIndex];
        if (cur) {
          pillX.value = cur.x;
          pillW.value = cur.width;
          setReady(true);
        }
      }
    },
    [activeVisibleIndex, ready, pillW, pillX, visibleRoutes.length],
  );

  const animateToIndex = useCallback(
    (nextIndex: number) => {
      const prevIndex = prevIndexRef.current;
      prevIndexRef.current = nextIndex;

      const prev = layouts.current[prevIndex];
      const next = layouts.current[nextIndex];
      if (!prev || !next) return;

      const left = Math.min(prev.x, next.x);
      const right = Math.max(prev.x + prev.width, next.x + next.width);
      const bridgeWidth = right - left;

      pillX.value = withTiming(left, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      });
      pillW.value = withTiming(bridgeWidth, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      });

      pillX.value = withSequence(
        withTiming(left, { duration: 1 }),
        withTiming(next.x, { duration: 220, easing: Easing.out(Easing.cubic) }),
      );
      pillW.value = withSequence(
        withTiming(bridgeWidth, { duration: 1 }),
        withTiming(next.width, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        }),
      );
    },
    [pillW, pillX],
  );

  React.useEffect(() => {
    if (!ready) return;
    animateToIndex(activeVisibleIndex);
  }, [activeVisibleIndex, animateToIndex, ready]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom + 12, backgroundColor: COLORS.white },
      ]}
    >
      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} />

        {visibleRoutes.map((route, vIndex) => {
          const { options } = descriptors[route.key];
          const isFocused = vIndex === activeVisibleIndex;

          const onPress = () => {
            if (route.name === "add") {
              router.push("/AddFoodPage");
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const activeColor =
            options.tabBarActiveTintColor?.toString() ?? COLORS.taguigRed;

          const inactiveColor =
            options.tabBarInactiveTintColor?.toString() ??
            COLORS.tabBarIconInactive;

          const tabColor = isFocused ? activeColor : inactiveColor;

          const iconEl = options.tabBarIcon
            ? options.tabBarIcon({
                focused: isFocused,
                color: tabColor,
                size: route.name === "add" ? 30 : 22,
              })
            : null;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLayout={onItemLayout(vIndex)}
              style={styles.item}
            >
              <View
                style={[
                  styles.itemInner,
                  route.name === "add" && styles.centerButton,
                ]}
              >
                {iconEl}
              </View>

              {route.name !== "add" && (
                <Text
                  style={[styles.label, { color: tabColor }]}
                  numberOfLines={1}
                >
                  {options.title ?? route.name}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
  },
  bar: {
    height: BAR_H,
    borderRadius: 34,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: PAD,
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  pill: {
    display: "none",
  },

  item: {
    flex: 1,
    height: BAR_H,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  itemInner: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  centerButton: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: COLORS.taguigRed,
    marginTop: -28,
    shadowColor: COLORS.black,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  label: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.tabBarIconInactive,
  },
});

export default StickyTabBar;
