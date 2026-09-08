"use client";

import { useMemo } from "react";
import { useData } from "@/context/data-provider";
import { generateInsights } from "@/lib/insights-engine";
import type { Insight } from "@/lib/types";

export function useInsights(): Insight[] {
  const { transactions, categories, budgets, recurringExpenses, settings } = useData();

  return useMemo(
    () =>
      generateInsights({
        transactions,
        categories,
        budgets,
        recurringExpenses,
        currency: settings.currency,
      }),
    [transactions, categories, budgets, recurringExpenses, settings.currency],
  );
}
