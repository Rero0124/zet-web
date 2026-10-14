import type { Metadata } from "next";
import { QnaDetail } from "@/components/qna-detail";

export const metadata: Metadata = {
  title: "질문",
};

export default async function QnaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QnaDetail questionId={id} />;
}
