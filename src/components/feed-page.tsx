"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import type { Post } from "@/lib/types";

const CATEGORIES = ["전체", "뷰티", "테크", "식품", "패션", "생활", "건강"];

const SORTS = [
  { value: "popular", label: "인기순" },
  { value: "latest", label: "최신순" },
  { value: "recommended", label: "추천순" },
];

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("popular");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (category !== "전체") params.set("category", category);
    params.set("sort", sort);
    const user = getAuthUser();
    if (user) params.set("user_id", user.id);

    api<{ posts: Post[] }>(`/feed?${params}`)
      .then((data) => setPosts(data.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [category, sort]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Filters */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat === "전체" ? "전체 카테고리" : cat}</option>
            ))}
          </select>

          <div className="flex rounded-lg border border-border overflow-hidden">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  sort === s.value
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p className="text-lg">아직 게시글이 없습니다</p>
          <p className="mt-1 text-sm">새로운 제품 소식을 기다려주세요</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
