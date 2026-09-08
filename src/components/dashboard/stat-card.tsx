import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { StatDelta } from "@/components/ui/stat-delta";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: number;
  format: (value: number) => string;
  icon: LucideIcon;
  delta?: number | null;
  positiveIsGood?: boolean;
  accent?: "neutral" | "positive" | "negative";
  style?: React.CSSProperties;
}

const ACCENT_CLASSES = {
  neutral: "bg-surface-hover text-muted",
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
};

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  delta,
  positiveIsGood = true,
  accent = "neutral",
  style,
}: StatCardProps) {
  return (
    <Card className="animate-fade-in-up p-5" style={style}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", ACCENT_CLASSES[accent])}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <div className="mt-2.5 text-2xl font-semibold tabular-nums text-foreground">
        <CountUp value={value} format={format} />
      </div>
      {delta !== undefined && (
        <div className="mt-2">
          <StatDelta value={delta} positiveIsGood={positiveIsGood} />
        </div>
      )}
    </Card>
  );
}
