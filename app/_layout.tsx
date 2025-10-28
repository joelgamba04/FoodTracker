import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import DisclaimerModal from "@/components/DisclaimerModal";
import { FoodLogProvider } from "@/context/FoodLogContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);

  const handleDisclaimerAccept = () => {
    setIsDisclaimerAccepted(true);
  };

  if (!isDisclaimerAccepted) {
    return <DisclaimerModal onAccept={handleDisclaimerAccept} />;
  }

  return (
    <SafeAreaProvider>
      <FoodLogProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </FoodLogProvider>
    </SafeAreaProvider>
  );
}
