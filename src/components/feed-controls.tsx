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

export function FeedControls({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialPosts.length);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("popular");
  const [filtered, setFiltered] = useState(false);

  // Initial load if no server-provided data
  useEffect(() => {
    if (initialPosts.length > 0) return;
    applyFilter("전체", "popular");
  }, []);

  async function applyFilter(newCategory: string, newSort: string) {
    setCategory(newCategory);
    setSort(newSort);
    setLoading(true);
    setFiltered(true);

    const params = new URLSearchParams();
    if (newCategory !== "전체") params.set("category", newCategory);
    params.set("sort", newSort);
    params.set("limit", "15");
    const user = getAuthUser();
    if (user) params.set("user_id", user.id);

    try {
      const data = await api<{ posts: Post[] }>(`/feed?${params}`);
      setPosts(data.posts);
      setCursor(data.posts.length);
      setHasMore(data.posts.length >= 15);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }

  async function loadMore() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "전체") params.set("category", category);
    params.set("sort", sort);
    params.set("cursor", String(cursor));
    params.set("limit", "15");
    const user = getAuthUser();
    if (user) params.set("user_id", user.id);

    try {
      const data = await api<{ posts: Post[] }>(`/feed?${params}`);
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor((prev) => prev + data.posts.length);
      setHasMore(data.posts.length >= 15);
    } catch { /* */ }
    setLoading(false);
  }

  return (
    <>
      {/* Filters */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <select
            value={category}
            onChange={(e) => applyFilter(e.target.value, sort)}
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
                onClick={() => applyFilter(category, s.value)}
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
      {posts.length === 0 && !loading ? (
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

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted hover:bg-border transition-colors disabled:opacity-50"
          >
            {loading ? "로딩 중..." : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}
