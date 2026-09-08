"use client";

import { cn } from "@/lib/cn";

interface ProgressBarProps {
  percentage: number;
  status?: "good" | "warning" | "critical";
  className?: string;
  trackClassName?: string;
}

const STATUS_CLASSES = {
  good: "bg-positive",
  warning: "bg-warning",
  critical: "bg-negative",
};

export function ProgressBar({
  percentage,
  status = "good",
  className,
  trackClassName,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-hover", trackClassName)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
          STATUS_CLASSES[status],
          className,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
