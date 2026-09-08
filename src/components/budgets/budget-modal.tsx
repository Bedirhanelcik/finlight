"use client";

import { Modal } from "@/components/ui/modal";
import { BudgetForm } from "./budget-form";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import type { Budget } from "@/lib/types";

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  budget?: Budget;
}

export function BudgetModal({ open, onClose, budget }: BudgetModalProps) {
  const { categories, budgets, addBudget, updateBudget } = useData();
  const { show } = useToast();
  const isEdit = !!budget;

  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter(
    (c) =>
      (c.type === "expense" || c.type === "both") &&
      (isEdit ? c.id === budget.categoryId : !usedCategoryIds.has(c.id)),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit budget" : "Create budget"}
      description={isEdit ? undefined : "Set a monthly spending limit for a category."}
      size="sm"
    >
      <BudgetForm
        categories={availableCategories}
        initialBudget={budget}
        onCancel={onClose}
        onSubmit={async (values) => {
          if (isEdit && budget) {
            await updateBudget(budget.id, { amount: values.amount });
            show("Budget updated.");
          } else {
            await addBudget({ categoryId: values.categoryId, amount: values.amount, period: "monthly" });
            show("Budget created.");
          }
          onClose();
        }}
      />
    </Modal>
  );
}
