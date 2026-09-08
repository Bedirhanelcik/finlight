"use client";

import { cn } from "@/lib/cn";

export type AnalyticsRange = "7d" | "30d" | "3m" | "6m" | "12m";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "12m", label: "12M" },
];

export function RangeSelector({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Time range"
      className="inline-flex gap-0.5 rounded-md border border-border bg-surface p-0.5"
    >
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="radio"
          aria-checked={value === r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded px-2.5 py-1.5 text-xs font-semibold transition-colors",
            value === r.value
              ? "bg-primary text-primary-foreground"
              : "text-muted hover:text-foreground",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
