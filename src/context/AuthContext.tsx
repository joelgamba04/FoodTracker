// src/context/AuthContext.tsx

import { AuthContextValue, AuthState } from "@/models/authModel";
import { setAuthFatalHandler } from "@/services/authFatalService";
import {
  login as doLogin,
  logout as doLogout,
  getStoredUser,
} from "@/services/authService";
import { clearTokens } from "@/services/tokenService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    mode: "signed_out",
    user: null,
  });

  // Track auth mode changes for debugging
  useEffect(() => {
    console.log("Auth mode changed:", authState.mode);
  }, [authState.mode]);

  useEffect(() => {
    console.log("AuthContext initializing, checking stored user...");
    (async () => {
      try {
        const stored = await getStoredUser();
        console.log(
          "AuthContext found stored user:",
          stored,
          "authState.mode:",
          authState.mode,
        );
        if (stored && authState.mode !== "guest") {
          setAuthState({
            mode: "authenticated",
            user: stored,
          });
        }
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setAuthFatalHandler(async (reason) => {
      let handling = false;
      if (handling) return;
      handling = true;

      console.error("AUTH FATAL:", reason);

      // clear tokens + any auth state
      await clearTokens();

      // update context state
      setAuthState({
        mode: "signed_out",
        user: null,
      });

      // to login
      router.replace("/login");
    });
  }, []);

  const login = async (email: string, password: string) => {
    console.log("AuthContext, Attempting login for email:", email);
    const u = await doLogin(email, password);

    setAuthState({
      mode: "authenticated",
      user: u,
    });
  };

  const logout = async () => {
    if (authState.mode != "guest") {
      await doLogout();
    }

    await clearTokens();
    await AsyncStorage.clear();
    setAuthState({
      mode: "signed_out",
      user: null,
    });
  };

  const loginAsGuest = async () => {
    await clearTokens();

    setAuthState({
      mode: "guest",
      user: null,
    });

    router.replace("/(tabs)/log");
  };

  const value = useMemo(
    () => ({
      user: authState.user,
      isAuthLoading,
      login,
      logout,
      authMode: authState.mode,
      loginAsGuest,
    }),
    [authState, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
