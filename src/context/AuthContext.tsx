// src/context/AuthContext.tsx

import { setAuthFatalHandler } from "@/services/authFatalService";
import {
  login as doLogin,
  logout as doLogout,
  getStoredUser,
} from "@/services/authService";
import { clearTokens } from "@/services/tokenService";
import { router } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type User = { user_id: number; email: string };

type AuthContextValue = {
  user: User | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredUser();
        setUser(stored);
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setAuthFatalHandler(async (reason) => {
      console.error("AUTH FATAL:", reason);

      // clear tokens + any auth state
      await clearTokens();

      // update context state
      setUser(null);
      setIsAuthenticated(false);

      // to login
      router.replace("/login");
    });
  }, []);

  const login = async (email: string, password: string) => {
    const u = await doLogin(email, password);
    setUser(u);
  };

  const logout = async () => {
    await doLogout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthLoading, login, logout }),
    [user, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
