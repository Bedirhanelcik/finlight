import { getLocalSessionUserIdSync } from "../auth/local-auth-adapter";
import { isSupabaseConfigured } from "../supabase/config";
import { IndexedDBFinanceRepository } from "./indexeddb-repository";
import { SupabaseFinanceRepository } from "./supabase-repository";
import type { FinanceRepository } from "./types";

let repository: FinanceRepository | null = null;

export function getRepository(): FinanceRepository {
  if (!repository) {
    repository = isSupabaseConfigured()
      ? new SupabaseFinanceRepository()
      : new IndexedDBFinanceRepository(getLocalSessionUserIdSync);
  }
  return repository;
}

export type { FinanceRepository } from "./types";
