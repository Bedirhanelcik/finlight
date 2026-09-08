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

/**
 * Storage-agnostic contract for all persisted finance data, scoped to the
 * currently authenticated user. The Supabase implementation is the
 * production adapter; an IndexedDB implementation exists as a local
 * development fallback when Supabase isn't configured. Categories are a
 * static, app-level reference list (see lib/default-categories.ts) and are
 * not part of this contract.
 */
export interface FinanceRepository {
  init(): Promise<void>;

  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  addTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(
    id: string,
    patch: Partial<TransactionInput>,
  ): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  addTransactions(inputs: TransactionInput[]): Promise<Transaction[]>;

  getBudgets(): Promise<Budget[]>;
  addBudget(input: BudgetInput): Promise<Budget>;
  updateBudget(id: string, patch: Partial<BudgetInput>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  getRecurringExpenses(): Promise<RecurringExpense[]>;
  addRecurringExpense(
    input: RecurringExpenseInput,
  ): Promise<RecurringExpense>;
  updateRecurringExpense(
    id: string,
    patch: Partial<RecurringExpenseInput> & { active?: boolean },
  ): Promise<RecurringExpense>;
  deleteRecurringExpense(id: string): Promise<void>;

  getSettings(): Promise<UserSettings>;
  updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>;

  exportAll(): Promise<ExportBundle>;
  importAll(bundle: ExportBundle): Promise<void>;
  clearAllData(): Promise<void>;
}
