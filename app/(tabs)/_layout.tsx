// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "#FFFFFF" : "transparent",
      }}
    >
      <Ionicons name={name} size={22} color={focused ? "#000000" : "#FFFFFF"} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // key sizing
  const BAR_HEIGHT = 66; // height of the black pill
  const H_PADDING = 44; // horizontal inset from screen edges

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // remove default label
        tabBarShowLabel: false,

        // the black "pill" container
        tabBarStyle: {
          position: "absolute",
          left: H_PADDING,
          right: H_PADDING,
          bottom: Math.max(insets.bottom, 12), // keeps it above gesture/nav areas
          height: BAR_HEIGHT,
          borderRadius: 999,
          backgroundColor: "#000000",

          // subtle elevation/shadow
          ...Platform.select({
            android: { elevation: 10 },
            ios: {
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
            },
          }),

          // reduce border line iOS sometimes shows
          borderTopWidth: 0,
        },

        // item spacing
        tabBarItemStyle: {
          height: BAR_HEIGHT,
          paddingVertical: 10,
        },

        // keep icons centered
        tabBarIconStyle: {
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="log"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bar-chart" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreen"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hides the tab
        }}
      />
    </Tabs>
  );
}
