"use client";

import { Modal } from "@/components/ui/modal";
import { TransactionForm } from "./transaction-form";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import type { Transaction } from "@/lib/types";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

export function TransactionModal({ open, onClose, transaction }: TransactionModalProps) {
  const { categories, addTransaction, updateTransaction } = useData();
  const { show } = useToast();
  const isEdit = !!transaction;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit transaction" : "Add transaction"}
      description={isEdit ? undefined : "Record a new income or expense."}
    >
      <TransactionForm
        categories={categories}
        initialTransaction={transaction}
        submitLabel={isEdit ? "Save changes" : "Add transaction"}
        onCancel={onClose}
        onSubmit={async (values) => {
          if (isEdit && transaction) {
            await updateTransaction(transaction.id, values);
            show("Transaction updated.");
          } else {
            await addTransaction(values);
            show("Transaction added.");
          }
          onClose();
        }}
      />
    </Modal>
  );
}
