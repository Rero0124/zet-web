import type { Metadata } from "next";
import { QnaPage } from "@/components/qna-page";

export const metadata: Metadata = {
  title: "Q&A",
  description: "제품에 대한 궁금증을 브랜드와 사용자에게 직접 물어보세요",
};

export default async function Qna({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const post = typeof params.post === "string" ? params.post : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  // 쿼리가 바뀌면(태그 링크 등) 상태를 새로 시작
  return <QnaPage key={`${post ?? ""}|${tag ?? ""}`} initialPostId={post} initialTag={tag} />;
}
