"use client";

import { Modal } from "@/components/ui/modal";
import { RecurringForm } from "./recurring-form";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import type { RecurringExpense } from "@/lib/types";

interface RecurringModalProps {
  open: boolean;
  onClose: () => void;
  recurringExpense?: RecurringExpense;
}

export function RecurringModal({ open, onClose, recurringExpense }: RecurringModalProps) {
  const { categories, addRecurringExpense, updateRecurringExpense } = useData();
  const { show } = useToast();
  const isEdit = !!recurringExpense;
  const relevantCategories = categories.filter((c) => c.type !== "income");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit recurring expense" : "Add recurring expense"}
      description={isEdit ? undefined : "Track a subscription or recurring bill."}
    >
      <RecurringForm
        categories={relevantCategories}
        initial={recurringExpense}
        onCancel={onClose}
        onSubmit={async (values) => {
          if (isEdit && recurringExpense) {
            await updateRecurringExpense(recurringExpense.id, values);
            show("Recurring expense updated.");
          } else {
            await addRecurringExpense({ ...values, active: true });
            show("Recurring expense added.");
          }
          onClose();
        }}
      />
    </Modal>
  );
}
