import { isSupabaseConfigured } from "../supabase/config";
import { LocalAuthAdapter } from "./local-auth-adapter";
import { SupabaseAuthAdapter } from "./supabase-auth-adapter";
import type { AuthAdapter } from "./types";

let adapter: AuthAdapter | null = null;

export function getAuthAdapter(): AuthAdapter {
  if (!adapter) {
    adapter = isSupabaseConfigured() ? new SupabaseAuthAdapter() : new LocalAuthAdapter();
  }
  return adapter;
}

export type { AppUser, AuthAdapter, AuthResult } from "./types";
