import { getDB } from "../db/connection";
import type { LocalRecord } from "../db/schema";
import { generateId } from "../id";
import { computeNextOccurrence } from "../recurring";
import type {
  Budget,
  BudgetInput,
  ExportBundle,
  RecurringExpense,
  RecurringExpenseInput,
  Transaction,
  TransactionInput,
  UserSettings,
} from "../types";
import type { FinanceRepository } from "./types";

const EXPORT_VERSION = 1;

function nowIso(): string {
  return new Date().toISOString();
}

function stripUserId<T>(record: LocalRecord<T>): T {
  const { userId, ...rest } = record;
  void userId;
  return rest as T;
}

function defaultSettings(userId: string): UserSettings {
  const ts = nowIso();
  return {
    id: userId,
    currency: "TRY",
    theme: "system",
    onboardingCompleted: false,
    createdAt: ts,
    updatedAt: ts,
  };
}

/**
 * Local development fallback for FinanceRepository, backed by IndexedDB and
 * scoped per local auth user (see lib/auth/local-auth-adapter.ts) so
 * multiple accounts in the same browser stay fully isolated, mirroring how
 * Row Level Security isolates users in the Supabase implementation.
 */
export class IndexedDBFinanceRepository implements FinanceRepository {
  constructor(private readonly getUserId: () => string | null) {}

  private requireUserId(): string {
    const id = this.getUserId();
    if (!id) throw new Error("No authenticated user for local data access.");
    return id;
  }

  async init(): Promise<void> {
    await getDB();
  }

