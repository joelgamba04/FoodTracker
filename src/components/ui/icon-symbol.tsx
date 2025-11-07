// @/components/ui/icon-symbol.tsx (Example using Ionicons)

import React from "react";
// NOTE: For Expo Go, you must use '@expo/vector-icons' instead of 'react-native-vector-icons' directly.
// If you are using Expo, use this:
import { Ionicons } from "@expo/vector-icons";

interface IconProps {
  name: keyof typeof Ionicons.glyphMap; // This ensures TypeScript knows the available names
  size: number;
  color: string;
}

// Map your project's custom names to the Ionicons library names
const iconNameMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Your old names (left) -> New Ionicons names (right)
  "house.fill": "home",
  "plus.circle.fill": "add-circle",
  "chart.bar.fill": "bar-chart",
  gear: "settings",
  "person.crop.circle.fill": "person-circle",
  // Map the new names from the beautified code
  "plus.app.fill": "add-circle",
  // Add other mappings as needed...
};

export const IconSymbol: React.FC<IconProps> = ({ name, size, color }) => {
  // Fallback to the provided name if a mapping doesn't exist
  const finalName =
    iconNameMap[name] || (name as keyof typeof Ionicons.glyphMap);

  return <Ionicons name={finalName} size={size} color={color} />;
};
