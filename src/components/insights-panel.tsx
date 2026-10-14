"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { formatCount, formatRating } from "@/lib/format";
import type { LabelCount, Post, PostInsights } from "@/lib/types";
import { ChartIcon } from "./icons";
import { Skeleton } from "./ui/skeleton";

const SERIES = [
  { key: "impressions", label: "노출", color: "var(--color-accent)" },
  { key: "clicks", label: "클릭", color: "var(--color-series-2)" },
] as const;

/** 게시글 작성자(브랜드)에게만 보이는 광고 성과 */
export function InsightsPanel({ post }: { post: Post }) {
  const user = useAuthUser();
  const [data, setData] = useState<PostInsights | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<{ insights: PostInsights }>(`/posts/${post.id}/insights?author_id=${user.id}`)
      .then((d) => !cancelled && setData(d.insights))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [post.id, user]);

  // 성과 API를 쓸 수 없을 때도 게시글에 있는 집계로 기본 지표는 보여준다
  const fallback: PostInsights = {
    impressions: post.impressions,
    clicks: post.clicks,
    cta_clicks: 0,
    ctr: post.impressions ? Math.round((post.clicks / post.impressions) * 1000) / 10 : 0,
    avg_dwell_ms: 0,
    likes: post.like_count,
    bookmarks: post.bookmark_count,
    reviews: post.review_count,
    questions: post.question_count ?? 0,
    avg_rating: post.avg_rating ?? null,
    series: [],
    audience: { age: [], gender: [], region: [] },
  };
  const d = data ?? (failed ? fallback : null);

  return (
    <section id="insights" className="scroll-mt-28 border-b border-border px-4 py-5">
      <div className="flex items-center gap-2">
        <ChartIcon size={18} className="text-accent" />
        <h2 className="text-[15px] font-bold">광고 성과</h2>
        <span className="ml-auto text-xs text-muted">나에게만 보여요</span>
      </div>

      {!d ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="노출 (도달 사용자)" value={formatCount(d.impressions)} />
            <Stat label="상세 클릭" value={formatCount(d.clicks)} hint={`클릭률 ${d.ctr.toFixed(1)}%`} />
            <Stat label="구매 링크 클릭" value={formatCount(d.cta_clicks)} hint={post.link_url ? undefined : "구매 링크 미설정"} />
            <Stat
              label="평균 체류"
              value={d.avg_dwell_ms ? `${(d.avg_dwell_ms / 1000).toFixed(1)}초` : "-"}
            />
            <Stat label="좋아요 · 저장" value={`${formatCount(d.likes)} · ${formatCount(d.bookmarks)}`} />
            <Stat
              label="리뷰 · 평균 별점"
              value={`${formatCount(d.reviews)} · ${formatRating(d.avg_rating)}`}
              hint={d.questions ? `질문 ${d.questions}개` : undefined}
            />
          </div>

          <TrendChart
            // 게시 전 날짜의 0은 의미가 없으므로 게시일부터 표시
            series={d.series.filter((s) => s.date >= post.created_at.slice(0, 10))}
          />

          {(d.audience.age.length > 0 || d.audience.gender.length > 0 || d.audience.region.length > 0) && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">반응한 사용자</h3>
              <p className="mt-0.5 text-xs text-muted">노출·클릭·좋아요·리뷰 등 반응한 사용자 기준 (중복 제외)</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <AudienceBars title="연령대" items={d.audience.age} />
                <AudienceBars title="성별" items={d.audience.gender} />
                <AudienceBars title="지역" items={d.audience.region.slice(0, 5)} />
              </div>
            </div>
          )}

          {failed && <p className="mt-3 text-xs text-muted">상세 성과를 불러오지 못해 기본 지표만 표시하고 있어요.</p>}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-subtle px-3.5 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function TrendChart({ series }: { series: PostInsights["series"] }) {
  if (series.length < 2) {
    return <p className="mt-5 text-xs text-muted">게시 후 이틀이 지나면 일별 추이를 볼 수 있어요.</p>;
  }
  const data = series.map((s) => ({ ...s, label: s.date.slice(5).replace("-", "/") }));
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">일별 추이 (최근 14일)</h3>
        {/* 2개 시리즈 → 범례 필수 (선 모양 키) */}
        <div className="flex items-center gap-3 text-xs text-muted">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickFormatter={(v: number) => formatCount(v)}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-muted)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 text-muted">{label}</p>
                    {SERIES.map((s) => {
                      const item = payload.find((p) => p.dataKey === s.key);
                      return (
                        <p key={s.key} className="flex items-center gap-2">
                          <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                          <span className="font-semibold text-foreground">{formatCount(Number(item?.value ?? 0))}</span>
                          <span className="text-muted">{s.label}</span>
                        </p>
                      );
                    })}
                  </div>
                ) : null
              }
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-1 text-xs">
        <summary className="cursor-pointer text-muted hover:text-foreground">표로 보기</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 font-medium">날짜</th>
              <th className="py-1 text-right font-medium">노출</th>
              <th className="py-1 text-right font-medium">클릭</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.date} className="border-t border-border">
                <td className="py-1">{s.date}</td>
                <td className="py-1 text-right">{s.impressions}</td>
                <td className="py-1 text-right">{s.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** 단일 시리즈 가로 막대 — 한 가지 색, 값은 막대 끝 텍스트로 */
function AudienceBars({ title, items }: { title: string; items: LabelCount[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted">데이터 없음</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 truncate">{i.label}</span>
              <div className="flex h-2.5 flex-1 items-center">
                <div className="h-full rounded-r-[4px] bg-accent" style={{ width: `${(i.count / max) * 100}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-muted">
                {Math.round((i.count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
