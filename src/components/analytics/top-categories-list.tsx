"use client";

import { CategoryIcon } from "@/components/shared/category-icon";
import { useData } from "@/context/data-provider";
import { formatCurrency } from "@/lib/currency";
import { getCategoryColor } from "@/lib/colors";
import type { CategorySpend } from "@/lib/calculations";

export function TopCategoriesList({ data }: { data: CategorySpend[] }) {
  const { settings, resolvedTheme } = useData();
  const max = data[0]?.total ?? 1;

  return (
    <div className="flex flex-col gap-4">
      {data.slice(0, 8).map((c, i) => {
        const color = getCategoryColor(c.category?.colorIndex ?? 0, resolvedTheme);
        const width = Math.max((c.total / max) * 100, 3);
        return (
          <div key={c.categoryId} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-xs font-semibold text-subtle">{i + 1}</span>
            <CategoryIcon icon={c.category?.icon ?? "more-horizontal"} colorIndex={c.category?.colorIndex ?? 0} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium text-foreground">
                  {c.category?.name ?? "Uncategorized"}
                </span>
                <span className="ml-2 shrink-0 tabular-nums font-semibold text-foreground">
                  {formatCurrency(c.total, settings.currency, { compact: true })}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
