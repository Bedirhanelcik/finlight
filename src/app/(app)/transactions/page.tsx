"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { TransactionRow } from "@/components/transactions/transaction-row";
import {
  DEFAULT_FILTERS,
  TransactionFilters,
  type TransactionFiltersState,
} from "@/components/transactions/transaction-filters";
import { useData } from "@/context/data-provider";
import { useTransactionActions } from "@/hooks/use-transaction-actions";
import { applyTransactionFilters } from "@/lib/apply-transaction-filters";
import { formatCurrency } from "@/lib/currency";

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const { transactions, categories, settings } = useData();
  const [filters, setFilters] = useState<TransactionFiltersState>(DEFAULT_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { editing, setEditing, pendingDelete, setPendingDelete, deleting, confirmDelete } =
    useTransactionActions();

  const categoryLookup = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, filters),
    [transactions, filters],
  );

  const visible = filtered.slice(0, visibleCount);
  const summary = useMemo(() => {
    const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expenses, count: filtered.length };
  }, [filtered]);

  function handleFiltersChange(next: TransactionFiltersState) {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
          <p className="mt-1 text-sm text-muted">
            {summary.count} transaction{summary.count === 1 ? "" : "s"} ·{" "}
            <span className="text-positive">+{formatCurrency(summary.income, settings.currency, { compact: true })}</span>{" "}
            <span className="text-negative">-{formatCurrency(summary.expenses, settings.currency, { compact: true })}</span>
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0 whitespace-nowrap">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <TransactionFilters filters={filters} onChange={handleFiltersChange} categories={categories} />

      <Card>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Start tracking your money by adding your first transaction."
            className="border-none"
            action={
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching transactions"
            description="Try adjusting your search or filters."
            className="border-none"
            action={
              <Button variant="secondary" size="sm" onClick={() => handleFiltersChange(DEFAULT_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-col divide-y divide-border/60 p-2">
              {visible.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={categoryLookup.get(t.categoryId)}
                  onEdit={setEditing}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="flex justify-center border-t border-border p-3">
                <Button variant="secondary" size="sm" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                  Load more ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <TransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
      {editing && (
        <TransactionModal open={!!editing} onClose={() => setEditing(null)} transaction={editing} />
      )}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete transaction?"
        description={`This will permanently delete "${pendingDelete?.description ?? ""}". This can't be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
