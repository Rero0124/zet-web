import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { PostCard } from "@/components/post-card";
import type { Post } from "@/lib/types";

interface User {
  id: string;
  username: string;
  name: string;
  gender: string | null;
  region: string | null;
  role: string;
  created_at: string;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: User;
  let posts: Post[];

  try {
    const [userRes, postsRes] = await Promise.all([
      api<{ user: User }>(`/users/${id}`),
      api<{ posts: Post[] }>(`/users/${id}/posts`),
    ]);
    user = userRes.user;
    posts = postsRes.posts;
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Profile header */}
      <div className="px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">@{user.username}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            user.role === "business" ? "bg-accent/10 text-accent" : "bg-border text-muted"
          }`}>
            {user.role === "business" ? "기업 회원" : "일반 회원"}
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-sm text-muted">
          {user.region && <span>{user.region}</span>}
          <span>가입일 {new Date(user.created_at).toLocaleDateString("ko-KR")}</span>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="px-4 pt-4 pb-2 text-sm font-semibold">
          게시글 {posts.length > 0 && `(${posts.length})`}
        </h2>
        {posts.length === 0 ? (
          <div className="py-16 text-center text-muted">
            <p>작성한 게시글이 없습니다</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
