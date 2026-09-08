import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatDeltaProps {
  value: number | null;
  positiveIsGood?: boolean;
  suffix?: string;
  className?: string;
}

export function StatDelta({
  value,
  positiveIsGood = true,
  suffix = "%",
  className,
}: StatDeltaProps) {
  if (value === null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-subtle", className)}>
        <Minus className="h-3 w-3" /> No prior data
      </span>
    );
  }

  const isFlat = Math.abs(value) < 0.5;
  const isGood = isFlat ? null : positiveIsGood ? value > 0 : value < 0;
  const Icon = isFlat ? Minus : value > 0 ? ArrowUp : ArrowDown;
  const colorClass = isFlat
    ? "text-subtle"
    : isGood
      ? "text-positive"
      : "text-negative";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium tabular-nums", colorClass, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
