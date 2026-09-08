import { SUPPORTED_CURRENCIES, type ExportBundle } from "./types";

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

export function validateExportBundle(
  raw: unknown,
): ValidationResult<ExportBundle> {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["File does not contain a valid JSON object."] };
  }
  const obj = raw as Record<string, unknown>;

  if (!isArray(obj.transactions)) errors.push("Missing or invalid 'transactions' array.");
  if (!isArray(obj.budgets)) errors.push("Missing or invalid 'budgets' array.");
  if (!isArray(obj.recurringExpenses))
    errors.push("Missing or invalid 'recurringExpenses' array.");
  if (typeof obj.settings !== "object" || obj.settings === null)
    errors.push("Missing or invalid 'settings' object.");

  if (errors.length > 0) return { valid: false, errors };

  const transactions = obj.transactions as unknown[];
  transactions.forEach((t, i) => {
    if (typeof t !== "object" || t === null) {
      errors.push(`Transaction at index ${i} is invalid.`);
      return;
    }
    const tx = t as Record<string, unknown>;
    if (!isString(tx.id)) errors.push(`Transaction ${i}: missing id.`);
    if (tx.type !== "income" && tx.type !== "expense")
      errors.push(`Transaction ${i}: invalid type.`);
    if (!isNumber(tx.amount) || (tx.amount as number) < 0)
      errors.push(`Transaction ${i}: invalid amount.`);
    if (!isString(tx.date) || Number.isNaN(new Date(tx.date as string).getTime()))
      errors.push(`Transaction ${i}: invalid date.`);
    if (!isString(tx.categoryId)) errors.push(`Transaction ${i}: missing categoryId.`);
  });

  const settings = obj.settings as Record<string, unknown>;
  if (
    !SUPPORTED_CURRENCIES.includes(
      settings.currency as (typeof SUPPORTED_CURRENCIES)[number],
    )
  ) {
    errors.push("Settings: unsupported currency code.");
  }

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, errors: [], data: obj as unknown as ExportBundle };
}

export interface TransactionFormValues {
  type: "income" | "expense";
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  merchant: string;
  notes: string;
}

export interface FieldErrors {
  [key: string]: string | undefined;
}

export function validateTransactionForm(
  values: TransactionFormValues,
): FieldErrors {
  const errors: FieldErrors = {};

  const amount = Number(values.amount);
  if (!values.amount.trim()) {
    errors.amount = "Amount is required.";
  } else if (!Number.isFinite(amount)) {
    errors.amount = "Amount must be a valid number.";
  } else if (amount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  } else if (amount > 100_000_000) {
    errors.amount = "Amount is unreasonably large.";
  }

  if (!values.date) {
    errors.date = "Date is required.";
  } else {
    const d = new Date(values.date);
    if (Number.isNaN(d.getTime())) {
      errors.date = "Enter a valid date.";
    }
  }

  if (!values.categoryId) {
    errors.categoryId = "Select a category.";
  }

  if (!values.description.trim()) {
    errors.description = "Add a short description.";
  } else if (values.description.length > 120) {
    errors.description = "Keep description under 120 characters.";
  }

  if (values.merchant.length > 80) {
    errors.merchant = "Keep merchant name under 80 characters.";
  }
  if (values.notes.length > 500) {
    errors.notes = "Keep notes under 500 characters.";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
