"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCount } from "@/lib/format";
import type { KeywordTrend } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

export function useTrendingKeywords(limit: number, period = "week") {
  const [keywords, setKeywords] = useState<KeywordTrend[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    api<{ keywords: KeywordTrend[] }>(`/trending/keywords?period=${period}&limit=${limit}`)
      .then((d) => !cancelled && setKeywords(d.keywords.slice(0, limit)))
      .catch(() => !cancelled && setKeywords([]));
    return () => {
      cancelled = true;
    };
  }, [limit, period]);
  return keywords;
}

export function TrendingWidget({ limit = 8 }: { limit?: number }) {
  const keywords = useTrendingKeywords(limit);
  if (keywords && keywords.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold">지금 뜨는 키워드</h2>
        <Link href="/trending" className="text-xs text-muted hover:text-foreground">
          전체보기
        </Link>
      </div>
      <ol className="flex flex-col">
        {keywords === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="px-1 py-2">
                <Skeleton className="h-4 w-36" />
              </li>
            ))
          : keywords.map((k, i) => (
              <li key={k.keyword}>
                <Link
                  href={`/trending/${encodeURIComponent(k.keyword)}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-2 text-sm transition-colors hover:bg-subtle"
                >
                  <span className={`w-4 text-center font-bold ${i < 3 ? "text-accent" : "text-muted"}`}>{i + 1}</span>
                  <span className="flex-1 truncate font-medium">#{k.keyword}</span>
                  <span className="text-xs text-muted">반응 {formatCount(k.count)}</span>
                </Link>
              </li>
            ))}
      </ol>
    </section>
  );
}
