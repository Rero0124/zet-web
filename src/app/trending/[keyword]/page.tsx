import { KeywordDetail } from "@/components/keyword-detail";

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const { keyword } = await params;
  return <KeywordDetail keyword={decodeURIComponent(keyword)} />;
}
