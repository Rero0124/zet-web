"use client";

import Link from "next/link";
import { isBusiness, useAuthUser } from "@/lib/auth";
import { profilePath } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { BrandList } from "./brand-suggestions";
import { ChartIcon, MegaphoneIcon } from "./icons";
import { TrendingWidget } from "./trending-widget";

export function FeedSidebar() {
  const hydrated = useHydrated();
  const user = useAuthUser();

  return (
    <div className="sticky top-20 flex flex-col gap-7">
      {hydrated && !user && (
        <section className="rounded-2xl border border-border p-5">
          <p className="text-lg font-bold leading-snug">
            광고도 콘텐츠처럼,
            <br />
            나에게 맞는 제품만
          </p>
          <p className="mt-2 text-sm text-muted">
            로그인하면 연령·관심사에 맞춘 추천 피드와 저장, 리뷰, 브랜드 팔로우를 이용할 수 있어요.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/login" className="flex-1 rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white">
              로그인
            </Link>
            <Link href="/register" className="flex-1 rounded-full bg-subtle py-2.5 text-center text-sm font-semibold">
              가입하기
            </Link>
          </div>
        </section>
      )}

      {hydrated && isBusiness(user) && user && (
        <section className="rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-accent">
            <MegaphoneIcon size={18} />
            <span className="text-sm font-semibold">브랜드 센터</span>
          </div>
          <p className="mt-2 text-sm text-muted">새 제품을 알리고, 누가 반응했는지 성과를 확인하세요.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/write" className="flex-1 rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white">
              광고 만들기
            </Link>
            <Link
              href={`${profilePath(user.username, user.id)}?tab=insights`}
              className="flex flex-1 items-center justify-center gap-1 rounded-full bg-subtle py-2.5 text-sm font-semibold"
            >
              <ChartIcon size={15} />
              성과 보기
            </Link>
          </div>
        </section>
      )}

      <BrandList limit={5} />
      <TrendingWidget limit={8} />

      <footer className="px-1 text-xs leading-relaxed text-muted">
        Zet의 모든 게시물은 브랜드가 직접 올린 광고이며 &lsquo;광고&rsquo;로 표시됩니다.
        <br />© 2026 Zet
      </footer>
    </div>
  );
}
