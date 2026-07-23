"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch, readApiError } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const meResponse = await apiFetch("/api/auth/me", {
        cache: "no-store",
      });

      if (meResponse.ok) {
        const currentUser = (await meResponse.json()) as AuthUser;
        setUser(currentUser);
        setStatus("authenticated");
        return currentUser;
      }

      if (meResponse.status !== 401) {
        setUser(null);
        setStatus("unauthenticated");
        return null;
      }

      const refreshResponse = await apiFetch("/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
      });

      if (!refreshResponse.ok) {
        setUser(null);
        setStatus("unauthenticated");
        return null;
      }

      const data = (await refreshResponse.json()) as AuthResponse;
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    } catch (error) {
      console.error("Could not restore authentication session:", error);
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "The email or password is incorrect.")
        );
      }

      const data = (await response.json()) as AuthResponse;
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    },
    []
  );

  const register = useCallback(
    async (
      fullName: string,
      email: string,
      password: string
    ): Promise<AuthUser> => {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "The account could not be created.")
        );
      }

      const data = (await response.json()) as AuthResponse;
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, status, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
