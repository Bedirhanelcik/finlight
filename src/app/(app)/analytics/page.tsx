"use client";

import { useMemo, useState } from "react";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatDelta } from "@/components/ui/stat-delta";
import { RangeSelector, type AnalyticsRange } from "@/components/analytics/range-selector";
import { TopCategoriesList } from "@/components/analytics/top-categories-list";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { IncomeExpenseBarChart } from "@/components/charts/income-expense-bar-chart";
import { SavingsLineChart } from "@/components/charts/savings-line-chart";
import { useData } from "@/context/data-provider";
import {
  computeCategoryBreakdown,
  computeDailySeries,
  computeMonthlySeries,
  computeTotals,
  endOfDay,
  filterByDateRange,
  percentChange,
  startOfDay,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/currency";
import { getCategoryColor } from "@/lib/colors";

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "12m": 365,
};

export default function AnalyticsPage() {
  const { transactions, categories, settings, resolvedTheme } = useData();
  const [range, setRange] = useState<AnalyticsRange>("6m");

  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    const days = RANGE_DAYS[range];
    const rangeStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)));
    const rangeEnd = endOfDay(now);
    const previousStart = startOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days * 2 - 1)),
    );
    const previousEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - days));

    const currentTx = filterByDateRange(transactions, rangeStart, rangeEnd);
    const previousTx = filterByDateRange(transactions, previousStart, previousEnd);

    const currentTotals = computeTotals(currentTx);
    const previousTotals = computeTotals(previousTx);

    const series =
      range === "7d" || range === "30d"
        ? computeDailySeries(transactions, days, now)
        : computeMonthlySeries(transactions, range === "3m" ? 3 : range === "6m" ? 6 : 12, now);

    const categoryBreakdown = computeCategoryBreakdown(currentTx, categories, "expense");
    const savingsSeries = (
      range === "7d" || range === "30d"
        ? computeDailySeries(transactions, days, now).map((d) => ({
            label: d.label,
            savings: d.income - d.expenses,
          }))
        : computeMonthlySeries(transactions, range === "3m" ? 3 : range === "6m" ? 6 : 12, now).map(
            (m) => ({ label: m.label, savings: m.savings }),
          )
    );

    return {
      currentTotals,
      previousTotals,
      series,
      categoryBreakdown,
      savingsSeries,
    };
  }, [transactions, categories, range, now]);

  const incomeColor = getCategoryColor(0, resolvedTheme);
  const expenseColor = "#e34948";
  const savingsColor = getCategoryColor(2, resolvedTheme);
  const currency = settings.currency;
  const hasData = transactions.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Deeper look at your financial trends</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyze yet"
          description="Add some transactions to unlock analytics and trends."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="p-5">
              <span className="text-sm font-medium text-muted">Income</span>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(data.currentTotals.income, currency)}
              </p>
              <div className="mt-1.5">
                <StatDelta value={percentChange(data.currentTotals.income, data.previousTotals.income)} />
              </div>
            </Card>
            <Card className="p-5">
              <span className="text-sm font-medium text-muted">Expenses</span>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(data.currentTotals.expenses, currency)}
              </p>
              <div className="mt-1.5">
                <StatDelta
                  value={percentChange(data.currentTotals.expenses, data.previousTotals.expenses)}
                  positiveIsGood={false}
                />
              </div>
            </Card>
            <Card className="p-5">
              <span className="text-sm font-medium text-muted">Net savings</span>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(data.currentTotals.savings, currency)}
              </p>
              <div className="mt-1.5">
                <StatDelta value={percentChange(data.currentTotals.savings, data.previousTotals.savings)} />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income vs. expenses</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <TrendAreaChart data={data.series} incomeColor={incomeColor} expenseColor={expenseColor} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{range === "7d" || range === "30d" ? "Daily comparison" : "Monthly comparison"}</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <IncomeExpenseBarChart data={data.series} incomeColor={incomeColor} expenseColor={expenseColor} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Savings trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <SavingsLineChart data={data.savingsSeries} color={savingsColor} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Category breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {data.categoryBreakdown.length > 0 ? (
                  <CategoryDonutChart data={data.categoryBreakdown} />
                ) : (
                  <EmptyState icon={PieChartIcon} title="No expenses in this range" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top spending categories</CardTitle>
              </CardHeader>
              <CardContent>
                {data.categoryBreakdown.length > 0 ? (
                  <TopCategoriesList data={data.categoryBreakdown} />
                ) : (
                  <EmptyState icon={BarChart3} title="No expenses in this range" />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
