"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import type { Post, Reaction } from "@/lib/types";

export function PostDetail({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);

  const user = typeof window !== "undefined" ? getAuthUser() : null;

  useEffect(() => {
    Promise.all([
      api<{ post: Post }>(`/posts/${id}`),
      api<{ reactions: Reaction[] }>(`/posts/${id}/reactions`),
    ])
      .then(([postData, reactionsData]) => {
        setPost(postData.post);
        setLikes(postData.post.like_count);
        setReactions(reactionsData.reactions);
        const u = getAuthUser();
        if (u && postData.post.author_id === u.id) setIsOwner(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const data = await api<{ reaction: Reaction }>(`/posts/${id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, reaction_type: "review", content: reviewText, rating }),
      });
      setReactions((prev) => [data.reaction, ...prev]);
      setReviewText("");
    } catch { /* */ }
  }

  async function handleLike() {
    if (!user) return;
    try {
      const res = await api<{ liked: boolean }>(`/posts/${id}/like`, {
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
      const res = await api<{ bookmarked: boolean }>(`/posts/${id}/bookmark`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });
      setBookmarked(res.bookmarked);
    } catch { /* */ }
  }

  async function handleEditReaction(reactionId: string) {
    if (!user) return;
    try {
      const data = await api<{ reaction: Reaction }>(`/posts/${id}/reactions/${reactionId}`, {
        method: "PUT",
        body: JSON.stringify({ user_id: user.id, content: editText, rating: editRating }),
      });
      setReactions((prev) => prev.map((r) => (r.id === reactionId ? data.reaction : r)));
      setEditingId(null);
    } catch { /* */ }
  }

  async function handleDeleteReaction(reactionId: string) {
    if (!user || !confirm("리뷰를 삭제하시겠습니까?")) return;
    try {
      await api(`/posts/${id}/reactions/${reactionId}?user_id=${user.id}`, { method: "DELETE" });
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    } catch { /* */ }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return <div className="py-20 text-center text-muted">게시글을 찾을 수 없습니다</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Post */}
      <article>
        {post.category && (
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent mb-3">
            {post.category}
          </span>
        )}
        <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-sm text-accent">#{tag}</span>
            ))}
          </div>
        )}

        {/* Stats + like/bookmark + owner actions */}
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
                  onClick={() => router.push(`/post/${id}/edit`)}
                  className="rounded-md bg-border px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={async () => {
                    if (!user || !confirm("정말 삭제하시겠습니까?")) return;
                    await api(`/posts/${id}?author_id=${user.id}`, { method: "DELETE" });
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
      </article>

      {/* Review form */}
      <form onSubmit={submitReview} className="mt-6 border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">평점</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className={`text-lg ${n <= rating ? "text-yellow-500" : "text-border"}`}>
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="리뷰를 남겨보세요"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            등록
          </button>
        </div>
      </form>

      {/* Reviews */}
      <div className="mt-4">
        <h2 className="text-sm font-semibold mb-4">리뷰 {reactions.filter((r) => r.reaction_type === "review").length}개</h2>
        {reactions.filter((r) => r.reaction_type === "review").length === 0 ? (
          <p className="text-sm text-muted">아직 리뷰가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reactions
              .filter((r) => r.reaction_type === "review")
              .map((r) => (
                <div key={r.id} className="border-b border-border pb-4 last:border-0">
                  {editingId === r.id ? (
                    /* Edit mode */
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setEditRating(n)} className={`text-lg ${n <= editRating ? "text-yellow-500" : "text-border"}`}>
                            ★
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => handleEditReaction(r.id)}
                          className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          {r.rating && (
                            <span className="text-yellow-500">
                              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                            </span>
                          )}
                          <span className="text-muted text-xs">
                            {new Date(r.created_at).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                        {user && r.user_id === user.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(r.id);
                                setEditText(r.content || "");
                                setEditRating(r.rating || 5);
                              }}
                              className="text-xs text-muted hover:text-foreground transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteReaction(r.id)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      {r.content && <p className="mt-1 text-sm">{r.content}</p>}
                    </>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
