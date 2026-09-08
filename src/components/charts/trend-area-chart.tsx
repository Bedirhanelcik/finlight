"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { ChartTooltipContent } from "./chart-tooltip";

interface TrendAreaChartProps {
  data: { label: string; income: number; expenses: number }[];
  incomeColor?: string;
  expenseColor?: string;
}

export function TrendAreaChart({
  data,
  incomeColor = "#2a78d6",
  expenseColor = "#e34948",
}: TrendAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={incomeColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={incomeColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={expenseColor} stopOpacity={0.16} />
            <stop offset="100%" stopColor={expenseColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          dy={8}
        />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
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
        <Area
          type="monotone"
          dataKey="income"
          name="Income"
          stroke={incomeColor}
          strokeWidth={2}
          fill="url(#incomeFill)"
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke={expenseColor}
          strokeWidth={2}
          fill="url(#expenseFill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
