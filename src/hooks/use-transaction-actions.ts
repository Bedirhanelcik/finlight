"use client";

import { useState } from "react";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import type { Transaction } from "@/lib/types";

export function useTransactionActions() {
  const { deleteTransaction } = useData();
  const { show } = useToast();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTransaction(pendingDelete.id);
      show("Transaction deleted.");
      setPendingDelete(null);
    } catch {
      show("Couldn't delete transaction. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return {
    editing,
    setEditing,
    pendingDelete,
    setPendingDelete,
    deleting,
    confirmDelete,
  };
}
