"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { api } from "@/lib/api";
import type { Post, KeywordTrend } from "@/lib/types";

const PERIODS = [
  { value: "day", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

const AGE_GROUPS = ["전체", "10대", "20대", "30대", "40대", "50대 이상"];
const GENDERS = ["전체", "남성", "여성"];
const CATEGORIES = ["전체", "뷰티", "테크", "식품", "패션", "생활", "건강"];

export function TrendingPage() {
  const [period, setPeriod] = useState("week");
  const [ageGroup, setAgeGroup] = useState("전체");
  const [gender, setGender] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [posts, setPosts] = useState<Post[]>([]);
  const [keywords, setKeywords] = useState<KeywordTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (ageGroup !== "전체") params.set("age_group", ageGroup);
    if (gender !== "전체") params.set("gender", gender);
    if (category !== "전체") params.set("category", category);

    Promise.all([
      api<{ posts: Post[] }>(`/trending?${params}`),
      api<{ keywords: KeywordTrend[] }>(`/trending/keywords?${params}`),
    ])
      .then(([postsData, keywordsData]) => {
        setPosts(postsData.posts);
        setKeywords(keywordsData.keywords);
      })
      .catch(() => {
        setPosts([]);
        setKeywords([]);
      })
      .finally(() => setLoading(false));
  }, [period, ageGroup, gender, category]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Filters */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 space-y-2">
        {/* Period */}
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Demographic filters */}
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "전체" ? "카테고리" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Trending keywords */}
          {keywords.length > 0 && (
            <div className="px-4 py-4 border-b border-border">
              <h2 className="text-sm font-semibold mb-3">인기 키워드</h2>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span
                    key={kw.keyword}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm"
                  >
                    <span className="font-semibold text-accent">{i + 1}</span>
                    #{kw.keyword}
                    <span className="text-xs text-muted">{kw.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trending posts */}
          {posts.length === 0 ? (
            <div className="py-20 text-center text-muted">
              <p className="text-lg">트렌드 데이터가 없습니다</p>
              <p className="mt-1 text-sm">필터를 변경해보세요</p>
            </div>
          ) : (
            <div>
              {posts.map((post, i) => (
                <div key={post.id} className="flex">
                  <div className="flex w-10 shrink-0 items-start justify-center pt-5 text-lg font-bold text-accent">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <PostCard post={post} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
