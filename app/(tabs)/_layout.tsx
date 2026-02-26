// app/(tabs)/_layout.tsx
import StickyTabBar from "@/components/StickyTabBar";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon = ({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) => {
  return (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <Ionicons name={name} size={22} color={focused ? "#000000" : "#FFFFFF"} />
    </View>
  );
};

export const TabLayout = () => {
  const insets = useSafeAreaInsets();

  // key sizing
  const BAR_HEIGHT = 66; // height of the black pill
  const H_PADDING = 44; // horizontal inset from screen edges

  return (
    <Tabs
      tabBar={(props) => <StickyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="DashboardPage"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="NutritionPage"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="stats-chart" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="HistoryPage"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingsPage"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreenPage"
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
};

export default TabLayout;