  async getTransactions(): Promise<Transaction[]> {
    const db = await getDB();
    const userId = this.requireUserId();
    const all = await db.getAllFromIndex("transactions", "by-user", userId);
    return all.map(stripUserId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const db = await getDB();
    const userId = this.requireUserId();
    const record = await db.get("transactions", id);
    if (!record || record.userId !== userId) return undefined;
    return stripUserId(record);
  }

  async addTransaction(input: TransactionInput): Promise<Transaction> {
    const db = await getDB();
    const userId = this.requireUserId();
    const ts = nowIso();
    const record: LocalRecord<Transaction> = {
      ...input,
      id: generateId(),
      createdAt: ts,
      updatedAt: ts,
      userId,
    };
    await db.put("transactions", record);
    return stripUserId(record);
  }

  async addTransactions(inputs: TransactionInput[]): Promise<Transaction[]> {
    const db = await getDB();
    const userId = this.requireUserId();
    const ts = nowIso();
    const records: LocalRecord<Transaction>[] = inputs.map((input) => ({
      ...input,
      id: generateId(),
      createdAt: ts,
      updatedAt: ts,
      userId,
    }));
    const tx = db.transaction("transactions", "readwrite");
    await Promise.all(records.map((r) => tx.store.put(r)));
    await tx.done;
    return records.map(stripUserId);
  }

  async updateTransaction(
    id: string,
    patch: Partial<TransactionInput>,
  ): Promise<Transaction> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.get("transactions", id);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Transaction ${id} not found`);
    }
    const updated: LocalRecord<Transaction> = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    };
    await db.put("transactions", updated);
    return stripUserId(updated);
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.get("transactions", id);
    if (!existing || existing.userId !== userId) return;
    await db.delete("transactions", id);
  }

  async getBudgets(): Promise<Budget[]> {
    const db = await getDB();
    const userId = this.requireUserId();
    const all = await db.getAllFromIndex("budgets", "by-user", userId);
    return all.map(stripUserId);
  }

  async addBudget(input: BudgetInput): Promise<Budget> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.getAllFromIndex("budgets", "by-user-category", [
      userId,
      input.categoryId,
    ]);
    if (existing.length > 0) {
      throw new Error("A budget for this category already exists.");
    }
    const ts = nowIso();
    const record: LocalRecord<Budget> = {
      ...input,
      id: generateId(),
      createdAt: ts,
      updatedAt: ts,
      userId,
    };
    await db.put("budgets", record);
    return stripUserId(record);
  }

  async updateBudget(id: string, patch: Partial<BudgetInput>): Promise<Budget> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.get("budgets", id);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Budget ${id} not found`);
    }
    const updated: LocalRecord<Budget> = { ...existing, ...patch, updatedAt: nowIso() };
    await db.put("budgets", updated);
    return stripUserId(updated);
  }

  async deleteBudget(id: string): Promise<void> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.get("budgets", id);
    if (!existing || existing.userId !== userId) return;
    await db.delete("budgets", id);
  }

  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    const db = await getDB();
    const userId = this.requireUserId();
    const all = await db.getAllFromIndex("recurringExpenses", "by-user", userId);
    return all.map(stripUserId);
  }

  async addRecurringExpense(input: RecurringExpenseInput): Promise<RecurringExpense> {
    const db = await getDB();
    const userId = this.requireUserId();
    const ts = nowIso();
    const record: LocalRecord<RecurringExpense> = {
      ...input,
      id: generateId(),
      nextDate: computeNextOccurrence(input.startDate, input.frequency),
      createdAt: ts,
      updatedAt: ts,
      userId,
    };
    await db.put("recurringExpenses", record);
    return stripUserId(record);
  }

  async updateRecurringExpense(
    id: string,
    patch: Partial<RecurringExpenseInput> & { active?: boolean },
  ): Promise<RecurringExpense> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.get("recurringExpenses", id);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Recurring expense ${id} not found`);
    }
    const merged = { ...existing, ...patch };
    const updated: LocalRecord<RecurringExpense> = {
      ...merged,
      nextDate: computeNextOccurrence(merged.startDate, merged.frequency),
      updatedAt: nowIso(),
    };
    await db.put("recurringExpenses", updated);
    return stripUserId(updated);
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await db.get("recurringExpenses", id);
    if (!existing || existing.userId !== userId) return;
    await db.delete("recurringExpenses", id);
  }

  async getSettings(): Promise<UserSettings> {
    const db = await getDB();
    const userId = this.requireUserId();
    const settings = await db.get("settings", userId);
    if (settings) return settings;
    const fresh = defaultSettings(userId);
    await db.put("settings", fresh);
    return fresh;
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    const db = await getDB();
    const userId = this.requireUserId();
    const existing = await this.getSettings();
    const updated: UserSettings = {
      ...existing,
      ...patch,
      id: userId,
      updatedAt: nowIso(),
    };
    await db.put("settings", updated);
    return updated;
  }

  async exportAll(): Promise<ExportBundle> {
    const [transactions, budgets, recurringExpenses, settings] = await Promise.all([
      this.getTransactions(),
      this.getBudgets(),
      this.getRecurringExpenses(),
      this.getSettings(),
    ]);
    return {
      version: EXPORT_VERSION,
      exportedAt: nowIso(),
      transactions,
      budgets,
      recurringExpenses,
      settings,
    };
  }

  async importAll(bundle: ExportBundle): Promise<void> {
    const db = await getDB();
    const userId = this.requireUserId();
    await this.clearAllData();

    const ts = nowIso();
    const txTx = db.transaction("transactions", "readwrite");
    await Promise.all(
      bundle.transactions.map((t) =>
        txTx.store.put({ ...t, id: generateId(), userId, createdAt: ts, updatedAt: ts }),
      ),
    );
    await txTx.done;

    const budgetTx = db.transaction("budgets", "readwrite");
    await Promise.all(
      bundle.budgets.map((b) =>
        budgetTx.store.put({ ...b, id: generateId(), userId, createdAt: ts, updatedAt: ts }),
      ),
    );
    await budgetTx.done;

    const recTx = db.transaction("recurringExpenses", "readwrite");
    await Promise.all(
      bundle.recurringExpenses.map((r) =>
        recTx.store.put({ ...r, id: generateId(), userId, createdAt: ts, updatedAt: ts }),
      ),
    );
    await recTx.done;

    await db.put("settings", { ...bundle.settings, id: userId, updatedAt: ts });
  }

  async clearAllData(): Promise<void> {
    const db = await getDB();
    const userId = this.requireUserId();

    const txTx = db.transaction("transactions", "readwrite");
    const txKeys = await txTx.store.index("by-user").getAllKeys(userId);
    await Promise.all(txKeys.map((key) => txTx.store.delete(key)));
    await txTx.done;

    const budgetTx = db.transaction("budgets", "readwrite");
    const budgetKeys = await budgetTx.store.index("by-user").getAllKeys(userId);
    await Promise.all(budgetKeys.map((key) => budgetTx.store.delete(key)));
    await budgetTx.done;

    const recTx = db.transaction("recurringExpenses", "readwrite");
    const recKeys = await recTx.store.index("by-user").getAllKeys(userId);
    await Promise.all(recKeys.map((key) => recTx.store.delete(key)));
    await recTx.done;
  }
}
