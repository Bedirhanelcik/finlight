import type { Transaction } from "./types";
import type { TransactionFiltersState } from "@/components/transactions/transaction-filters";
import { endOfDay, endOfMonth, monthsAgo, startOfDay, startOfMonth } from "./calculations";

export function applyTransactionFilters(
  transactions: Transaction[],
  filters: TransactionFiltersState,
): Transaction[] {
  let result = transactions;

  if (filters.type !== "all") {
    result = result.filter((t) => t.type === filters.type);
  }

  if (filters.categoryId !== "all") {
    result = result.filter((t) => t.categoryId === filters.categoryId);
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.merchant?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q),
    );
  }

  if (filters.dateRange !== "all") {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);
    switch (filters.dateRange) {
      case "7d":
        start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
        break;
      case "30d":
        start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
        break;
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth": {
        const prev = monthsAgo(now, 1);
        start = startOfMonth(prev);
        end = endOfMonth(prev);
        break;
      }
      default:
        start = startOfDay(now);
    }
    result = result.filter((t) => {
      const d = new Date(t.date).getTime();
      return d >= start.getTime() && d <= end.getTime();
    });
  }

  const sorted = [...result];
  switch (filters.sort) {
    case "date-desc":
      sorted.sort((a, b) => b.date.localeCompare(a.date));
      break;
    case "date-asc":
      sorted.sort((a, b) => a.date.localeCompare(b.date));
      break;
    case "amount-desc":
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case "amount-asc":
      sorted.sort((a, b) => a.amount - b.amount);
      break;
  }

  return sorted;
}
