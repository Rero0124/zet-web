"use client";

import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface TimePoint {
  date: string;
  count: number;
}

export function SparkLine({ data }: { data: TimePoint[] }) {
  if (data.length < 2) {
    return <div className="flex h-full w-full items-center justify-center text-xs text-muted">-</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <YAxis hide domain={[0, "dataMax"]} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
