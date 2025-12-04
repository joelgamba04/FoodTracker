import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import DisclaimerModal from "@/components/DisclaimerModal";
import InitialProfileScreen from "@/components/InitialProfileScreen";
import { FoodLogProvider } from "@/context/FoodLogContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { StepProvider } from "@/context/StepContext";

import { loadJSON } from "@/lib/storage";
import { UserProfile } from "@/models/models";
import { USER_PROFILE_KEY } from "@/utils/profileUtils";

export const unstable_settings = {
  anchor: "(tabs)",
};

const disclaimers = [
  {
    id: "health",
    title: "Important Health Disclaimer",
    body: (
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 20 }}>
        This app is intended for use by healthy adult males and females, aged
        19–59, who are residents of Taguig City and have no underlying medical
        comorbidities such as diabetes, hypertension, etc.
        {"\n\n"}
        It is not a substitute for professional medical advice, diagnosis, or
        treatment. Always seek the advice of a qualified healthcare provider
        with any questions you may have regarding a medical condition or
        treatment, especially if you have pre-existing health issues (e.g.,
        diabetes, hypertension, kidney disease) or are taking medication.
        {"\n\n"}
        The RDI recommendations provided in the profile section are simplified
        adjustments and must be verified by a medical professional.
        {"\n\n"}
        By accepting this disclaimer, you acknowledge that you are a healthy
        individual and understand the limitations of this tool. If you are
        unwell or have any health concerns, do not proceed without consulting a
        doctor.
      </Text>
    ),
  },
  {
    id: "sources",
    title: "Data Sources Disclaimer",
    body: (
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 20 }}>
        This application, &quot;Taguig NutriApp,&quot; uses data sourced solely
        from the Philippine Dietary Reference Intakes (PDRI) 2015 (Revised
        September 2018, published by the Food and Nutrition Research
        Institute–Department of Science and Technology) and the Food Exchange
        Lists for Meal Planning, 4th Edition (2019), also published by
        DOST-FNRI.
      </Text>
    ),
  },
];

const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  if (!profile.age || !profile.sex || !profile.height || !profile.weight)
    return false;
  return true;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [step, setStep] = useState(0);
  const [profileStatus, setProfileStatus] = useState<
    "checking" | "incomplete" | "complete"
  >("checking");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadJSON<UserProfile>(USER_PROFILE_KEY);
        if (!active) return;

        if (isProfileComplete(stored)) {
          setProfileStatus("complete");
        } else {
          setProfileStatus("incomplete");
        }
      } catch (e) {
        console.warn("RootLayout: failed to load user profile", e);
        if (active) setProfileStatus("incomplete");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  //disclaimer flow
  if (step < disclaimers.length) {
    const current = disclaimers[step];
    return (
      <DisclaimerModal
        key={current.id} // 🔑 force a fresh instance for each step
        title={current.title}
        onAccept={() => setStep((prev) => prev + 1)}
      >
        {current.body}
      </DisclaimerModal>
    );
  }

  if (profileStatus === "checking") {
    // small loading screen while we read AsyncStorage
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  if (profileStatus === "incomplete") {
    // Show profile onboarding once, then go to app
    return (
      <InitialProfileScreen
        key="initial-profile"
        onComplete={(_profile) => {
          // profile already saved inside InitialProfileScreen
          setProfileStatus("complete");
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <ProfileProvider>
          <FoodLogProvider>
            <StepProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </StepProvider>
          </FoodLogProvider>
        </ProfileProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
  },
});