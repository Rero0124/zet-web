"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const PERIODS = [
  { value: "week", label: "1주" },
  { value: "month", label: "1개월" },
];

interface TimePoint {
  date: string;
  count: number;
}

interface RegionItem {
  region: string;
  count: number;
}

interface KeywordItem {
  keyword: string;
  count: number;
}

interface KeywordData {
  keyword: string;
  total_interactions: number;
  period: string;
  series: TimePoint[];
  regions: RegionItem[];
  related_topics: KeywordItem[];
  related_searches: KeywordItem[];
}

export function KeywordDetail({ keyword }: { keyword: string }) {
  const [data, setData] = useState<KeywordData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<KeywordData>(`/trending/keywords/${encodeURIComponent(keyword)}?period=${period}`)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [keyword, period]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="py-20 text-center text-muted">데이터를 찾을 수 없습니다</div>;
  }

  const maxRegionCount = data.regions.length > 0 ? Math.max(...data.regions.map((r) => r.count)) : 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/trending" className="text-sm text-muted hover:text-foreground transition-colors">
          ← 트렌드
        </Link>
        <h1 className="text-2xl font-bold mt-2">#{keyword}</h1>
        <p className="text-sm text-muted mt-1">총 반응 {data.total_interactions}건</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              period === p.value ? "bg-foreground text-background" : "text-muted hover:bg-border"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Time series chart */}
      <div className="rounded-lg border border-border p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">시간 흐름에 따른 관심도</h2>
        {data.series.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted">
            데이터가 부족합니다
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  tickFormatter={(d) => d.slice(5)} // MM-DD
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="반응수"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Regional interest */}
      {data.regions.length > 0 && (
        <div className="rounded-lg border border-border p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">지역별 관심도</h2>
          <div className="flex flex-col gap-2">
            {data.regions.map((r) => (
              <div key={r.region} className="flex items-center gap-3">
                <span className="w-16 text-sm shrink-0">{r.region}</span>
                <div className="flex-1 bg-border rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all"
                    style={{ width: `${(r.count / maxRegionCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-8 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related topics + searches side by side */}
      <div className="grid grid-cols-2 gap-4">
        {data.related_topics.length > 0 && (
          <div className="rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold mb-3">관련 주제</h2>
            <div className="flex flex-col gap-2">
              {data.related_topics.map((t) => (
                <Link
                  key={t.keyword}
                  href={`/trending/${encodeURIComponent(t.keyword)}`}
                  className="flex items-center justify-between text-sm hover:text-accent transition-colors"
                >
                  <span>#{t.keyword}</span>
                  <span className="text-xs text-muted">{t.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {data.related_searches.length > 0 && (
          <div className="rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold mb-3">관련 검색어</h2>
            <div className="flex flex-col gap-2">
              {data.related_searches.map((s) => (
                <Link
                  key={s.keyword}
                  href={`/trending/${encodeURIComponent(s.keyword)}`}
                  className="flex items-center justify-between text-sm hover:text-accent transition-colors"
                >
                  <span>#{s.keyword}</span>
                  <span className="text-xs text-muted">{s.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
