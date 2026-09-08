"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus, Repeat, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RecurringCard } from "@/components/recurring/recurring-card";
import { RecurringModal } from "@/components/recurring/recurring-modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import { formatCurrency } from "@/lib/currency";
import { monthlyEquivalent } from "@/lib/recurring";
import type { RecurringExpense } from "@/lib/types";

export default function RecurringPage() {
  const { recurringExpenses, categories, settings, deleteRecurringExpense, updateRecurringExpense } =
    useData();
  const { show } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecurringExpense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryLookup = new Map(categories.map((c) => [c.id, c]));
  const sorted = useMemo(
    () =>
      [...recurringExpenses].sort(
        (a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime(),
      ),
    [recurringExpenses],
  );

  const activeExpenses = recurringExpenses.filter((r) => r.active);
  const monthlyTotal = activeExpenses.reduce(
    (sum, r) => sum + monthlyEquivalent(r.amount, r.frequency),
    0,
  );
  const upcoming = [...activeExpenses].sort(
    (a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime(),
  )[0];

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRecurringExpense(pendingDelete.id);
      show("Recurring expense deleted.");
      setPendingDelete(null);
    } catch {
      show("Couldn't delete. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recurring expenses</h1>
          <p className="mt-1 text-sm text-muted">Subscriptions and recurring bills</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0 whitespace-nowrap">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Active recurring"
          value={activeExpenses.length}
          format={(v) => String(Math.round(v))}
          icon={Repeat}
        />
        <StatCard
          label="Estimated monthly cost"
          value={monthlyTotal}
          format={(v) => formatCurrency(v, settings.currency)}
          icon={Wallet}
        />
        <StatCard
          label="Next payment"
          value={upcoming ? monthlyEquivalent(upcoming.amount, upcoming.frequency) : 0}
          format={() =>
            upcoming
              ? `${upcoming.merchant} · ${new Date(upcoming.nextDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
              : "None scheduled"
          }
          icon={CalendarClock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All recurring expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No recurring expenses yet"
              description="Track subscriptions and bills so you always know your fixed monthly costs."
              action={
                <Button onClick={() => setAddOpen(true)} size="sm">
                  <Plus className="h-4 w-4" /> Add recurring expense
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((r) => (
                <RecurringCard
                  key={r.id}
                  recurringExpense={r}
                  category={categoryLookup.get(r.categoryId)}
                  onEdit={() => setEditing(r)}
                  onDelete={() => setPendingDelete(r)}
                  onToggleActive={(active) => updateRecurringExpense(r.id, { active })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecurringModal open={addOpen} onClose={() => setAddOpen(false)} />
      {editing && (
        <RecurringModal open={!!editing} onClose={() => setEditing(null)} recurringExpense={editing} />
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete recurring expense?"
        description={`This will stop tracking "${pendingDelete?.merchant ?? ""}". This can't be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
