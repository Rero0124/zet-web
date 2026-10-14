"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { useHiddenPosts } from "@/lib/hidden-posts";
import { useHydrated } from "@/lib/hooks";
import type { Post } from "@/lib/types";
import { PostCard } from "./post-card";
import { PostSkeleton } from "./ui/skeleton";

const PAGE_SIZE = 10;

/**
 * `{ posts }`를 돌려주는 목록 API를 무한 스크롤로 보여준다.
 * 로그인 사용자를 viewer로 넘겨 좋아요/저장 상태를 함께 받는다.
 */
export function PostList({
  path,
  params,
  viewerParam = "viewer_id",
  empty,
  onLoaded,
}: {
  path: string;
  params?: Record<string, string | undefined>;
  viewerParam?: string;
  empty: ReactNode;
  onLoaded?: (total: number) => void;
}) {
  const hydrated = useHydrated();
  const user = useAuthUser();
  const hidden = useHiddenPosts();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });
  const paramsKey = JSON.stringify(params ?? {});

  const load = useCallback(
    async (cursor: number) => {
      const id = ++requestId.current;
      setLoading(true);
      setError("");
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), cursor: String(cursor) });
      for (const [k, v] of Object.entries(JSON.parse(paramsKey) as Record<string, string | undefined>)) {
        if (v) qs.set(k, v);
      }
      if (user) qs.set(viewerParam, user.id);
      try {
        const data = await api<{ posts: Post[] }>(`${path}?${qs}`);
        if (id !== requestId.current) return;
        setPosts((prev) => {
          const base = cursor === 0 || !prev ? [] : prev;
          const seen = new Set(base.map((p) => p.id));
          return [...base, ...data.posts.filter((p) => !seen.has(p.id))];
        });
        setHasMore(data.posts.length >= PAGE_SIZE);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : "불러오지 못했어요");
        if (cursor === 0) setPosts([]);
        setHasMore(false);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [path, paramsKey, user, viewerParam],
  );

  useEffect(() => {
    if (posts) onLoadedRef.current?.(posts.length);
  }, [posts]);

  useEffect(() => {
    if (!hydrated) return;
    setPosts(null);
    setHasMore(true);
    load(0);
  }, [hydrated, load]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !posts || !hasMore || loading) return;
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && load(posts.length), {
      rootMargin: "600px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [posts, hasMore, loading, load]);

  if (posts === null) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  const visible = posts.filter((p) => !hidden.has(p.id));

  if (visible.length === 0) {
    return error ? <p className="px-4 py-16 text-center text-sm text-muted">{error}</p> : <>{empty}</>;
  }

  return (
    <div>
      {visible.map((p) => (
        <PostCard key={p.id} post={p} onDeleted={(id) => setPosts((prev) => prev?.filter((x) => x.id !== id) ?? null)} />
      ))}
      <div ref={sentinel} />
      {loading && <PostSkeleton />}
    </div>
  );
}
