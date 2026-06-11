// app/(tabs)/_layout.tsx
import StickyTabBar from "@/components/StickyTabBar";
import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

const TabIcon = ({
  name,
  focused,
  focusedColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  focusedColor: string;
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
      <Ionicons
        name={name}
        size={22}
        color={
          focused && focusedColor ? focusedColor : COLORS.tabBarIconInactive
        }
      />
    </View>
  );
};

export const TabLayout = () => {
  return (
    <Tabs
      tabBar={(props) => <StickyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="DashboardPage"
        options={{
          title: "Dashboard",
          tabBarActiveTintColor: COLORS.taguigRed,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="home"
              focused={focused}
              focusedColor={COLORS.taguigRed}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="NutritionPage"
        options={{
          title: "Nutrition",
          tabBarActiveTintColor: COLORS.taguigBlue,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="stats-chart"
              focused={focused}
              focusedColor={COLORS.taguigBlue}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="HistoryPage"
        options={{
          title: "History",
          tabBarActiveTintColor: COLORS.taguigRed,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="calendar"
              focused={focused}
              focusedColor={COLORS.taguigRed}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingsPage"
        options={{
          title: "Settings",
          tabBarActiveTintColor: COLORS.taguigYellow,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="settings"
              focused={focused}
              focusedColor={COLORS.taguigYellow}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreenPage"
        options={{
          title: "Profile",
          tabBarActiveTintColor: COLORS.taguigBlue,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="person"
              focused={focused}
              focusedColor={COLORS.taguigBlue}
            />
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
