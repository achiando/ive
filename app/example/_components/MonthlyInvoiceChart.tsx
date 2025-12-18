"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyInvoiceChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

export function MonthlyInvoiceChart({ data }: MonthlyInvoiceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Ksh ${value / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
