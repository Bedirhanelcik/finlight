import { getSupabaseBrowserClient } from "../supabase/client";
import type { AppUser, AuthAdapter, AuthResult } from "./types";

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "That email or password isn't right. Try again.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }
  if (lower.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

function toAppUser(user: { id: string; email?: string | null } | null): AppUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

export class SupabaseAuthAdapter implements AuthAdapter {
  async getUser(): Promise<AppUser | null> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return toAppUser(data.user);
  }

  onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(toAppUser(session?.user ?? null));
    });
    return () => subscription.unsubscribe();
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: friendlyAuthError(error.message) };
    return {};
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error.message) };
    return {};
  }

  async signOut(): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: friendlyAuthError(error.message) };
    return {};
  }
}
