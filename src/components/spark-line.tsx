"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";

interface TimePoint {
  date: string;
  count: number;
}

export function SparkLine({ data }: { data: TimePoint[] }) {
  if (data.length < 2) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-muted">-</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
