import { redirect, notFound } from "next/navigation";
import { api } from "@/lib/api";

export default async function UserByUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  try {
    const data = await api<{ user: { id: string } }>(`/users/by-username/${encodeURIComponent(username)}`);
    redirect(`/user/${data.user.id}`);
  } catch {
    notFound();
  }
}
