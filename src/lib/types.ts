export type TransactionType = "income" | "expense";

export type CategoryType = TransactionType | "both";

export interface Category {
  id: string;
  name: string;
  icon: string;
  colorIndex: number;
  type: CategoryType;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  merchant?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;

export type BudgetPeriod = "monthly";

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  createdAt: string;
  updatedAt: string;
}

export type BudgetInput = Omit<Budget, "id" | "createdAt" | "updatedAt">;

export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export interface RecurringExpense {
  id: string;
  merchant: string;
  amount: number;
  frequency: RecurringFrequency;
  categoryId: string;
  startDate: string;
  nextDate: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RecurringExpenseInput = Omit<
  RecurringExpense,
  "id" | "nextDate" | "createdAt" | "updatedAt"
>;

export type ThemePreference = "light" | "dark" | "system";

export const SUPPORTED_CURRENCIES = [
  "TRY",
  "USD",
  "EUR",
  "GBP",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface UserSettings {
  id: string;
  currency: CurrencyCode;
  theme: ThemePreference;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportBundle {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  settings: UserSettings;
}

export type InsightSeverity = "positive" | "neutral" | "warning" | "critical";

export interface Insight {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  category: "spending" | "budget" | "savings" | "recurring" | "trend";
}
