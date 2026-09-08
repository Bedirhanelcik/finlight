"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/data-provider";
import { computeBudgetProgress } from "@/lib/calculations";
import { formatCurrency } from "@/lib/currency";

export function BudgetOverview() {
  const { budgets, transactions, categories, settings } = useData();
  const progress = computeBudgetProgress(budgets, transactions, categories).sort(
    (a, b) => b.percentage - a.percentage,
  );

  return (
    <Card className="min-w-0 animate-fade-in-up">
      <CardHeader>
        <CardTitle>Budget overview</CardTitle>
        <Link href="/budgets" className="text-sm font-medium text-accent hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {progress.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No budgets set"
            description="Create monthly budgets to track spending by category."
            action={
              <Link
                href="/budgets"
                className="text-sm font-medium text-accent hover:underline"
              >
                Create a budget
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {progress.slice(0, 5).map((b) => (
              <div key={b.budget.id} className="flex min-w-0 flex-col gap-1.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CategoryIcon
                    icon={b.category?.icon ?? "more-horizontal"}
                    colorIndex={b.category?.colorIndex ?? 0}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {b.category?.name ?? "Uncategorized"}
                  </span>
                  {b.status === "critical" && <Badge variant="negative">Over</Badge>}
                  {b.status === "warning" && <Badge variant="warning">Near limit</Badge>}
                  <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted">
                    {formatCurrency(b.spent, settings.currency)} /{" "}
                    {formatCurrency(b.budget.amount, settings.currency)}
                  </span>
                </div>
                <ProgressBar percentage={b.percentage} status={b.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
