import type { Budget, Category, Transaction } from "./types";

export interface PeriodTotals {
  income: number;
  expenses: number;
  balance: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
}

export function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return 0;
  if (denominator === 0) return 0;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
}

export function computeTotals(transactions: Transaction[]): PeriodTotals {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  }
  const savings = income - expenses;
  const savingsRate = safeDivide(savings, income) * 100;
  return {
    income,
    expenses,
    balance: income - expenses,
    savings,
    savingsRate: clamp(savingsRate, -999, 100),
    transactionCount: transactions.length,
  };
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function inRange(dateIso: string, start: Date, end: Date): boolean {
  const t = new Date(dateIso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function todayInputValue(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function monthsAgo(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() - months, date.getDate());
}

export function filterByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date,
): Transaction[] {
  return transactions.filter((t) => inRange(t.date, start, end));
}

export interface CategorySpend {
  categoryId: string;
  category: Category | undefined;
  total: number;
  percentage: number;
  count: number;
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: "expense" | "income" = "expense",
): CategorySpend[] {
  const relevant = transactions.filter((t) => t.type === type);
  const total = relevant.reduce((sum, t) => sum + t.amount, 0);
  const map = new Map<string, { total: number; count: number }>();
  for (const t of relevant) {
    const entry = map.get(t.categoryId) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    map.set(t.categoryId, entry);
  }
  const categoryLookup = new Map(categories.map((c) => [c.id, c]));
  const result: CategorySpend[] = Array.from(map.entries()).map(
    ([categoryId, { total: catTotal, count }]) => ({
      categoryId,
      category: categoryLookup.get(categoryId),
      total: catTotal,
      percentage: safeDivide(catTotal, total) * 100,
      count,
    }),
  );
  return result.sort((a, b) => b.total - a.total);
}

export interface BudgetProgress {
  budget: Budget;
  category: Category | undefined;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "critical";
}

export function computeBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  referenceDate: Date = new Date(),
): BudgetProgress[] {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);
  const monthTransactions = filterByDateRange(transactions, start, end).filter(
    (t) => t.type === "expense",
  );
  const categoryLookup = new Map(categories.map((c) => [c.id, c]));

  return budgets.map((budget) => {
    const spent = monthTransactions
      .filter((t) => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    const percentage = clamp(safeDivide(spent, budget.amount) * 100, 0, 999);
    let status: BudgetProgress["status"] = "good";
    if (percentage > 100) status = "critical";
    else if (percentage >= 80) status = "warning";
    return {
      budget,
      category: categoryLookup.get(budget.categoryId),
      spent,
      remaining: Math.max(budget.amount - spent, 0),
      percentage,
      status,
    };
  });
}

export interface MonthlyPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export function computeMonthlySeries(
  transactions: Transaction[],
  months: number,
  referenceDate: Date = new Date(),
): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = monthsAgo(referenceDate, i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const monthTx = filterByDateRange(transactions, start, end);
    const totals = computeTotals(monthTx);
    points.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("en-US", { month: "short" }),
      income: totals.income,
      expenses: totals.expenses,
      savings: totals.savings,
    });
  }
  return points;
}

export interface DailyPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
}

export function computeDailySeries(
  transactions: Transaction[],
  days: number,
  referenceDate: Date = new Date(),
): DailyPoint[] {
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const start = startOfDay(d);
    const end = endOfDay(d);
    const dayTx = filterByDateRange(transactions, start, end);
    const totals = computeTotals(dayTx);
    points.push({
      key: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      income: totals.income,
      expenses: totals.expenses,
    });
  }
  return points;
}

/**
 * Rounds a set of non-negative values into whole-percentage integers that
 * sum to exactly 100 (or all-zero if every value is 0), using the
 * largest-remainder method. Rounding each share independently (e.g. with
 * `Math.round`) can make the displayed percentages fail to add up to 100,
 * or worse, is unrelated across categories - this distributes the leftover
 * whole points to whichever values lost the most to flooring, so the
 * result is both internally consistent and stays tied to the same totals
 * used to render amounts.
 */
export function distributePercentages(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  if (!(total > 0)) return values.map(() => 0);

  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map((r) => Math.floor(r));
  let leftover = 100 - floors.reduce((sum, f) => sum + f, 0);

  const byRemainderDesc = floors
    .map((_, index) => index)
    .sort((a, b) => raw[b] - floors[b] - (raw[a] - floors[a]));

  const result = [...floors];
  for (let i = 0; i < byRemainderDesc.length && leftover > 0; i++, leftover--) {
    result[byRemainderDesc[i]] += 1;
  }
  return result;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return safeDivide(current - previous, Math.abs(previous)) * 100;
}
