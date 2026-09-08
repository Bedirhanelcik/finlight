import type { RecurringFrequency } from "./types";

export function addInterval(date: Date, frequency: RecurringFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export function computeNextOccurrence(
  startDate: string,
  frequency: RecurringFrequency,
  from: Date = new Date(),
): string {
  let cursor = new Date(startDate);
  if (Number.isNaN(cursor.getTime())) {
    cursor = new Date();
  }
  let safety = 0;
  while (cursor.getTime() < from.getTime() && safety < 1000) {
    cursor = addInterval(cursor, frequency);
    safety += 1;
  }
  return cursor.toISOString();
}

export function frequencyLabel(frequency: RecurringFrequency): string {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
  }
}

export function monthlyEquivalent(
  amount: number,
  frequency: RecurringFrequency,
): number {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
  }
}
