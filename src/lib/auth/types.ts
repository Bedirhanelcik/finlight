export interface AppUser {
  id: string;
  email: string;
}

export interface AuthResult {
  error?: string;
}

/**
 * Storage-agnostic auth contract. SupabaseAuthAdapter is the production
 * implementation; LocalAuthAdapter is a local-only fallback (IndexedDB +
 * localStorage) used when Supabase isn't configured, so the full
 * register/login/session/logout flow can still be built and tested end to
 * end without a live backend.
 */
export interface AuthAdapter {
  getUser(): Promise<AppUser | null>;
  onAuthStateChange(callback: (user: AppUser | null) => void): () => void;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  updatePassword(newPassword: string): Promise<AuthResult>;
}
