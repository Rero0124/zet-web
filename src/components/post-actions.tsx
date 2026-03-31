"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import type { Post } from "@/lib/types";

export function PostActions({ post }: { post: Post }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.like_count);
  const [bookmarked, setBookmarked] = useState(false);

  const user = typeof window !== "undefined" ? getAuthUser() : null;
  const isOwner = user && post.author_id === user.id;

  useEffect(() => {
    if (!user) return;
    api<{ liked: boolean; bookmarked: boolean }>(`/posts/${post.id}/status?user_id=${user.id}`)
      .then((res) => {
        setLiked(res.liked);
        setBookmarked(res.bookmarked);
      })
      .catch(() => {});
  }, [post.id]);

  async function handleLike() {
    if (!user) return;
    try {
      const res = await api<{ liked: boolean }>(`/posts/${post.id}/like`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });
      setLiked(res.liked);
      setLikes((prev) => prev + (res.liked ? 1 : -1));
    } catch { /* */ }
  }

  async function handleBookmark() {
    if (!user) return;
    try {
      const res = await api<{ bookmarked: boolean }>(`/posts/${post.id}/bookmark`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });
      setBookmarked(res.bookmarked);
    } catch { /* */ }
  }

  return (
    <div className="mt-4 flex items-center justify-between border-b border-border pb-4">
      <div className="flex items-center gap-4 text-sm text-muted">
        <span>조회 {post.impressions}</span>
        <span>클릭 {post.clicks}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? "text-red-500" : "text-muted hover:text-red-500"}`}
        >
          {liked ? "♥" : "♡"} {likes}
        </button>
        <button
          onClick={handleBookmark}
          className={`text-sm transition-colors ${bookmarked ? "text-accent" : "text-muted hover:text-accent"}`}
        >
          {bookmarked ? "★" : "☆"}
        </button>
        {isOwner && (
          <>
            <button
              onClick={() => router.push(`/post/${post.id}/edit`)}
              className="rounded-md bg-border px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              수정
            </button>
            <button
              onClick={async () => {
                if (!confirm("정말 삭제하시겠습니까?")) return;
                await api(`/posts/${post.id}?author_id=${user.id}`, { method: "DELETE" });
                router.push("/");
              }}
              className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 transition-colors"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
