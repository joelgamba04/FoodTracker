// src/components/StickyTabBar.tsx
import { COLORS } from "@/theme/color";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";

type ItemLayout = { x: number; width: number };

export default function StickyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const layouts = useRef<Record<number, ItemLayout>>({});
  const [ready, setReady] = useState(false);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const activeIndex = state.index;
  const prevIndexRef = useRef(activeIndex);

  const onItemLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      layouts.current[index] = { x, width };

      const allMeasured =
        Object.keys(layouts.current).length === state.routes.length;

      if (allMeasured && !ready) {
        const cur = layouts.current[state.index];
        if (cur) {
          pillX.value = cur.x;
          pillW.value = cur.width;
          setReady(true);
        }
      }
    },
    [ready, pillW, pillX, state.index, state.routes.length]
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
        withTiming(next.x, { duration: 220, easing: Easing.out(Easing.cubic) })
      );

      pillW.value = withSequence(
        withTiming(bridgeWidth, { duration: 1 }),
        withTiming(next.width, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        })
      );
    },
    [pillW, pillX]
  );

  React.useEffect(() => {
    if (!ready) return;
    animateToIndex(activeIndex);
  }, [activeIndex, animateToIndex, ready]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} />

        {state.routes.map((route, index) => {
            if (route.name === "index")
              return null;

          const { options } = descriptors[route.key];

          // ✅ IMPORTANT: Expo Router hidden routes still appear in state.routes.
          // Skip anything that is hidden via href: null.
          if ((options as any)?.href === null) return null;

          const isFocused = state.index === index;

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

          // ✅ Use the icon provided by Tabs.Screen options.tabBarIcon
          // Fallback: if not provided, show nothing (or you can map defaults here).
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
              onLayout={onItemLayout(index)}
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
const BAR_H = 64; // overall black capsule height
const INNER_H = 50; // height of each tappable slot + white pill
const PAD = 10; // inner horizontal padding

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2, // ✅ perfect capsule
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: PAD,
    overflow: "hidden",
  },
  pill: {
    position: "absolute",
    left: PAD,
    height: INNER_H,
    borderRadius: INNER_H / 2, // ✅ perfect capsule (also when stretched)
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
    borderRadius: INNER_H / 2, // ✅ perfect circle
    justifyContent: "center",
    alignItems: "center",
  },
});