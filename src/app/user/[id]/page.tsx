import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { UserProfile } from "@/components/user-profile";
import type { Post } from "@/lib/types";

interface UserData {
  id: string;
  username: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  region: string | null;
  role: string;
  points: number;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: UserData;

  try {
    // UUID면 id로, 아니면 username으로 조회
    if (UUID_RE.test(id)) {
      const data = await api<{ user: UserData }>(`/users/${id}`);
      user = data.user;
    } else {
      const data = await api<{ user: UserData }>(`/users/by-username/${encodeURIComponent(id)}`);
      user = data.user;
    }
  } catch {
    notFound();
  }

  let posts: Post[] = [];
  try {
    const data = await api<{ posts: Post[] }>(`/users/${user.id}/posts`);
    posts = data.posts;
  } catch {
    // ignore
  }

  return <UserProfile user={user} initialPosts={posts} />;
}
