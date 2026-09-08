"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAuthAdapter } from "@/lib/auth";
import type { AppUser } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AppUser | null;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AppUser | null>(null);
  const adapter = useMemo(() => getAuthAdapter(), []);

  useEffect(() => {
    let cancelled = false;
    adapter.getUser().then((initialUser) => {
      if (cancelled) return;
      setUser(initialUser);
      setStatus(initialUser ? "authenticated" : "unauthenticated");
    });

    const unsubscribe = adapter.onAuthStateChange((nextUser) => {
      if (cancelled) return;
      setUser(nextUser);
      setStatus(nextUser ? "authenticated" : "unauthenticated");
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [adapter]);

  const signUp = useCallback(
    (email: string, password: string) => adapter.signUp(email, password),
    [adapter],
  );

  const signIn = useCallback(
    (email: string, password: string) => adapter.signIn(email, password),
    [adapter],
  );

  const signOut = useCallback(async () => {
    await adapter.signOut();
  }, [adapter]);

  const updatePassword = useCallback(
    (newPassword: string) => adapter.updatePassword(newPassword),
    [adapter],
  );

  const value: AuthContextValue = {
    status,
    user,
    signUp,
    signIn,
    signOut,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
