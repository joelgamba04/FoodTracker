// app/_layout.tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import DisclaimerModal from "@/components/DisclaimerModal";
import InitialProfileScreen from "@/components/InitialProfileScreen";
import PostLoginSync from "@/components/PostLoginSync";

import { PROFILE_CACHE_KEY } from "@/constants/storageKeys";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FoodLogProvider } from "@/context/FoodLogContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { loadJSON } from "@/lib/storage";
import { UserProfile } from "@/models/models";

const DISCLAIMERS = [
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

function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.age && profile.sex && profile.height && profile.weight);
}

function AuthGate() {
  const { user, isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;

    const inAuthGroup = segments?.[0] === "(auth)";

    if (!user && !inAuthGroup) router.replace("/(auth)/login");
    if (user && inAuthGroup) router.replace("/(tabs)");
  }, [user, isAuthLoading, segments, router]);

  if (isAuthLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

/**
 * Bootstraps the app flow INSIDE providers:
 * 1) Disclaimers (always show)
 * 2) Initial Profile (only if local cache is incomplete)
 * 3) Main app (AuthGate + tabs)
 */
function AppBootstrap() {
  const [disclaimerStep, setDisclaimerStep] = useState(0);
  const [profileStatus, setProfileStatus] = useState<
    "checking" | "incomplete" | "complete"
  >("checking");

  const currentDisclaimer = useMemo(
    () => DISCLAIMERS[disclaimerStep],
    [disclaimerStep]
  );

  // load local cached profile once
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadJSON<UserProfile>(PROFILE_CACHE_KEY);
        if (!active) return;
        setProfileStatus(isProfileComplete(stored) ? "complete" : "incomplete");
      } catch (e) {
        console.warn("RootLayout: failed to load cached profile", e);
        if (active) setProfileStatus("incomplete");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 1) Disclaimers: always show in sequence
  if (disclaimerStep < DISCLAIMERS.length) {
    return (
      <DisclaimerModal
        key={currentDisclaimer.id}
        title={currentDisclaimer.title}
        onAccept={() => setDisclaimerStep((prev) => prev + 1)}
      >
        {currentDisclaimer.body}
      </DisclaimerModal>
    );
  }

  // 2) Profile cache check
  if (profileStatus === "checking") {
    // small loading screen while we read AsyncStorage
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  // 3) Initial profile onboarding (before using app)
  if (profileStatus === "incomplete") {
    return (
      <InitialProfileScreen
        key="initial-profile"
        onComplete={() => {
          // InitialProfileScreen should save to PROFILE_CACHE_KEY internally.
          setProfileStatus("complete");
        }}
      />
    );
  }

  // 4) Normal app flow
  return (
    <>
      <PostLoginSync />
      <AuthGate />
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <ProfileProvider>
          <AuthProvider>
            <FoodLogProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <AppBootstrap />
              </ThemeProvider>
            </FoodLogProvider>
          </AuthProvider>
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
