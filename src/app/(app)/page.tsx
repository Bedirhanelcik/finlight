"use client";

import { useMemo } from "react";
import { Landmark, LineChart, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { InsightsPreview } from "@/components/dashboard/insights-preview";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { useData } from "@/context/data-provider";
import {
  computeCategoryBreakdown,
  computeMonthlySeries,
  computeTotals,
  endOfMonth,
  filterByDateRange,
  monthsAgo,
  percentChange,
  startOfMonth,
} from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/currency";
import { getCategoryColor } from "@/lib/colors";

export default function DashboardPage() {
  const { transactions, categories, settings, resolvedTheme } = useData();

  const now = useMemo(() => new Date(), []);

  const { currentTotals, previousTotals, allTimeTotals, categoryBreakdown, series } =
    useMemo(() => {
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const previousRef = monthsAgo(now, 1);
      const previousStart = startOfMonth(previousRef);
      const previousEnd = endOfMonth(previousRef);

      const currentMonthTx = filterByDateRange(transactions, currentStart, currentEnd);
      const previousMonthTx = filterByDateRange(transactions, previousStart, previousEnd);

      return {
        currentTotals: computeTotals(currentMonthTx),
        previousTotals: computeTotals(previousMonthTx),
        allTimeTotals: computeTotals(transactions),
        categoryBreakdown: computeCategoryBreakdown(currentMonthTx, categories, "expense"),
        series: computeMonthlySeries(transactions, 6, now),
      };
    }, [transactions, categories, now]);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, [now]);

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const incomeColor = getCategoryColor(0, resolvedTheme);
  const expenseColor = "#e34948";
  const currency = settings.currency;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-muted">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Current balance"
          value={allTimeTotals.balance}
          format={(v) => formatCurrency(v, currency)}
          icon={Landmark}
          accent="neutral"
        />
        <StatCard
          label="Income this month"
          value={currentTotals.income}
          format={(v) => formatCurrency(v, currency)}
          icon={TrendingUp}
          accent="positive"
          delta={percentChange(currentTotals.income, previousTotals.income)}
        />
        <StatCard
          label="Expenses this month"
          value={currentTotals.expenses}
          format={(v) => formatCurrency(v, currency)}
          icon={TrendingDown}
          accent="negative"
          positiveIsGood={false}
          delta={percentChange(currentTotals.expenses, previousTotals.expenses)}
        />
        <StatCard
          label="Savings rate"
          value={currentTotals.savingsRate}
          format={(v) => formatPercent(v)}
          icon={PiggyBank}
          accent={currentTotals.savingsRate >= 0 ? "positive" : "negative"}
          delta={percentChange(currentTotals.savingsRate, previousTotals.savingsRate)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="animate-fade-in-up xl:col-span-3">
          <CardHeader>
            <CardTitle>Income vs. expenses</CardTitle>
            <span className="text-xs text-subtle">Last 6 months</span>
          </CardHeader>
          <CardContent className="h-72">
            {series.some((s) => s.income > 0 || s.expenses > 0) ? (
              <TrendAreaChart data={series} incomeColor={incomeColor} expenseColor={expenseColor} />
            ) : (
              <EmptyState
                icon={LineChart}
                title="No data yet"
                description="Add transactions to see your income and expense trend."
              />
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up min-w-0 xl:col-span-2">
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <span className="text-xs text-subtle">This month</span>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <CategoryDonutChart data={categoryBreakdown} maxSlices={5} />
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No expenses yet"
                description="Your category breakdown will appear here."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BudgetOverview />
        <InsightsPreview />
      </div>

      <RecentTransactions />
    </div>
  );
}
