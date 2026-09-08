"use client";

import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { InsightCard } from "@/components/insights/insight-card";
import { useInsights } from "@/hooks/use-insights";
import { useData } from "@/context/data-provider";

export default function InsightsPage() {
  const insights = useInsights();
  const { transactions } = useData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Insights</h1>
        <p className="mt-1 text-sm text-muted">
          Automatically generated from your transaction history — no external services involved.
        </p>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No data to analyze yet"
          description="Add transactions and Finlight will surface patterns, budget warnings, and trends here."
        />
      ) : insights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No insights right now"
          description="Keep adding transactions — insights update automatically as your data grows."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
