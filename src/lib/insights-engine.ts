import {
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeMonthlySeries,
  computeTotals,
  endOfMonth,
  filterByDateRange,
  monthsAgo,
  percentChange,
  safeDivide,
  startOfMonth,
} from "./calculations";
import { generateId } from "./id";
import { formatCurrency } from "./currency";
import type {
  Budget,
  Category,
  CurrencyCode,
  Insight,
  RecurringExpense,
  Transaction,
} from "./types";
import { monthlyEquivalent } from "./recurring";

export interface InsightContext {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  currency?: CurrencyCode;
  referenceDate?: Date;
}

/**
 * Pluggable analysis contract. LocalInsightsEngine is a deterministic,
 * rule-based implementation that runs entirely on-device. A future
 * AIInsightsEngine could implement the same interface, calling an external
 * model with this same context shape, without changing the Insights page.
 */
export interface InsightsProvider {
  generate(context: InsightContext): Insight[];
}

function makeInsight(
  title: string,
  detail: string,
  severity: Insight["severity"],
  category: Insight["category"],
): Insight {
  return { id: generateId(), title, detail, severity, category };
}

export class LocalInsightsEngine implements InsightsProvider {
  generate(context: InsightContext): Insight[] {
    const referenceDate = context.referenceDate ?? new Date();
    const currency = context.currency ?? "TRY";
    const money = (value: number) => formatCurrency(value, currency);
    const insights: Insight[] = [];
    const categoryLookup = new Map(context.categories.map((c) => [c.id, c]));

    const currentStart = startOfMonth(referenceDate);
    const currentEnd = endOfMonth(referenceDate);
    const previousRef = monthsAgo(referenceDate, 1);
    const previousStart = startOfMonth(previousRef);
    const previousEnd = endOfMonth(previousRef);

    const currentMonthTx = filterByDateRange(
      context.transactions,
      currentStart,
      currentEnd,
    );
    const previousMonthTx = filterByDateRange(
      context.transactions,
      previousStart,
      previousEnd,
    );

    const currentTotals = computeTotals(currentMonthTx);
    const previousTotals = computeTotals(previousMonthTx);

    if (currentTotals.income > 0) {
      const rate = currentTotals.savingsRate;
      let severity: Insight["severity"] = "neutral";
      if (rate >= 20) severity = "positive";
      else if (rate < 0) severity = "critical";
      else if (rate < 10) severity = "warning";
      insights.push(
        makeInsight(
          `Savings rate is ${rate.toFixed(0)}% this month`,
          rate >= 0
            ? `You saved ${rate.toFixed(0)}% of your income in ${monthLabel(referenceDate)}.`
            : `You spent more than you earned in ${monthLabel(referenceDate)}, ${Math.abs(rate).toFixed(0)}% over income.`,
          severity,
          "savings",
        ),
      );
    } else if (currentMonthTx.length > 0) {
      insights.push(
        makeInsight(
          "No income recorded this month",
          "Add an income transaction to see your savings rate and balance trend.",
          "warning",
          "savings",
        ),
      );
    }

    const currentByCategory = computeCategoryBreakdown(
      currentMonthTx,
      context.categories,
      "expense",
    );
    const previousByCategory = computeCategoryBreakdown(
      previousMonthTx,
      context.categories,
      "expense",
    );
    const previousMap = new Map(previousByCategory.map((c) => [c.categoryId, c]));

    const changeCandidates = currentByCategory
      .map((c) => {
        const prev = previousMap.get(c.categoryId);
        const change = prev ? percentChange(c.total, prev.total) : null;
        return { ...c, change };
      })
      .filter((c) => c.change !== null && Math.abs(c.change) >= 15 && c.total >= 100)
      .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0));

    for (const c of changeCandidates.slice(0, 3)) {
      const name = c.category?.name ?? "This category";
      const change = c.change ?? 0;
      const direction = change > 0 ? "increased" : "decreased";
      insights.push(
        makeInsight(
          `${name} spending ${direction} ${Math.abs(change).toFixed(0)}%`,
          `${name} spending ${direction} ${Math.abs(change).toFixed(0)}% compared with last month (from the ${monthLabel(previousRef)} total).`,
          change > 0 ? "warning" : "positive",
          "spending",
        ),
      );
    }

    if (currentByCategory.length > 0) {
      const top = currentByCategory[0];
      insights.push(
        makeInsight(
          `Largest expense category: ${top.category?.name ?? "Uncategorized"}`,
          `${top.category?.name ?? "Uncategorized"} accounts for ${top.percentage.toFixed(0)}% of this month's spending.`,
          "neutral",
          "spending",
        ),
      );
    }

    const budgetProgress = computeBudgetProgress(
      context.budgets,
      context.transactions,
      context.categories,
      referenceDate,
    );
    const overBudget = budgetProgress.filter((b) => b.status === "critical");
    const nearLimit = budgetProgress.filter((b) => b.status === "warning");

    for (const b of overBudget) {
      const name = b.category?.name ?? "This category";
      insights.push(
        makeInsight(
          `Over budget in ${name}`,
          `You spent ${b.percentage.toFixed(0)}% of your ${name} budget this month, exceeding it.`,
          "critical",
          "budget",
        ),
      );
    }
    for (const b of nearLimit.slice(0, 2)) {
      const name = b.category?.name ?? "This category";
      insights.push(
        makeInsight(
          `Approaching ${name} budget limit`,
          `You've used ${b.percentage.toFixed(0)}% of your ${name} budget with time left in the month.`,
          "warning",
          "budget",
        ),
      );
    }
    if (
      budgetProgress.length > 0 &&
      overBudget.length === 0 &&
      nearLimit.length === 0
    ) {
      insights.push(
        makeInsight(
          "All budgets on track",
          "Every category is within budget so far this month. Nice work.",
          "positive",
          "budget",
        ),
      );
    }

    const activeRecurring = context.recurringExpenses.filter((r) => r.active);
    if (activeRecurring.length > 0) {
      const monthlyTotal = activeRecurring.reduce(
        (sum, r) => sum + monthlyEquivalent(r.amount, r.frequency),
        0,
      );
      insights.push(
        makeInsight(
          `${activeRecurring.length} recurring expense${activeRecurring.length === 1 ? "" : "s"} tracked`,
          `Recurring subscriptions and bills cost about ${money(monthlyTotal)} per month in total.`,
          "neutral",
          "recurring",
        ),
      );
    }

    const series = computeMonthlySeries(context.transactions, 3, referenceDate);
    if (series.length === 3 && series.every((p) => p.expenses > 0)) {
      const [m1, , m3] = series;
      const trendChange = percentChange(m3.expenses, m1.expenses);
      if (trendChange !== null && Math.abs(trendChange) >= 8) {
        const direction = trendChange > 0 ? "increased" : "decreased";
        insights.push(
          makeInsight(
            `Average spending has ${direction} over 3 months`,
            `Monthly spending has ${direction} from ${money(m1.expenses)} in ${m1.label} to ${money(m3.expenses)} in ${m3.label}.`,
            trendChange > 0 ? "warning" : "positive",
            "trend",
          ),
        );
      }
    }

    const unusual = findUnusualTransactions(context.transactions, referenceDate);
    for (const u of unusual.slice(0, 2)) {
      const category = categoryLookup.get(u.transaction.categoryId);
      insights.push(
        makeInsight(
          `Unusual transaction in ${category?.name ?? "a category"}`,
          `${u.transaction.description} for ${money(u.transaction.amount)} is ${u.multiple.toFixed(1)}x your typical ${category?.name ?? "category"} transaction.`,
          "warning",
          "spending",
        ),
      );
    }

    if (previousTotals.expenses > 0) {
      const overallChange = percentChange(
        currentTotals.expenses,
        previousTotals.expenses,
      );
      if (overallChange !== null && Math.abs(overallChange) >= 10) {
        const direction = overallChange > 0 ? "up" : "down";
        insights.push(
          makeInsight(
            `Total spending is ${direction} ${Math.abs(overallChange).toFixed(0)}% vs last month`,
            `You've spent ${money(currentTotals.expenses)} so far this month compared with ${money(previousTotals.expenses)} last month.`,
            overallChange > 0 ? "warning" : "positive",
            "trend",
          ),
        );
      }
    }

    return insights;
  }
}

