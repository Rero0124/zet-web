import { QnaDetail } from "@/components/qna-detail";

export default async function QnaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QnaDetail questionId={id} />;
}
