import { getSupabaseBrowserClient } from "../supabase/client";
import type { Database } from "../supabase/database.types";
import type {
  Budget,
  BudgetInput,
  ExportBundle,
  RecurringExpense,
  RecurringExpenseInput,
  Transaction,
  TransactionInput,
  TransactionType,
  RecurringFrequency,
  ThemePreference,
  CurrencyCode,
  UserSettings,
} from "../types";
import type { FinanceRepository } from "./types";

const EXPORT_VERSION = 1;

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type RecurringRow = Database["public"]["Tables"]["recurring_expenses"]["Row"];
type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    date: row.date,
    categoryId: row.category_id,
    description: row.description,
    merchant: row.merchant ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: Number(row.amount),
    period: row.period as "monthly",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecurring(row: RecurringRow): RecurringExpense {
  return {
    id: row.id,
    merchant: row.merchant,
    amount: Number(row.amount),
    frequency: row.frequency as RecurringFrequency,
    categoryId: row.category_id,
    startDate: row.start_date,
    nextDate: row.next_date,
    notes: row.notes ?? undefined,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: SettingsRow): UserSettings {
  return {
    id: row.id,
    currency: row.currency as CurrencyCode,
    theme: row.theme as ThemePreference,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function computeNextOccurrenceRemote(
  startDate: string,
  frequency: RecurringFrequency,
): string {
  let cursor = new Date(startDate);
  if (Number.isNaN(cursor.getTime())) cursor = new Date();
  const now = new Date();
  let safety = 0;
  while (cursor.getTime() < now.getTime() && safety < 1000) {
    if (frequency === "weekly") cursor.setDate(cursor.getDate() + 7);
    else if (frequency === "monthly") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setFullYear(cursor.getFullYear() + 1);
    safety += 1;
  }
  return cursor.toISOString();
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("Supabase returned no data.");
  return result.data;
}

/**
 * Production data-access adapter. Row Level Security enforces per-user
 * isolation server-side (see supabase/migrations/0001_init.sql) - every
 * query here implicitly only ever touches the authenticated user's rows,
 * and `user_id` defaults to auth.uid() on insert so it never needs to be
 * supplied by the client.
 */
export class SupabaseFinanceRepository implements FinanceRepository {
  private get client() {
    return getSupabaseBrowserClient();
  }

  async init(): Promise<void> {
    // Nothing to do: connections are managed per-request by supabase-js,
    // and the settings row is auto-provisioned by a DB trigger on sign-up.
  }

  async getTransactions(): Promise<Transaction[]> {
    const result = await this.client
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    return unwrap(result).map(mapTransaction);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await this.client.from("transactions").select("*").eq("id", id).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data ? mapTransaction(result.data) : undefined;
  }

  async addTransaction(input: TransactionInput): Promise<Transaction> {
    const result = await this.client
      .from("transactions")
      .insert({
        type: input.type,
        amount: input.amount,
        date: input.date,
        category_id: input.categoryId,
        description: input.description,
        merchant: input.merchant ?? null,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    return mapTransaction(unwrap(result));
  }

  async addTransactions(inputs: TransactionInput[]): Promise<Transaction[]> {
    const result = await this.client
      .from("transactions")
      .insert(
        inputs.map((input) => ({
          type: input.type,
          amount: input.amount,
          date: input.date,
          category_id: input.categoryId,
          description: input.description,
          merchant: input.merchant ?? null,
          notes: input.notes ?? null,
        })),
      )
      .select("*");
    return unwrap(result).map(mapTransaction);
  }

  async updateTransaction(
    id: string,
    patch: Partial<TransactionInput>,
  ): Promise<Transaction> {
    const result = await this.client
      .from("transactions")
      .update({
        ...(patch.type !== undefined && { type: patch.type }),
        ...(patch.amount !== undefined && { amount: patch.amount }),
        ...(patch.date !== undefined && { date: patch.date }),
        ...(patch.categoryId !== undefined && { category_id: patch.categoryId }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.merchant !== undefined && { merchant: patch.merchant ?? null }),
        ...(patch.notes !== undefined && { notes: patch.notes ?? null }),
      })
      .eq("id", id)
      .select("*")
      .single();
    return mapTransaction(unwrap(result));
  }

  async deleteTransaction(id: string): Promise<void> {
    const result = await this.client.from("transactions").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  }

  async getBudgets(): Promise<Budget[]> {
    const result = await this.client.from("budgets").select("*");
    return unwrap(result).map(mapBudget);
  }

  async addBudget(input: BudgetInput): Promise<Budget> {
    const result = await this.client
      .from("budgets")
      .insert({ category_id: input.categoryId, amount: input.amount, period: input.period })
      .select("*")
      .single();
    if (result.error) {
      if (result.error.message.includes("duplicate key")) {
        throw new Error("A budget for this category already exists.");
      }
      throw new Error(result.error.message);
    }
    return mapBudget(result.data);
  }

  async updateBudget(id: string, patch: Partial<BudgetInput>): Promise<Budget> {
    const result = await this.client
      .from("budgets")
      .update({
        ...(patch.categoryId !== undefined && { category_id: patch.categoryId }),
        ...(patch.amount !== undefined && { amount: patch.amount }),
        ...(patch.period !== undefined && { period: patch.period }),
      })
      .eq("id", id)
      .select("*")
      .single();
    return mapBudget(unwrap(result));
  }

  async deleteBudget(id: string): Promise<void> {
    const result = await this.client.from("budgets").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  }

  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    const result = await this.client.from("recurring_expenses").select("*");
    return unwrap(result).map(mapRecurring);
  }

  async addRecurringExpense(input: RecurringExpenseInput): Promise<RecurringExpense> {
    const result = await this.client
      .from("recurring_expenses")
      .insert({
        merchant: input.merchant,
        amount: input.amount,
        frequency: input.frequency,
        category_id: input.categoryId,
        start_date: input.startDate,
        next_date: computeNextOccurrenceRemote(input.startDate, input.frequency),
        notes: input.notes ?? null,
        active: input.active,
      })
      .select("*")
      .single();
    return mapRecurring(unwrap(result));
  }

  async updateRecurringExpense(
    id: string,
    patch: Partial<RecurringExpenseInput> & { active?: boolean },
  ): Promise<RecurringExpense> {
    const existing = unwrap<RecurringRow>(
      await this.client.from("recurring_expenses").select("*").eq("id", id).single(),
    );
    const startDate = patch.startDate ?? existing.start_date;
    const frequency = patch.frequency ?? (existing.frequency as RecurringFrequency);
    const result = await this.client
      .from("recurring_expenses")
      .update({
        ...(patch.merchant !== undefined && { merchant: patch.merchant }),
        ...(patch.amount !== undefined && { amount: patch.amount }),
        ...(patch.frequency !== undefined && { frequency: patch.frequency }),
        ...(patch.categoryId !== undefined && { category_id: patch.categoryId }),
        ...(patch.startDate !== undefined && { start_date: patch.startDate }),
        ...(patch.notes !== undefined && { notes: patch.notes ?? null }),
        ...(patch.active !== undefined && { active: patch.active }),
        next_date: computeNextOccurrenceRemote(startDate, frequency),
      })
      .eq("id", id)
      .select("*")
      .single();
    return mapRecurring(unwrap(result));
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    const result = await this.client.from("recurring_expenses").delete().eq("id", id);
    if (result.error) throw new Error(result.error.message);
  }

  async getSettings(): Promise<UserSettings> {
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated.");

    const existing = await this.client
      .from("user_settings")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) return mapSettings(existing.data);

    // Should already exist via the on-sign-up DB trigger; create defensively.
    const created = await this.client
      .from("user_settings")
      .insert({ id: userData.user.id })
      .select("*")
      .single();
    return mapSettings(unwrap(created));
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated.");

    const result = await this.client
      .from("user_settings")
      .update({
        ...(patch.currency !== undefined && { currency: patch.currency }),
        ...(patch.theme !== undefined && { theme: patch.theme }),
        ...(patch.onboardingCompleted !== undefined && {
          onboarding_completed: patch.onboardingCompleted,
        }),
      })
      .eq("id", userData.user.id)
      .select("*")
      .single();
    return mapSettings(unwrap(result));
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
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      recurringExpenses,
      settings,
    };
  }

  async importAll(bundle: ExportBundle): Promise<void> {
    await this.clearAllData();

    if (bundle.transactions.length > 0) {
      await this.addTransactions(
        bundle.transactions.map((t) => ({
          type: t.type,
          amount: t.amount,
          date: t.date,
          categoryId: t.categoryId,
          description: t.description,
          merchant: t.merchant,
          notes: t.notes,
        })),
      );
    }
    for (const b of bundle.budgets) {
      await this.addBudget({ categoryId: b.categoryId, amount: b.amount, period: b.period });
    }
    for (const r of bundle.recurringExpenses) {
      await this.addRecurringExpense({
        merchant: r.merchant,
        amount: r.amount,
        frequency: r.frequency,
        categoryId: r.categoryId,
        startDate: r.startDate,
        notes: r.notes,
        active: r.active,
      });
    }
    await this.updateSettings({
      currency: bundle.settings.currency,
      theme: bundle.settings.theme,
    });
  }

  async clearAllData(): Promise<void> {
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError || !userData.user) throw new Error("Not authenticated.");
    const userId = userData.user.id;

    const [txResult, budgetResult, recResult] = await Promise.all([
      this.client.from("transactions").delete().eq("user_id", userId),
      this.client.from("budgets").delete().eq("user_id", userId),
      this.client.from("recurring_expenses").delete().eq("user_id", userId),
    ]);
    if (txResult.error) throw new Error(txResult.error.message);
    if (budgetResult.error) throw new Error(budgetResult.error.message);
    if (recResult.error) throw new Error(recResult.error.message);
  }
}