function findUnusualTransactions(
  transactions: Transaction[],
  referenceDate: Date,
): { transaction: Transaction; multiple: number }[] {
  const currentStart = startOfMonth(referenceDate);
  const currentEnd = endOfMonth(referenceDate);
  const currentMonthTx = filterByDateRange(transactions, currentStart, currentEnd).filter(
    (t) => t.type === "expense",
  );

  const byCategory = new Map<string, Transaction[]>();
  for (const t of transactions.filter((t) => t.type === "expense")) {
    const list = byCategory.get(t.categoryId) ?? [];
    list.push(t);
    byCategory.set(t.categoryId, list);
  }

  const results: { transaction: Transaction; multiple: number }[] = [];
  for (const t of currentMonthTx) {
    const history = byCategory.get(t.categoryId) ?? [];
    if (history.length < 4) continue;
    const avg = safeDivide(
      history.reduce((sum, h) => sum + h.amount, 0),
      history.length,
    );
    if (avg <= 0) continue;
    const multiple = t.amount / avg;
    if (multiple >= 2.2 && t.amount - avg >= 200) {
      results.push({ transaction: t, multiple });
    }
  }
  return results.sort((a, b) => b.multiple - a.multiple);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function generateInsights(context: InsightContext): Insight[] {
  return new LocalInsightsEngine().generate(context);
}
