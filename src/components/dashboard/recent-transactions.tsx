"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { useData } from "@/context/data-provider";
import { useTransactionActions } from "@/hooks/use-transaction-actions";

export function RecentTransactions() {
  const { transactions, categories } = useData();
  const { editing, setEditing, pendingDelete, setPendingDelete, deleting, confirmDelete } =
    useTransactionActions();
  const categoryLookup = new Map(categories.map((c) => [c.id, c]));
  const recent = transactions.slice(0, 6);

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <Link href="/transactions" className="text-sm font-medium text-accent hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Add your first transaction to see it here."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {recent.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={categoryLookup.get(t.categoryId)}
                onEdit={setEditing}
                onDelete={setPendingDelete}
                compact
              />
            ))}
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
