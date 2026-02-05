// src/models/authModel.ts

export type AuthModeType = "guest" | "authenticated" | "signed_out";

export interface AuthState {
  mode: AuthModeType;
  user: User | null;
}

export type User = { user_id: number; email: string };

export type AuthContextValue = {
  authMode: AuthModeType;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
};
