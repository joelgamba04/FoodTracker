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

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import DisclaimerModal from "@/components/DisclaimerModal";
import { FoodLogProvider } from "@/context/FoodLogContext";
import { ProfileProvider } from "@/context/ProfileContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);


  if (!isDisclaimerAccepted) {
    return <DisclaimerModal onAccept={() => setIsDisclaimerAccepted(true)} />;
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <ProfileProvider>
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
        </ProfileProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
