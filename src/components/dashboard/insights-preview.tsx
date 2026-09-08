"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InsightCard } from "@/components/insights/insight-card";
import { useInsights } from "@/hooks/use-insights";

export function InsightsPreview() {
  const insights = useInsights();

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>Financial insights</CardTitle>
        <Link href="/insights" className="text-sm font-medium text-accent hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No insights yet"
            description="Add a few transactions and insights will appear automatically."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
