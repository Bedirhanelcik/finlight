import {
  AlertCircle,
  PiggyBank,
  Repeat,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Insight } from "@/lib/types";
import { cn } from "@/lib/cn";

const CATEGORY_ICONS: Record<Insight["category"], typeof Sparkles> = {
  spending: TrendingUp,
  budget: Wallet,
  savings: PiggyBank,
  recurring: Repeat,
  trend: TrendingDown,
};

const SEVERITY_STYLES: Record<Insight["severity"], { bg: string; text: string }> = {
  positive: { bg: "bg-positive-bg", text: "text-positive" },
  neutral: { bg: "bg-surface-hover", text: "text-muted" },
  warning: { bg: "bg-warning-bg", text: "text-warning" },
  critical: { bg: "bg-negative-bg", text: "text-negative" },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const Icon = CATEGORY_ICONS[insight.category] ?? AlertCircle;
  const style = SEVERITY_STYLES[insight.severity];

  return (
    <div className="animate-fade-in-up flex gap-3 rounded-lg border border-border bg-surface p-4">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", style.bg)}>
        <Icon className={cn("h-4 w-4", style.text)} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{insight.title}</p>
        <p className="mt-0.5 text-sm text-muted">{insight.detail}</p>
      </div>
    </div>
  );
}
