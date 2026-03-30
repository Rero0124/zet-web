import { EditPost } from "@/components/edit-post";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditPost id={id} />;
}
