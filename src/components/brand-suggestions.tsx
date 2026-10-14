"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { formatCount, profilePath } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import type { Brand } from "@/lib/types";
import { FollowButton } from "./follow-button";
import { VerifiedBadge } from "./icons";
import { Avatar } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

// 피드로 돌아왔을 때 다시 불러오느라 높이가 바뀌지 않도록 세션 동안 보관
const brandCache = new Map<string, Brand[]>();

function useBrands(limit: number) {
  const hydrated = useHydrated();
  const user = useAuthUser();
  const cacheKey = `${limit}|${user?.id ?? ""}`;
  const [loaded, setLoaded] = useState<{ key: string; brands: Brand[] } | null>(null);

  useEffect(() => {
    if (!hydrated || brandCache.has(cacheKey)) return;
    const params = new URLSearchParams({ limit: String(limit) });
    if (user) params.set("viewer_id", user.id);
    let cancelled = false;
    api<{ brands: Brand[] }>(`/brands?${params}`)
      .then((d) => d.brands.filter((b) => b.id !== user?.id))
      .catch(() => [] as Brand[])
      .then((brands) => {
        brandCache.set(cacheKey, brands);
        if (!cancelled) setLoaded({ key: cacheKey, brands });
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, user, limit, cacheKey]);

  if (!hydrated) return null;
  return brandCache.get(cacheKey) ?? (loaded?.key === cacheKey ? loaded.brands : null);
}

/** 사이드바/검색 화면용 세로 목록 */
export function BrandList({ limit = 5, title = "추천 브랜드" }: { limit?: number; title?: string }) {
  const brands = useBrands(limit);
  if (brands && brands.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 px-1 text-[15px] font-bold">{title}</h2>
      <ul className="flex flex-col">
        {brands === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-1 py-2.5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </li>
            ))
          : brands.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-subtle">
                <Link href={profilePath(b.username)} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={b.name} src={b.avatar_url} brand size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-sm font-semibold">
                      <span className="truncate">{b.name}</span>
                      <VerifiedBadge size={14} />
                    </p>
                    <p className="truncate text-xs text-muted">{b.bio || `@${b.username}`}</p>
                  </div>
                </Link>
                <FollowButton
                  userId={b.id}
                  name={b.name}
                  following={b.is_following}
                  followerCount={b.follower_count}
                  size="sm"
                />
              </li>
            ))}
      </ul>
    </section>
  );
}

/** 피드 중간에 끼워 넣는 가로 스크롤 카드 ("회원님을 위한 추천" 패턴) */
export function BrandCarousel({ title = "이런 브랜드는 어때요?" }: { title?: string }) {
  const brands = useBrands(10);
  if (brands && brands.length === 0) return null;
  if (!brands) {
    // 불러오는 동안 같은 높이를 확보해 레이아웃이 밀리지 않게
    return (
      <section className="border-b border-border py-4" aria-hidden="true">
        <Skeleton className="mx-4 mb-3 h-5 w-40" />
        <div className="flex gap-3 overflow-hidden px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[198px] w-40 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border py-4">
      <h2 className="mb-3 px-4 text-[15px] font-bold">{title}</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
        {brands.map((b) => (
          <div
            key={b.id}
            className="flex w-40 shrink-0 flex-col items-center rounded-2xl border border-border px-3 py-4 text-center transition-colors hover:bg-subtle"
          >
            <Link href={profilePath(b.username)} className="flex max-w-full flex-col items-center">
              <Avatar name={b.name} src={b.avatar_url} brand size={56} />
              <p className="mt-2 flex max-w-full items-center gap-1 text-sm font-semibold">
                <span className="truncate">{b.name}</span>
                <VerifiedBadge size={14} />
              </p>
              <p className="mt-0.5 text-xs text-muted">
                게시물 {b.post_count} · 팔로워 {formatCount(b.follower_count)}
              </p>
            </Link>
            <FollowButton
              userId={b.id}
              name={b.name}
              following={b.is_following}
              followerCount={b.follower_count}
              size="sm"
              className="mt-3 w-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
