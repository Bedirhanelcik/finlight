"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useData } from "@/context/data-provider";
import { formatCurrency } from "@/lib/currency";
import { getCategoryColor, OTHER_CATEGORY_COLOR } from "@/lib/colors";
import { getCategoryIcon } from "@/lib/icon-map";
import { ChartTooltipContent } from "./chart-tooltip";
import { distributePercentages, type CategorySpend } from "@/lib/calculations";

interface CategoryDonutChartProps {
  data: CategorySpend[];
  maxSlices?: number;
}

export function CategoryDonutChart({
  data,
  maxSlices = 7,
}: CategoryDonutChartProps) {
  const { settings, resolvedTheme } = useData();

  const top = data.slice(0, maxSlices);
  const rest = data.slice(maxSlices);
  const otherTotal = rest.reduce((sum, c) => sum + c.total, 0);

  const slices = [
    ...top.map((c) => ({
      name: c.category?.name ?? "Uncategorized",
      value: c.total,
      color: getCategoryColor(c.category?.colorIndex ?? 0, resolvedTheme),
      icon: c.category?.icon,
    })),
    ...(otherTotal > 0
      ? [
          {
            name: "Other",
            value: otherTotal,
            color: OTHER_CATEGORY_COLOR[resolvedTheme],
            icon: "more-horizontal",
          },
        ]
      : []),
  ];

  if (slices.length === 0) return null;

  // The pie, the legend, the per-row percentages/amounts, and the center
  // "Total" all derive from this one `slices` array so they can never drift
  // apart - and percentages are apportioned together (not each rounded in
  // isolation) so they add up to exactly 100.
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const percentages = distributePercentages(slices.map((s) => s.value));

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-48 w-48 shrink-0 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltipContent
                  active={active}
                  entries={payload?.map((p) => ({
                    label: p.name as string,
                    value: p.value as number,
                    color: (p.payload as { color: string }).color,
                  }))}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-subtle">Total</span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatCurrency(total, settings.currency, { compact: true })}
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-2.5" aria-label="Category breakdown">
        {slices.map((slice, index) => {
          const Icon = getCategoryIcon(slice.icon ?? "more-horizontal");
          const pct = percentages[index];
          // A share can legitimately floor to 0% (e.g. ₺2.50 of ₺558.10 is
          // under half a percent) - showing a bare "0%" next to a non-zero
          // amount reads as broken, so say "<1%" instead of implying there's
          // no spending in that category at all.
          const pctLabel = pct === 0 && slice.value > 0 ? "<1%" : `${pct}%`;
          return (
            <li key={slice.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${slice.color}1f` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: slice.color }} aria-hidden />
              </span>
              <span className="flex-1 truncate text-foreground">{slice.name}</span>
              <span className="tabular-nums text-muted">{pctLabel}</span>
              <span className="w-20 text-right tabular-nums font-medium text-foreground">
                {formatCurrency(slice.value, settings.currency, { compact: true })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
