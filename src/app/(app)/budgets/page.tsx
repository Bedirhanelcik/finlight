"use client";

import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetModal } from "@/components/budgets/budget-modal";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import { computeBudgetProgress } from "@/lib/calculations";
import { formatCurrency } from "@/lib/currency";
import type { Budget } from "@/lib/types";

export default function BudgetsPage() {
  const { budgets, transactions, categories, settings, deleteBudget } = useData();
  const { show } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const progress = useMemo(
    () =>
      computeBudgetProgress(budgets, transactions, categories).sort(
        (a, b) => (a.category?.name ?? "").localeCompare(b.category?.name ?? ""),
      ),
    [budgets, transactions, categories],
  );

  const totals = useMemo(() => {
    const totalBudget = progress.reduce((s, p) => s + p.budget.amount, 0);
    const totalSpent = progress.reduce((s, p) => s + p.spent, 0);
    return { totalBudget, totalSpent };
  }, [progress]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteBudget(pendingDelete.id);
      show("Budget deleted.");
      setPendingDelete(null);
    } catch {
      show("Couldn't delete budget. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const availableCategoryCount = categories.filter(
    (c) => c.type === "expense" || c.type === "both",
  ).length;
  const canAddMore = budgets.length < availableCategoryCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Budgets</h1>
          {progress.length > 0 && (
            <p className="mt-1 text-sm text-muted">
              {formatCurrency(totals.totalSpent, settings.currency, { compact: true })} spent of{" "}
              {formatCurrency(totals.totalBudget, settings.currency, { compact: true })} budgeted this month
            </p>
          )}
        </div>
        <Button onClick={() => setAddOpen(true)} disabled={!canAddMore} className="shrink-0 whitespace-nowrap">
          <Plus className="h-4 w-4" /> New budget
        </Button>
      </div>

      {progress.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budgets yet"
          description="Create your first monthly budget to start tracking spending limits by category."
          action={
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus className="h-4 w-4" /> Create a budget
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {progress.map((p) => (
            <BudgetCard
              key={p.budget.id}
              progress={p}
              onEdit={() => setEditing(p.budget)}
              onDelete={() => setPendingDelete(p.budget)}
            />
          ))}
        </div>
      )}

      <BudgetModal open={addOpen} onClose={() => setAddOpen(false)} />
      {editing && (
        <BudgetModal open={!!editing} onClose={() => setEditing(null)} budget={editing} />
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete budget?"
        description="This will remove the monthly budget for this category. Your transactions won't be affected."
        confirmLabel="Delete"
      />
    </div>
  );
}
