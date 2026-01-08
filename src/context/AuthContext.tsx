// src/context/AuthContext.tsx

import { useProfile } from "@/context/ProfileContext";
import {
  login as doLogin,
  logout as doLogout,
  getStoredUser,
} from "@/services/authService";
import { syncDraftProfileAfterLogin } from "@/services/profileSyncService";
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

  const { refreshProfile } = useProfile();
  const [didPostLoginSync, setDidPostLoginSync] = useState(false);

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

  // After login, sync draft profile and refresh profile once
  useEffect(() => {
    if (!user || didPostLoginSync) return;

    (async () => {
      try {
        await syncDraftProfileAfterLogin();
        await refreshProfile();
      } finally {
        setDidPostLoginSync(true);
      }
    })();
  }, [user, didPostLoginSync, refreshProfile]);

  const login = async (email: string, password: string) => {
    const u = await doLogin(email, password);
    setUser(u);

    await syncDraftProfileAfterLogin();
    await refreshProfile();
  };

  const logout = async () => {
    await doLogout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthLoading, login, logout }),
    [user, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
