// src/models/authModel.ts

import {
  AUTHENTICATED_AUTH_MODE,
  GUEST_AUTH_MODE,
  SIGNED_OUT_AUTH_MODE,
} from "@/constants/authModeConstants";

export type AuthModeType =
  | typeof GUEST_AUTH_MODE
  | typeof AUTHENTICATED_AUTH_MODE
  | typeof SIGNED_OUT_AUTH_MODE;

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
