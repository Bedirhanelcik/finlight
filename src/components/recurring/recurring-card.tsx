"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useData } from "@/context/data-provider";
import { formatCurrency } from "@/lib/currency";
import { frequencyLabel } from "@/lib/recurring";
import type { Category, RecurringExpense } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

interface RecurringCardProps {
  recurringExpense: RecurringExpense;
  category: Category | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}

export function RecurringCard({
  recurringExpense,
  category,
  onEdit,
  onDelete,
  onToggleActive,
}: RecurringCardProps) {
  const { settings } = useData();

  return (
    <Card className="animate-fade-in-up flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryIcon icon={category?.icon ?? "more-horizontal"} colorIndex={category?.colorIndex ?? 0} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{recurringExpense.merchant}</p>
            {!recurringExpense.active && <Badge variant="neutral">Paused</Badge>}
          </div>
          <p className="truncate text-xs text-muted">
            {category?.name ?? "Uncategorized"} · {frequencyLabel(recurringExpense.frequency)} · Next{" "}
            {formatDate(recurringExpense.nextDate)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground sm:hidden">
          {formatCurrency(recurringExpense.amount, settings.currency)}
        </span>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
        <span className="hidden text-sm font-semibold tabular-nums text-foreground sm:inline">
          {formatCurrency(recurringExpense.amount, settings.currency)}
        </span>
        <label className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={recurringExpense.active}
            onChange={(e) => onToggleActive(e.target.checked)}
            aria-label={`${recurringExpense.active ? "Pause" : "Resume"} ${recurringExpense.merchant}`}
          />
          <span className="absolute inset-0 rounded-full bg-border-strong transition-colors peer-checked:bg-accent" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </label>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${recurringExpense.merchant}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${recurringExpense.merchant}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-subtle hover:bg-negative-bg hover:text-negative"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
