"use client";

import { useState } from "react";
import { PostCard } from "./post-card";
import { api } from "@/lib/api";
import type { Post } from "@/lib/types";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await api<{ posts: Post[] }>(`/search?q=${encodeURIComponent(query.trim())}`);
      setPosts(data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Search bar */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="제품, 브랜드, 키워드 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            검색
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : !searched ? (
        <div className="py-20 text-center text-muted">
          <p className="text-lg">관심 있는 제품을 검색해보세요</p>
          <p className="mt-1 text-sm">키워드, 브랜드명, 카테고리로 검색할 수 있어요</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p className="text-lg">검색 결과가 없습니다</p>
          <p className="mt-1 text-sm">다른 키워드로 검색해보세요</p>
        </div>
      ) : (
        <div>
          <p className="px-4 py-3 text-sm text-muted">
            &quot;{query}&quot; 검색 결과 {posts.length}건
          </p>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
