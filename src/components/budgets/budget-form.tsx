"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, TextInput } from "@/components/ui/form-field";
import type { Budget, Category } from "@/lib/types";

interface BudgetFormProps {
  categories: Category[];
  initialBudget?: Budget;
  onSubmit: (values: { categoryId: string; amount: number }) => Promise<void>;
  onCancel: () => void;
}

export function BudgetForm({ categories, initialBudget, onSubmit, onCancel }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(initialBudget?.categoryId ?? "");
  const [amount, setAmount] = useState(
    initialBudget ? String(initialBudget.amount) : "",
  );
  const [errors, setErrors] = useState<{ categoryId?: string; amount?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: { categoryId?: string; amount?: string } = {};
    if (!categoryId) nextErrors.categoryId = "Select a category.";
    const numeric = Number(amount);
    if (!amount.trim()) nextErrors.amount = "Amount is required.";
    else if (!Number.isFinite(numeric) || numeric <= 0)
      nextErrors.amount = "Enter an amount greater than zero.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ categoryId, amount: numeric });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <SelectField
        label="Category"
        required
        placeholder="Select a category"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        value={categoryId}
        error={errors.categoryId}
        disabled={!!initialBudget}
        onChange={(e) => setCategoryId(e.target.value)}
      />
      <TextInput
        label="Monthly budget amount"
        required
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={amount}
        error={errors.amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      {submitError && (
        <p role="alert" className="text-sm font-medium text-negative">
          {submitError}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initialBudget ? "Save changes" : "Create budget"}
        </Button>
      </div>
    </form>
  );
}
