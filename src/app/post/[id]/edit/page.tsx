import type { Metadata } from "next";
import { EditPost } from "@/components/edit-post";

export const metadata: Metadata = { title: "광고 수정" };

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditPost id={id} />;
}
