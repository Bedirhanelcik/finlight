"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useData } from "@/context/data-provider";
import { formatCurrency } from "@/lib/currency";
import type { BudgetProgress } from "@/lib/calculations";

interface BudgetCardProps {
  progress: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ progress, onEdit, onDelete }: BudgetCardProps) {
  const { settings } = useData();
  const { budget, category, spent, remaining, percentage, status } = progress;

  return (
    <Card className="animate-fade-in-up flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <CategoryIcon icon={category?.icon ?? "more-horizontal"} colorIndex={category?.colorIndex ?? 0} />
          <div>
            <p className="text-sm font-semibold text-foreground">{category?.name ?? "Uncategorized"}</p>
            <p className="text-xs text-subtle">Monthly budget</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${category?.name ?? ""} budget`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${category?.name ?? ""} budget`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:bg-negative-bg hover:text-negative"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatCurrency(spent, settings.currency)}
          </span>
          <span className="text-sm text-muted">of {formatCurrency(budget.amount, settings.currency)}</span>
        </div>
        <div className="mt-2.5">
          <ProgressBar percentage={percentage} status={status} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-subtle">
            {status === "critical"
              ? `${formatCurrency(spent - budget.amount, settings.currency)} over`
              : `${formatCurrency(remaining, settings.currency)} left`}
          </span>
          {status === "critical" && <Badge variant="negative">Over budget</Badge>}
          {status === "warning" && <Badge variant="warning">{percentage.toFixed(0)}% used</Badge>}
          {status === "good" && <Badge variant="positive">On track</Badge>}
        </div>
      </div>
    </Card>
  );
}
