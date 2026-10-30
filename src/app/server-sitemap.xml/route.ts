import { getServerSideSitemap, type ISitemapField } from "next-sitemap";
import { api } from "@/lib/api";
import type { Brand, Post, Question } from "@/lib/types";

// next-sitemap.config.js 의 siteUrl 과 같게
const SITE_URL = "https://zet.bz";
const PAGE_SIZE = 50; // 서버 목록 API 의 최대 limit
// 한 번 요청이 API 호출 수천 번이 되지 않게 목록마다 최대 5,000개까지만
const MAX_PAGES = 100;

// 목록 API 를 cursor(offset) 로 끝까지 읽는다. next_cursor 는 끝에서도 cursor + limit 이라 받은 수로 끝을 안다
async function collect<T extends { id: string }>(path: string, key: string): Promise<T[]> {
  const byId = new Map<string, T>();
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await api<Record<string, T[]>>(`${path}${sep}limit=${PAGE_SIZE}&cursor=${page * PAGE_SIZE}`);
    const batch = res[key] ?? [];
    // 읽는 사이 새 글이 들어오면 offset 이 밀려 같은 글이 두 번 올 수 있다
    for (const item of batch) byId.set(item.id, item);
    if (batch.length < PAGE_SIZE) break;
  }
  return [...byId.values()];
}

export async function GET() {
  const [posts, questions, { brands }] = await Promise.all([
    collect<Post>("/feed?sort=latest", "posts"),
    collect<Question>("/questions", "questions"),
    api<{ brands: Brand[] }>("/brands?limit=30"),
  ]);

  const fields: ISitemapField[] = [
    ...posts.map((p) => ({ loc: `${SITE_URL}/post/${p.id}`, lastmod: p.created_at })),
    ...questions.map((q) => ({ loc: `${SITE_URL}/qna/${q.id}`, lastmod: q.created_at })),
    ...brands.map((b) => ({ loc: `${SITE_URL}/user/${b.id}` })),
  ];

  return getServerSideSitemap(fields, { "Cache-Control": "public, max-age=3600" });
}
