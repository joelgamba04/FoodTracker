import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native"; // Import Platform for OS-specific styling

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// --- Theme Constants for Better Readability ---
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 90 : 65; // Taller for iOS for the home indicator
const TAB_BAR_BACKGROUND = "#ffffff"; // White background (or a deep slate for dark mode)
const INACTIVE_COLOR = "#8e8e93"; // System gray for inactive tabs
const ACTIVE_COLOR_LIGHT = "#007AFF"; // Primary blue tint
const ACTIVE_COLOR_DARK = "#4CD964"; // Primary green tint for dark mode

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Choose active color based on color scheme
  const activeTintColor =
    colorScheme === "dark" ? ACTIVE_COLOR_DARK : ACTIVE_COLOR_LIGHT;

  // Use a slight shadow for a "floating" effect on the tab bar
  const tabShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
    },
    android: {
      elevation: 10,
    },
    default: {},
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        headerShown: false,
        tabBarButton: HapticTab, // Keep your custom haptic button

        // --- Tab Bar Style Enhancements ---
        tabBarStyle: {
          ...tabShadow, // Apply the floating shadow
          backgroundColor: themeColors.background, // Use theme background color
          height: TAB_BAR_HEIGHT,
          borderTopWidth: 0, // Remove the default gray top line
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 30 : 5, // Adjust padding for home indicator on iOS
        },
        // --- Tab Label and Icon Style ---
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      {/* UX Improvement: Use the 'house' icon for a Home/Dashboard feel 
        and give the Log Food button a more action-oriented icon.
      */}
      <Tabs.Screen
        name="log"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Summary", // Food Log is the core action
          tabBarIcon: ({ color }) => (
            // Use a bold, clear icon for logging food/tracking
            <IconSymbol size={26} name="plus.square" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Settings"
        options={{
          title: "RDI", // Use a more user-friendly, descriptive name
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            // Use a specific person/user icon for the profile
            <IconSymbol
              size={26}
              name="person.crop.circle.fill"
              color={color}
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
}
