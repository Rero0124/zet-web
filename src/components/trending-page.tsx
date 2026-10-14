"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AGE_GROUPS, GENDERS } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import type { Post } from "@/lib/types";
import { TrendIcon } from "./icons";
import { MiniPostRow } from "./mini-post-card";
import { PageColumn } from "./page-column";
import { SparkLine } from "./spark-line";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";

const PERIODS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

interface TimePoint {
  date: string;
  count: number;
}

interface KeywordItem {
  keyword: string;
  count: number;
  series: TimePoint[];
}

function Chips({
  options,
  value,
  onChange,
  allLabel,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
}) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {["", ...options].map((o) => (
        <button
          key={o || "all"}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
            value === o ? "bg-accent/10 text-accent ring-1 ring-accent/40" : "bg-subtle text-foreground/80 hover:bg-border"
          }`}
        >
          {o || allLabel}
        </button>
      ))}
    </div>
  );
}

export function TrendingPage() {
  const [period, setPeriod] = useState("week");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [keywords, setKeywords] = useState<KeywordItem[] | null>(null);
  const [popular, setPopular] = useState<Post[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ period });
    if (ageGroup) params.set("age_group", ageGroup);
    if (gender) params.set("gender", gender);

    api<{ keywords: KeywordItem[] }>(`/trending/keywords?${params}`)
      .then((data) => !cancelled && setKeywords(data.keywords))
      .catch(() => !cancelled && setKeywords([]));
    return () => {
      cancelled = true;
    };
  }, [period, ageGroup, gender]);

  useEffect(() => {
    api<{ posts: Post[] }>(`/feed?sort=popular&limit=10`)
      .then((d) => setPopular(d.posts))
      .catch(() => setPopular([]));
  }, []);

  const audience = [ageGroup, gender].filter(Boolean).join(" ") || "전체 사용자";

  return (
    <PageColumn>
      {/* 필터 */}
      <div className="sticky top-14 z-30 space-y-2.5 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <div role="tablist" className="flex rounded-xl bg-subtle p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              role="tab"
              aria-selected={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                period === p.value ? "bg-background font-semibold shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Chips options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} allLabel="모든 연령" />
        <Chips options={GENDERS} value={gender} onChange={setGender} allLabel="모든 성별" />
      </div>

      <div className="border-b border-border">
        <MiniPostRow title="지금 인기 있는 제품" posts={popular} />
      </div>

      <section>
        <div className="px-4 pb-1 pt-5">
          <h2 className="text-[15px] font-bold">
            반응이 몰린 키워드 · {audience}
          </h2>
          <p className="mt-0.5 text-xs text-muted">좋아요·리뷰·저장 등 실제 반응 수 기준</p>
        </div>

        {keywords === null ? (
          <div className="flex flex-col gap-1 px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : keywords.length === 0 ? (
          <EmptyState
            icon={<TrendIcon size={24} />}
            title="이 조건의 트렌드 데이터가 아직 없어요"
            description="기간을 늘리거나 연령·성별 조건을 바꿔보세요."
          />
        ) : (
          <ol>
            {keywords.map((kw, i) => (
              <li key={kw.keyword}>
                <Link
                  href={`/trending/${encodeURIComponent(kw.keyword)}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-subtle/60"
                >
                  <span className={`w-6 shrink-0 text-center text-lg font-bold ${i < 3 ? "text-accent" : "text-muted"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">#{kw.keyword}</div>
                    <div className="mt-0.5 text-xs text-muted">반응 {formatCount(kw.count)}건</div>
                  </div>
                  <div className="h-9 w-20 shrink-0" aria-hidden="true">
                    <SparkLine data={kw.series} />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PageColumn>
  );
}
