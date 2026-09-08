"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChartTooltipContent } from "./chart-tooltip";

interface SavingsLineChartProps {
  data: { label: string; savings: number }[];
  color?: string;
}

export function SavingsLineChart({ data, color = "#1baf7a" }: SavingsLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                label: "Savings",
                value: p.value as number,
                color,
              }))}
            />
          )}
        />
        <Line
          type="monotone"
          dataKey="savings"
          name="Savings"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
