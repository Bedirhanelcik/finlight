"use client";

import { useData } from "@/context/data-provider";
import { formatCurrency } from "@/lib/currency";

interface TooltipEntry {
  label: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  title?: string;
  entries?: TooltipEntry[];
}

export function ChartTooltipContent({ active, title, entries }: ChartTooltipProps) {
  const { settings } = useData();
  if (!active || !entries || entries.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-surface-raised px-3 py-2 shadow-lg shadow-black/10">
      {title && <p className="mb-1.5 text-xs font-medium text-muted">{title}</p>}
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted">{entry.label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {formatCurrency(entry.value, settings.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
