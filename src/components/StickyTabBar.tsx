// src/components/StickyTabBar.tsx
import { COLORS } from "@/theme/color";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type ItemLayout = { x: number; width: number };

const BAR_H = 64;
const INNER_H = 50;
const PAD = 10;

export default function StickyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
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
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} />

        {visibleRoutes.map((route, vIndex) => {
          const { options } = descriptors[route.key];
          const isFocused = vIndex === activeVisibleIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconEl = options.tabBarIcon
            ? options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? "#000" : "#FFF",
                size: 22,
              })
            : null;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLayout={onItemLayout(vIndex)}
              style={styles.item}
            >
              <View style={styles.itemInner}>{iconEl}</View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: PAD,
    overflow: "hidden",
  },
  pill: {
    position: "absolute",
    left: 0,
    height: INNER_H,
    borderRadius: INNER_H / 2,
    backgroundColor: "#fff",
  },
  item: {
    flex: 1,
    height: INNER_H,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  itemInner: {
    width: INNER_H,
    height: INNER_H,
    borderRadius: INNER_H / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
