"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChartTooltipContent } from "./chart-tooltip";

interface IncomeExpenseBarChartProps {
  data: { label: string; income: number; expenses: number }[];
  incomeColor?: string;
  expenseColor?: string;
}

export function IncomeExpenseBarChart({
  data,
  incomeColor = "#2a78d6",
  expenseColor = "#e34948",
}: IncomeExpenseBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          dy={8}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-hover)" }}
          content={({ active, payload, label }) => (
            <ChartTooltipContent
              active={active}
              title={label as string}
              entries={payload?.map((p) => ({
                label: p.name as string,
                value: p.value as number,
                color: p.color as string,
              }))}
            />
          )}
        />
        <Bar dataKey="income" name="Income" fill={incomeColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" name="Expenses" fill={expenseColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
