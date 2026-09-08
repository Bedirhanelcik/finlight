import { openDB, type IDBPDatabase } from "idb";
import type { AppUser, AuthAdapter, AuthResult } from "./types";

const DB_NAME = "finlight-local-auth-db";
const DB_VERSION = 1;
const SESSION_KEY = "finlight-local-session-user-id";

/** Synchronous read of the active local session's user id, if any. Used by
 * the IndexedDB data repository to scope queries without an async round-trip. */
export function getLocalSessionUserIdSync(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

interface LocalAuthUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface LocalAuthDBSchema {
  users: LocalAuthUser;
}

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("users")) {
          const store = db.createObjectStore("users", { keyPath: "id" });
          store.createIndex("by-email", "email", { unique: true });
        }
      },
    });
  }
  return dbPromise as Promise<IDBPDatabase<LocalAuthDBSchema & { users: LocalAuthUser }>>;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Dev-only, local-first auth fallback used when Supabase isn't configured.
 * Stores accounts (salted-free SHA-256 password hash - fine for local dev,
 * never used in production) in IndexedDB and tracks the active session in
 * localStorage. Mirrors the AuthAdapter contract exactly so the rest of the
 * app never has to know which backend is active.
 */
export class LocalAuthAdapter implements AuthAdapter {
  private listeners = new Set<(user: AppUser | null) => void>();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === SESSION_KEY) {
          this.getUser().then((user) => this.notify(user));
        }
      });
    }
  }

  private notify(user: AppUser | null) {
    this.listeners.forEach((cb) => cb(user));
  }

  private getSessionUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  private setSessionUserId(id: string | null) {
    if (typeof window === "undefined") return;
    try {
      if (id) window.localStorage.setItem(SESSION_KEY, id);
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // localStorage unavailable (private mode); session just won't persist.
    }
  }

  async getUser(): Promise<AppUser | null> {
    const id = this.getSessionUserId();
    if (!id) return null;
    const db = await getDB();
    const record = await db.get("users", id);
    if (!record) return null;
    return { id: record.id, email: record.email };
  }

  onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const normalized = normalizeEmail(email);
    const db = await getDB();
    const tx = db.transaction("users", "readwrite");
    const existing = await tx.store.index("by-email").get(normalized);
    if (existing) {
      await tx.done;
      return { error: "An account with this email already exists. Try logging in instead." };
    }
    const user: LocalAuthUser = {
      id: crypto.randomUUID(),
      email: normalized,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await tx.store.put(user);
    await tx.done;
    this.setSessionUserId(user.id);
    this.notify({ id: user.id, email: user.email });
    return {};
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const normalized = normalizeEmail(email);
    const db = await getDB();
    const record = await db.getFromIndex("users", "by-email", normalized);
    if (!record) {
      return { error: "That email or password isn't right. Try again." };
    }
    const hash = await hashPassword(password);
    if (hash !== record.passwordHash) {
      return { error: "That email or password isn't right. Try again." };
    }
    this.setSessionUserId(record.id);
    this.notify({ id: record.id, email: record.email });
    return {};
  }

  async signOut(): Promise<void> {
    this.setSessionUserId(null);
    this.notify(null);
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    const id = this.getSessionUserId();
    if (!id) return { error: "You need to be logged in to change your password." };
    const db = await getDB();
    const record = await db.get("users", id);
    if (!record) return { error: "You need to be logged in to change your password." };
    record.passwordHash = await hashPassword(newPassword);
    await db.put("users", record);
    return {};
  }
}
