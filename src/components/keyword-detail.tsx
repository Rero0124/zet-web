"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { formatCount } from "@/lib/format";
import { ChevronLeftIcon, SearchIcon } from "./icons";
import { PageColumn } from "./page-column";
import { PostList } from "./post-list";
import { EmptyState } from "./ui/empty-state";
import { Spinner } from "./ui/skeleton";

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
  const router = useRouter();
  const [data, setData] = useState<KeywordData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loadedKey, setLoadedKey] = useState("");
  const requestKey = `${keyword}|${period}`;
  // 새 기간을 불러오는 동안에는 이전 차트를 흐리게 유지 (레이아웃 점프 방지)
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    api<KeywordData>(`/trending/keywords/${encodeURIComponent(keyword)}?period=${period}`)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoadedKey(`${keyword}|${period}`));
    return () => {
      cancelled = true;
    };
  }, [keyword, period]);

  const maxRegionCount = data && data.regions.length > 0 ? Math.max(...data.regions.map((r) => r.count)) : 1;
  const related = [...(data?.related_topics ?? []), ...(data?.related_searches ?? [])].filter(
    (k, i, arr) => arr.findIndex((x) => x.keyword === k.keyword) === i,
  );

  return (
    <PageColumn>
      <div className="sticky top-14 z-30 flex h-12 items-center gap-1 border-b border-border bg-background/90 px-2 backdrop-blur-md">
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/trending"))}
          aria-label="뒤로 가기"
          className="rounded-full p-1.5 hover:bg-subtle"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <span className="text-[15px] font-semibold">트렌드</span>
      </div>

      <div className="px-4 pt-5">
        <h1 className="text-2xl font-bold tracking-tight">#{keyword}</h1>
        <p className="mt-1 text-sm text-muted">
          {data ? `최근 ${period === "week" ? "1주" : "1개월"} 반응 ${formatCount(data.total_interactions)}건` : " "}
        </p>
        <div className="mt-4 flex gap-1 rounded-xl bg-subtle p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${
                period === p.value ? "bg-background font-semibold shadow-sm" : "text-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : !data ? (
        <p className="py-16 text-center text-sm text-muted">트렌드 데이터를 불러오지 못했어요</p>
      ) : (
        <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
          {/* 관심도 추이 (단일 시리즈 → 범례 없이 제목으로 설명) */}
          <section className="mx-4 mt-4 rounded-2xl border border-border p-4">
            <h2 className="text-sm font-semibold">일별 반응 수</h2>
            {data.series.length < 2 ? (
              <div className="flex h-44 items-center justify-center text-sm text-muted">아직 추이를 보여줄 데이터가 부족해요</div>
            ) : (
              <div className="mt-3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: "var(--color-border)" }}
                      tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                      tickFormatter={(d: string) => d.slice(5).replace("-", "/")}
                      minTickGap={16}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--color-muted)", strokeWidth: 1 }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                            <p className="text-muted">{String(label)}</p>
                            <p className="mt-0.5">
                              <span className="font-semibold">{formatCount(Number(payload[0].value))}</span>{" "}
                              <span className="text-muted">반응</span>
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      strokeLinecap="round"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {data.regions.length > 0 && (
            <section className="mx-4 mt-3 rounded-2xl border border-border p-4">
              <h2 className="mb-3 text-sm font-semibold">지역별 반응</h2>
              <ul className="flex flex-col gap-2">
                {data.regions.map((r) => (
                  <li key={r.region} className="flex items-center gap-3 text-sm">
                    <span className="w-12 shrink-0">{r.region}</span>
                    <div className="flex h-2.5 flex-1 items-center">
                      <div
                        className="h-full rounded-r-[4px] bg-accent"
                        style={{ width: `${(r.count / maxRegionCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-muted">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section className="px-4 pt-5">
              <h2 className="mb-2 text-sm font-semibold">함께 반응한 키워드</h2>
              <div className="flex flex-wrap gap-2">
                {related.map((t) => (
                  <Link
                    key={t.keyword}
                    href={`/trending/${encodeURIComponent(t.keyword)}`}
                    className="rounded-full bg-subtle px-3 py-1.5 text-sm hover:bg-border"
                  >
                    #{t.keyword}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <section className="mt-6 border-t border-border">
        <div className="flex items-center justify-between px-4 pb-1 pt-5">
          <h2 className="text-[15px] font-bold">#{keyword} 관련 제품</h2>
          <Link
            href={`/search?q=${encodeURIComponent(`#${keyword}`)}`}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <SearchIcon size={13} />
            검색에서 보기
          </Link>
        </div>
        <PostList
          path="/search"
          params={{ q: `#${keyword}` }}
          empty={<EmptyState title="관련 제품이 아직 없어요" />}
        />
      </section>
    </PageColumn>
  );
}
