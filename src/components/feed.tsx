"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser, useAuthUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { feedCache, feedFilter, type FeedCacheEntry } from "@/lib/feed-cache";
import { loginPath } from "@/lib/format";
import { useHiddenPosts } from "@/lib/hidden-posts";
import { useHydrated } from "@/lib/hooks";
import type { Post } from "@/lib/types";
import { BrandCarousel, BrandList } from "./brand-suggestions";
import { HeartIcon, SparkleIcon, UserIcon } from "./icons";
import { PostCard } from "./post-card";
import { EmptyState } from "./ui/empty-state";
import { PostSkeleton } from "./ui/skeleton";

const PAGE_SIZE = 10;

const TABS = [
  { key: "recommended", label: "추천" },
  { key: "following", label: "팔로잉" },
  { key: "popular", label: "인기" },
  { key: "latest", label: "최신" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function Feed() {
  const hydrated = useHydrated();
  const user = useAuthUser();
  const hidden = useHiddenPosts();
  const [tab, setTab] = useState<TabKey>(feedFilter.sort as TabKey);
  const [category, setCategory] = useState(feedFilter.category);
  const key = feedKey(tab, category, user?.id);
  const keyRef = useRef(key);
  // 뒤로가기로 돌아온 경우 캐시된 목록을 첫 렌더부터 그려야 스크롤 위치를 복원할 수 있다
  // (첫 페이지 로드 시에는 캐시가 비어 있어 서버 렌더 결과와 같다)
  const [entry, setEntry] = useState<FeedCacheEntry | null>(
    () => feedCache.get(feedKey(feedFilter.sort, feedFilter.category, getAuthUser()?.id)) ?? null,
  );
  const restoreY = useRef(entry?.scrollY ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (cursor: number) => {
      const id = ++requestId.current;
      const forKey = keyRef.current;
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({
        sort: tab === "following" ? "latest" : tab,
        limit: String(PAGE_SIZE),
        cursor: String(cursor),
      });
      if (tab === "following") params.set("following", "true");
      if (category !== "전체") params.set("category", category);
      if (user) params.set("user_id", user.id);

      try {
        const data = await api<{ posts: Post[] }>(`/feed?${params}`);
        if (id !== requestId.current) return;
        setEntry((prev) => {
          const base = cursor === 0 || !prev ? [] : prev.posts;
          const seen = new Set(base.map((p) => p.id));
          const next: FeedCacheEntry = {
            posts: [...base, ...data.posts.filter((p) => !seen.has(p.id))],
            cursor: cursor + data.posts.length,
            hasMore: data.posts.length >= PAGE_SIZE,
            scrollY: prev?.scrollY ?? 0,
          };
          feedCache.set(forKey, next);
          return next;
        });
      } catch {
        if (id === requestId.current) setError(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [tab, category, user],
  );

  // 필터가 바뀌거나 처음 진입하면 캐시를 쓰거나 새로 불러온다
  useEffect(() => {
    if (!hydrated) return;
    keyRef.current = key;
    feedFilter.sort = tab;
    feedFilter.category = category;
    if (tab === "following" && !user) {
      setEntry({ posts: [], cursor: 0, hasMore: false, scrollY: 0 });
      return;
    }
    const cached = feedCache.get(key);
    if (cached) {
      setEntry(cached);
      return;
    }
    setEntry(null);
    load(0);
  }, [hydrated, key, tab, category, user, load]);

  // 캐시로 그린 첫 화면이 DOM에 반영된 직후 이전 스크롤 위치로 이동
  useLayoutEffect(() => {
    const y = restoreY.current;
    if (y == null) return;
    restoreY.current = null;
    window.scrollTo(0, y);
    // 라우터가 스크롤을 다시 조정하는 경우 한 번 더 맞춘다
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - y) > 40) window.scrollTo(0, y);
    });
  }, []);

  // 상세로 이동했다가 돌아왔을 때 복원할 스크롤 위치 기록.
  // 페이지 전환 시 맨 위로 스크롤되는 이벤트는 리스너 해제 후에 도착하므로 덮어쓰지 않는다.
  useLayoutEffect(() => {
    const onScroll = () => {
      const cached = feedCache.get(keyRef.current);
      if (cached) cached.scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 무한 스크롤
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !entry?.hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) load(entry.cursor);
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [entry, loading, error, load]);

  function changeFilter(nextTab: TabKey, nextCategory: string) {
    // 현재 탭을 다시 누르면 새로고침
    if (nextTab === tab && nextCategory === category) {
      feedCache.delete(key);
      setEntry(null);
      load(0);
    } else {
      setTab(nextTab);
      setCategory(nextCategory);
    }
    const top = topRef.current;
    if (top && window.scrollY > top.offsetTop) window.scrollTo({ top: top.offsetTop });
  }

  function removePost(id: string) {
    setEntry((prev) => {
      if (!prev) return prev;
      const next = { ...prev, posts: prev.posts.filter((p) => p.id !== id) };
      feedCache.set(key, next);
      return next;
    });
  }

  const posts = entry?.posts.filter((p) => !hidden.has(p.id)) ?? [];
  const showCarousel = tab === "recommended" && category === "전체";

  return (
    <>
      <div ref={topRef} />
      {/* 탭 + 카테고리 */}
      <div className="sticky top-14 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div role="tablist" className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => changeFilter(t.key, category)}
              className={`relative flex-1 py-3 text-[15px] transition-colors ${
                tab === t.key ? "font-bold text-foreground" : "font-medium text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-10 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 pt-1">
          {["전체", ...CATEGORIES.map((c) => c.value)].map((cat) => {
            const emoji = CATEGORIES.find((c) => c.value === cat)?.emoji;
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => changeFilter(tab, cat)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-foreground text-background" : "bg-subtle text-foreground/80 hover:bg-border"
                }`}
              >
                {emoji && <span className="mr-1">{emoji}</span>}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 목록 */}
      {tab === "following" && hydrated && !user ? (
        <EmptyState
          icon={<UserIcon size={24} />}
          title="좋아하는 브랜드의 소식만 모아보세요"
          description="로그인하고 브랜드를 팔로우하면 새 제품 소식이 여기에 쌓여요."
          action={
            <Link href={loginPath("/")} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
              로그인하기
            </Link>
          }
        />
      ) : entry === null ? (
        Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
      ) : posts.length === 0 && !loading ? (
        tab === "following" ? (
          <>
            <EmptyState
              icon={<HeartIcon size={24} />}
              title="아직 팔로우한 브랜드가 없어요"
              description="관심 있는 브랜드를 팔로우하면 새 게시물을 놓치지 않아요."
            />
            <div className="px-4 pb-8">
              <BrandList limit={6} title="팔로우할 만한 브랜드" />
            </div>
          </>
        ) : error ? (
          <ErrorState onRetry={() => load(0)} />
        ) : (
          <EmptyState
            icon={<SparkleIcon size={24} />}
            title={category === "전체" ? "아직 게시물이 없어요" : `${category} 카테고리에 아직 게시물이 없어요`}
            description="새로운 제품 소식이 올라오면 가장 먼저 보여드릴게요."
            action={
              category !== "전체" && (
                <button
                  onClick={() => changeFilter(tab, "전체")}
                  className="rounded-full bg-subtle px-5 py-2.5 text-sm font-semibold hover:bg-border"
                >
                  전체 보기
                </button>
              )
            }
          />
        )
      ) : (
        <div>
          {posts.map((post, i) => (
            <Fragment key={post.id}>
              <PostCard post={post} onDeleted={removePost} />
              {showCarousel && i === 3 && (
                <div className="lg:hidden">
                  <BrandCarousel />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      <div ref={sentinel} />
      {loading && entry !== null && <PostSkeleton />}
      {error && entry !== null && posts.length > 0 && <ErrorState onRetry={() => load(entry.cursor)} compact />}
      {entry && !entry.hasMore && posts.length > 0 && (
        <p className="py-10 text-center text-sm text-muted">모든 게시물을 확인했어요 ✨</p>
      )}
    </>
  );
}

function feedKey(tab: string, category: string, userId: string | undefined) {
  return `${tab}|${category}|${userId ?? "anon"}`;
}

function ErrorState({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-16"}`}>
      <p className="text-sm text-muted">피드를 불러오지 못했어요.</p>
      <button onClick={onRetry} className="mt-3 rounded-full bg-subtle px-4 py-2 text-sm font-semibold hover:bg-border">
        다시 시도
      </button>
    </div>
  );
}
