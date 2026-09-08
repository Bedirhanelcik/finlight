"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextInput } from "@/components/ui/form-field";
import { cn } from "@/lib/cn";
import { todayInputValue } from "@/lib/calculations";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import {
  hasErrors,
  validateTransactionForm,
  type FieldErrors,
  type TransactionFormValues,
} from "@/lib/validation";

function toInputValues(transaction?: Transaction): TransactionFormValues {
  if (!transaction) {
    return {
      type: "expense",
      amount: "",
      date: todayInputValue(),
      categoryId: "",
      description: "",
      merchant: "",
      notes: "",
    };
  }
  const d = new Date(transaction.date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    date: d.toISOString().slice(0, 10),
    categoryId: transaction.categoryId,
    description: transaction.description,
    merchant: transaction.merchant ?? "",
    notes: transaction.notes ?? "",
  };
}

interface TransactionFormProps {
  categories: Category[];
  initialTransaction?: Transaction;
  onSubmit: (values: {
    type: TransactionType;
    amount: number;
    date: string;
    categoryId: string;
    description: string;
    merchant?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function TransactionForm({
  categories,
  initialTransaction,
  onSubmit,
  onCancel,
  submitLabel = "Add transaction",
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(() =>
    toInputValues(initialTransaction),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === values.type || c.type === "both"),
    [categories, values.type],
  );

  function setType(type: TransactionType) {
    setValues((prev) => {
      const stillValid = categories.some(
        (c) => c.id === prev.categoryId && (c.type === type || c.type === "both"),
      );
      return { ...prev, type, categoryId: stillValid ? prev.categoryId : "" };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validateTransactionForm(values);
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        type: values.type,
        amount: Number(values.amount),
        date: new Date(values.date + "T12:00:00").toISOString(),
        categoryId: values.categoryId,
        description: values.description.trim(),
        merchant: values.merchant.trim() || undefined,
        notes: values.notes.trim() || undefined,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transaction type">
        <button
          type="button"
          role="radio"
          aria-checked={values.type === "expense"}
          onClick={() => setType("expense")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors",
            values.type === "expense"
              ? "border-negative bg-negative-bg text-negative"
              : "border-border text-muted hover:bg-surface-hover",
          )}
        >
          <ArrowDownLeft className="h-4 w-4" /> Expense
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={values.type === "income"}
          onClick={() => setType("income")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors",
            values.type === "income"
              ? "border-positive bg-positive-bg text-positive"
              : "border-border text-muted hover:bg-surface-hover",
          )}
        >
          <ArrowUpRight className="h-4 w-4" /> Income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Amount"
          required
          inputMode="decimal"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={values.amount}
          error={errors.amount}
          onChange={(e) => setValues((prev) => ({ ...prev, amount: e.target.value }))}
        />
        <TextInput
          label="Date"
          required
          type="date"
          value={values.date}
          error={errors.date}
          max={todayInputValue()}
          onChange={(e) => setValues((prev) => ({ ...prev, date: e.target.value }))}
        />
      </div>

      <SelectField
        label="Category"
        required
        placeholder="Select a category"
        options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
        value={values.categoryId}
        error={errors.categoryId}
        onChange={(e) => setValues((prev) => ({ ...prev, categoryId: e.target.value }))}
      />

      <TextInput
        label="Description"
        required
        placeholder="e.g. Weekly groceries"
        value={values.description}
        error={errors.description}
        maxLength={120}
        onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
      />

      <TextInput
        label="Merchant"
        placeholder="e.g. Migros (optional)"
        value={values.merchant}
        error={errors.merchant}
        maxLength={80}
        onChange={(e) => setValues((prev) => ({ ...prev, merchant: e.target.value }))}
      />

      <TextArea
        label="Notes"
        placeholder="Optional notes"
        value={values.notes}
        error={errors.notes}
        maxLength={500}
        rows={2}
        onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
