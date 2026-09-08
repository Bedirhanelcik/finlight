"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";

export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
export type DateRangeOption = "all" | "7d" | "30d" | "thisMonth" | "lastMonth";

export interface TransactionFiltersState {
  search: string;
  type: "all" | "income" | "expense";
  categoryId: string;
  dateRange: DateRangeOption;
  sort: SortOption;
}

export const DEFAULT_FILTERS: TransactionFiltersState = {
  search: "",
  type: "all",
  categoryId: "all",
  dateRange: "all",
  sort: "date-desc",
};

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
  categories: Category[];
}

const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Highest amount",
  "amount-asc": "Lowest amount",
};

const RANGE_LABELS: Record<DateRangeOption, string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
};

export function TransactionFilters({ filters, onChange, categories }: TransactionFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters =
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.dateRange !== "all" ||
    filters.search !== "";

  function update(patch: Partial<TransactionFiltersState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search transactions..."
            aria-label="Search transactions"
            className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
            expanded || hasActiveFilters
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-muted hover:bg-surface-hover",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
              !
            </span>
          )}
        </button>
      </div>

      {expanded && (
        <div className="animate-fade-in-up flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-3">
          <select
            value={filters.type}
            onChange={(e) => update({ type: e.target.value as TransactionFiltersState["type"] })}
            className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground"
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filters.categoryId}
            onChange={(e) => update({ categoryId: e.target.value })}
            className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => update({ dateRange: e.target.value as DateRangeOption })}
            className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground"
            aria-label="Filter by date range"
          >
            {(Object.keys(RANGE_LABELS) as DateRangeOption[]).map((key) => (
              <option key={key} value={key}>
                {RANGE_LABELS[key]}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground"
            aria-label="Sort transactions"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
