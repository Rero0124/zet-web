"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { profilePath } from "@/lib/format";
import type { UserSummary } from "@/lib/types";
import { BrandList } from "./brand-suggestions";
import { ClockIcon, SearchIcon, VerifiedBadge, XIcon } from "./icons";
import { PageColumn } from "./page-column";
import { PostList } from "./post-list";
import { useTrendingKeywords } from "./trending-widget";
import { Avatar } from "./ui/avatar";
import { EmptyState } from "./ui/empty-state";
import { Spinner } from "./ui/skeleton";

/* ── 최근 검색어 (브라우저 저장) ── */
const RECENT_KEY = "zet:recent-searches";
let recentCache: string[] | null = null;
const recentListeners = new Set<() => void>();
const EMPTY: string[] = [];

function readRecent(): string[] {
  if (recentCache) return recentCache;
  try {
    recentCache = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    recentCache = [];
  }
  return recentCache!;
}

function writeRecent(next: string[]) {
  recentCache = next;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // 저장 불가 환경
  }
  for (const l of recentListeners) l();
}

function useRecent() {
  return useSyncExternalStore(
    (cb) => {
      recentListeners.add(cb);
      return () => recentListeners.delete(cb);
    },
    readRecent,
    () => EMPTY,
  );
}

type Tab = "posts" | "brands";

export function SearchPage({ initialQuery, initialCategory }: { initialQuery: string; initialCategory: string }) {
  const router = useRouter();
  const recent = useRecent();
  const [input, setInput] = useState(initialQuery);
  const [tab, setTab] = useState<Tab>("posts");
  const [count, setCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = initialQuery;
  const category = initialCategory;

  useEffect(() => {
    if (!query) inputRef.current?.focus();
  }, [query]);

  // 결과가 있는 검색어만 최근 검색어로 저장
  useEffect(() => {
    if (!query) return;
    writeRecent([query, ...readRecent().filter((q) => q !== query)].slice(0, 10));
  }, [query]);

  function go(q: string, cat = category) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    setCount(null);
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  return (
    <PageColumn>
      <div className="sticky top-14 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(input);
          }}
          role="search"
          className="relative"
        >
          <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            placeholder="제품, 브랜드, #태그 검색"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-full bg-subtle py-2.5 pl-11 pr-10 text-[15px] outline-none ring-accent/40 placeholder:text-muted focus:bg-background focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
          />
          {input && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setInput("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-muted/30 p-0.5 text-background"
            >
              <XIcon size={14} strokeWidth={2.6} />
            </button>
          )}
        </form>
      </div>

      {!query ? (
        <Discover recent={recent} onPick={(q) => go(q, "")} />
      ) : (
        <>
          <div role="tablist" className="flex border-b border-border">
            {(
              [
                ["posts", `제품${count !== null ? ` ${count}` : ""}`],
                ["brands", "브랜드 · 사용자"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`relative flex-1 py-3 text-[15px] ${
                  tab === key ? "font-bold" : "font-medium text-muted hover:text-foreground"
                }`}
              >
                {label}
                {tab === key && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-10 rounded-full bg-foreground" />}
              </button>
            ))}
          </div>

          {tab === "posts" ? (
            <>
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
                {["", ...CATEGORIES.map((c) => c.value)].map((cat) => (
                  <button
                    key={cat || "all"}
                    onClick={() => go(query, cat)}
                    aria-pressed={category === cat}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                      category === cat ? "bg-foreground text-background" : "bg-subtle text-foreground/80 hover:bg-border"
                    }`}
                  >
                    {cat || "전체"}
                  </button>
                ))}
              </div>
              <PostList
                path="/search"
                params={{ q: query, category: category || undefined }}
                onLoaded={setCount}
                empty={
                  <EmptyState
                    icon={<SearchIcon size={24} />}
                    title={`'${query}'에 맞는 제품이 없어요`}
                    description={
                      category ? "카테고리를 '전체'로 바꾸거나 다른 키워드로 검색해보세요." : "철자를 확인하거나 더 짧은 키워드로 검색해보세요."
                    }
                  />
                }
              />
            </>
          ) : (
            <UserResults query={query} />
          )}
        </>
      )}
    </PageColumn>
  );
}

function Discover({ recent, onPick }: { recent: string[]; onPick: (q: string) => void }) {
  const keywords = useTrendingKeywords(10);

  return (
    <div className="flex flex-col gap-8 px-4 py-5">
      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">최근 검색어</h2>
            <button onClick={() => writeRecent([])} className="text-xs text-muted hover:text-foreground">
              전체 삭제
            </button>
          </div>
          <ul className="flex flex-col">
            {recent.map((q) => (
              <li key={q} className="flex items-center">
                <button
                  onClick={() => onPick(q)}
                  className="flex flex-1 items-center gap-3 rounded-lg py-2 text-left text-sm hover:text-accent"
                >
                  <ClockIcon size={16} className="text-muted" />
                  {q}
                </button>
                <button
                  onClick={() => writeRecent(recent.filter((r) => r !== q))}
                  aria-label={`${q} 삭제`}
                  className="rounded-full p-1.5 text-muted hover:bg-subtle"
                >
                  <XIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-[15px] font-bold">지금 많이 찾는 키워드</h2>
        {keywords === null ? (
          <Spinner className="py-4" />
        ) : keywords.length === 0 ? (
          <p className="text-sm text-muted">아직 집계된 키워드가 없어요</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, i) => (
              <button
                key={k.keyword}
                onClick={() => onPick(`#${k.keyword}`)}
                className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm hover:bg-subtle"
              >
                <span className={`text-xs font-bold ${i < 3 ? "text-accent" : "text-muted"}`}>{i + 1}</span>
                {k.keyword}
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-bold">카테고리</h2>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/search?q=${encodeURIComponent(c.value)}&category=${encodeURIComponent(c.value)}`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-subtle py-4 text-sm font-medium hover:bg-border"
            >
              <span className="text-2xl">{c.emoji}</span>
              {c.value}
            </Link>
          ))}
        </div>
      </section>

      <BrandList limit={5} />
    </div>
  );
}

function UserResults({ query }: { query: string }) {
  const [users, setUsers] = useState<UserSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = query.replace(/^[#@]/, "");
    api<{ users: UserSummary[] }>(`/users/search?q=${encodeURIComponent(q)}&limit=20`)
      .then((d) => !cancelled && setUsers(d.users))
      .catch(() => !cancelled && setUsers([]));
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (users === null) return <Spinner />;
  if (users.length === 0) {
    return <EmptyState icon={<SearchIcon size={24} />} title={`'${query}'와 일치하는 계정이 없어요`} />;
  }

  return (
    <ul className="divide-y divide-border">
      {users.map((u) => {
        const brand = u.role === "business";
        return (
          <li key={u.id}>
            <Link href={profilePath(u.username, u.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle/60">
              <Avatar name={u.name} src={u.avatar_url} brand={brand} size={44} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-semibold">
                  <span className="truncate">{u.name}</span>
                  {brand && <VerifiedBadge size={14} />}
                </p>
                <p className="truncate text-xs text-muted">
                  @{u.username}
                  {u.bio ? ` · ${u.bio}` : ""}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
