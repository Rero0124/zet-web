import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { UserProfile } from "@/components/user-profile";
import type { PublicUser } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// UUID면 id로, 아니면 username으로 조회
async function fetchUser(idOrUsername: string): Promise<PublicUser | null> {
  try {
    const path = UUID_RE.test(idOrUsername)
      ? `/users/${idOrUsername}`
      : `/users/by-username/${encodeURIComponent(idOrUsername)}`;
    const data = await api<{ user: PublicUser }>(path);
    return data.user;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await fetchUser(decodeURIComponent(id));
  if (!user) return { title: "프로필" };
  return {
    title: `${user.name} (@${user.username})`,
    description: user.bio || `${user.name}님의 Zet 프로필`,
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const user = await fetchUser(decodeURIComponent(id));
  if (!user) notFound();

  return <UserProfile key={user.id} initialUser={user} initialTab={tab} />;
}
