"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthCookie, isBusiness, useAuthUser } from "@/lib/auth";
import { resetFollowStates } from "@/lib/follow-store";
import { invalidateFeed } from "@/lib/feed-cache";
import { loginPath, profilePath } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { resetPostStates } from "@/lib/post-store";
import {
  BookmarkIcon,
  ChartIcon,
  HomeIcon,
  LogOutIcon,
  PlusIcon,
  QnaIcon,
  SearchIcon,
  SettingsIcon,
  TrendIcon,
  UserIcon,
} from "./icons";
import { Avatar } from "./ui/avatar";
import { Menu } from "./ui/menu";
import { toast } from "./ui/toast";

const LINKS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/trending", label: "트렌드", icon: TrendIcon },
  { href: "/qna", label: "Q&A", icon: QnaIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearAuthCookie();
    resetPostStates();
    resetFollowStates();
    invalidateFeed();
    router.push("/");
    router.refresh();
    toast("로그아웃했어요");
  };
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthUser();
  const logout = useLogout();
  const [query, setQuery] = useState("");
  const business = isBusiness(user);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link
          href="/"
          onClick={() => pathname === "/" && window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-[24px] font-black leading-none tracking-tighter"
          aria-label="Zet 홈"
        >
          zet<span className="text-accent">.</span>
        </Link>

        {!pathname.startsWith("/search") && (
          <form onSubmit={onSearch} className="relative hidden max-w-xs flex-1 md:block" role="search">
            <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제품, 브랜드, #태그 검색"
              aria-label="검색"
              className="w-full rounded-full bg-subtle py-2 pl-9 pr-4 text-sm outline-none ring-accent/40 placeholder:text-muted focus:bg-background focus:ring-2"
            />
          </form>
        )}

        {/* 데스크톱 */}
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors ${
                  active ? "font-semibold text-foreground" : "text-muted hover:bg-subtle hover:text-foreground"
                }`}
              >
                <Icon size={18} filled={active} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}

          {hydrated && business && (
            <Link
              href="/write"
              className="ml-2 flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              <PlusIcon size={16} strokeWidth={2.4} />
              광고 만들기
            </Link>
          )}

          {!hydrated ? (
            <div className="ml-2 h-8 w-8" />
          ) : user ? (
            <div className="ml-2">
              <Menu
                label="내 계정"
                trigger={<Avatar name={user.name} src={user.avatar_url} brand={business} size={30} />}
                items={[
                  { label: "내 프로필", icon: <UserIcon size={16} />, href: profilePath(user.username, user.id) },
                  {
                    label: "저장한 제품",
                    icon: <BookmarkIcon size={16} />,
                    href: `${profilePath(user.username, user.id)}?tab=saved`,
                  },
                  ...(business
                    ? [
                        {
                          label: "광고 성과",
                          icon: <ChartIcon size={16} />,
                          href: `${profilePath(user.username, user.id)}?tab=insights`,
                        },
                      ]
                    : []),
                  { label: "프로필 편집", icon: <SettingsIcon size={16} />, href: "/profile" },
                  { label: "로그아웃", icon: <LogOutIcon size={16} />, onSelect: logout, danger: true },
                ]}
              />
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link href={loginPath(pathname)} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-subtle">
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-85"
              >
                가입하기
              </Link>
            </div>
          )}
        </nav>

        {/* 모바일 상단 */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          {hydrated && business && (
            <Link href="/write" aria-label="광고 만들기" className="rounded-full p-2 text-foreground hover:bg-subtle">
              <PlusIcon size={22} />
            </Link>
          )}
          {hydrated && !user && (
            <Link
              href={loginPath(pathname)}
              className="rounded-full bg-foreground px-3.5 py-1.5 text-sm font-semibold text-background"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** 모바일 하단 탭바 — 상품 상세/작성 화면에서는 숨김 */
export function BottomTabBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useAuthUser();

  const hiddenOn = ["/post/", "/write", "/login", "/register"];
  if (hiddenOn.some((p) => pathname.startsWith(p))) return null;

  const myPath = user ? profilePath(user.username, user.id) : loginPath(pathname);
  const tabs = [
    { href: "/", label: "홈", icon: HomeIcon },
    { href: "/trending", label: "트렌드", icon: TrendIcon },
    { href: "/search", label: "검색", icon: SearchIcon },
    { href: "/qna", label: "Q&A", icon: QnaIcon },
  ];
  const meActive = !!user && (pathname === myPath || pathname === "/profile");

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
      <div className="grid h-14 grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => href === "/" && pathname === "/" && window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "font-semibold text-foreground" : "text-muted"
              }`}
            >
              <Icon size={23} filled={active && Icon !== SearchIcon} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
        <Link
          href={myPath}
          aria-current={meActive ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            meActive ? "font-semibold text-foreground" : "text-muted"
          }`}
        >
          {hydrated && user ? (
            <Avatar
              name={user.name}
              src={user.avatar_url}
              brand={isBusiness(user)}
              size={24}
              className={meActive ? "ring-2 ring-foreground ring-offset-1 ring-offset-background" : ""}
            />
          ) : (
            <UserIcon size={23} />
          )}
          {user ? "프로필" : "로그인"}
        </Link>
      </div>
    </nav>
  );
}
