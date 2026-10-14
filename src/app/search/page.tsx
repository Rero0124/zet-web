import type { Metadata } from "next";
import { SearchPage } from "@/components/search-page";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `'${q}' 검색 결과` : "검색" };
}

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  // 검색어가 바뀌면 탭/개수 등 화면 상태를 새로 시작
  return <SearchPage key={`${q}|${category}`} initialQuery={q.trim()} initialCategory={category} />;
}
