"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextInput } from "@/components/ui/form-field";
import type { Category, RecurringExpense, RecurringFrequency } from "@/lib/types";
import { todayInputValue } from "@/lib/calculations";

interface RecurringFormProps {
  categories: Category[];
  initial?: RecurringExpense;
  onSubmit: (values: {
    merchant: string;
    amount: number;
    frequency: RecurringFrequency;
    categoryId: string;
    startDate: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function RecurringForm({ categories, initial, onSubmit, onCancel }: RecurringFormProps) {
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? "monthly");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [startDate, setStartDate] = useState(
    initial ? initial.startDate.slice(0, 10) : todayInputValue(),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!merchant.trim()) nextErrors.merchant = "Merchant name is required.";
    const numeric = Number(amount);
    if (!amount.trim()) nextErrors.amount = "Amount is required.";
    else if (!Number.isFinite(numeric) || numeric <= 0) nextErrors.amount = "Enter a valid amount.";
    if (!categoryId) nextErrors.categoryId = "Select a category.";
    if (!startDate) nextErrors.startDate = "Select a start date.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        merchant: merchant.trim(),
        amount: numeric,
        frequency,
        categoryId,
        startDate: new Date(startDate + "T12:00:00").toISOString(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <TextInput
        label="Merchant / Service"
        required
        placeholder="e.g. Netflix"
        value={merchant}
        error={errors.merchant}
        maxLength={80}
        onChange={(e) => setMerchant(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Amount"
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
        <SelectField
          label="Frequency"
          required
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
        />
      </div>
      <SelectField
        label="Category"
        required
        placeholder="Select a category"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        value={categoryId}
        error={errors.categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      />
      <TextInput
        label="Start date"
        required
        type="date"
        value={startDate}
        error={errors.startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <TextArea
        label="Notes"
        placeholder="Optional notes"
        value={notes}
        maxLength={500}
        rows={2}
        onChange={(e) => setNotes(e.target.value)}
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
          {initial ? "Save changes" : "Add recurring expense"}
        </Button>
      </div>
    </form>
  );
}
