"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { SparkLine } from "./spark-line";

const PERIODS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

const AGE_GROUPS = ["전체", "10대", "20대", "30대", "40대", "50대 이상"];
const GENDERS = ["전체", "남성", "여성"];

interface TimePoint {
  date: string;
  count: number;
}

interface KeywordItem {
  keyword: string;
  count: number;
  series: TimePoint[];
}

export function TrendingPage() {
  const [period, setPeriod] = useState("week");
  const [ageGroup, setAgeGroup] = useState("전체");
  const [gender, setGender] = useState("전체");
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (ageGroup !== "전체") params.set("age_group", ageGroup);
    if (gender !== "전체") params.set("gender", gender);

    api<{ keywords: KeywordItem[] }>(`/trending/keywords?${params}`)
      .then((data) => setKeywords(data.keywords))
      .catch(() => setKeywords([]))
      .finally(() => setLoading(false));
  }, [period, ageGroup, gender]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Filters */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 space-y-2">
        <div className="flex gap-1">
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
        <div className="flex gap-2 text-sm">
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
          >
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>{ag === "전체" ? "나이대" : ag}</option>
            ))}
          </select>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g === "전체" ? "성별" : g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Keyword list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : keywords.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p className="text-lg">트렌드 데이터가 없습니다</p>
          <p className="mt-1 text-sm">필터를 변경해보세요</p>
        </div>
      ) : (
        <div>
          {keywords.map((kw, i) => (
            <Link
              key={kw.keyword}
              href={`/trending/${encodeURIComponent(kw.keyword)}`}
              className="flex items-center gap-4 px-4 py-4 border-b border-border hover:bg-card/50 transition-colors"
            >
              {/* Rank */}
              <span className="w-8 text-lg font-bold text-accent text-center shrink-0">
                {i + 1}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">#{kw.keyword}</div>
                <div className="text-xs text-muted mt-0.5">반응 {kw.count}건</div>
              </div>

              {/* Sparkline */}
              <div className="w-24 h-10 shrink-0">
                <SparkLine data={kw.series} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
