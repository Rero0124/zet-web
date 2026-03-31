"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { MediaUpload } from "./media-upload";
import { MediaGallery } from "./media-gallery";
import type { Reaction } from "@/lib/types";

export function ReviewSection({
  postId,
  initialReviews,
}: {
  postId: string;
  initialReviews: Reaction[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewMediaUrls, setReviewMediaUrls] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>([]);

  const user = typeof window !== "undefined" ? getAuthUser() : null;

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;
    try {
      const data = await api<{ reaction: Reaction }>(`/posts/${postId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, reaction_type: "review", content: reviewText, rating, media_urls: reviewMediaUrls.length > 0 ? reviewMediaUrls : null }),
      });
      setReviews((prev) => [data.reaction, ...prev]);
      setReviewText("");
      setReviewMediaUrls([]);
    } catch { /* */ }
  }

  async function handleEdit(reactionId: string) {
    if (!user) return;
    try {
      const data = await api<{ reaction: Reaction }>(`/posts/${postId}/reactions/${reactionId}`, {
        method: "PUT",
        body: JSON.stringify({ user_id: user.id, content: editText, rating: editRating, media_urls: editMediaUrls.length > 0 ? editMediaUrls : null }),
      });
      setReviews((prev) => prev.map((r) => (r.id === reactionId ? data.reaction : r)));
      setEditingId(null);
    } catch { /* */ }
  }

  async function handleDelete(reactionId: string) {
    if (!user || !confirm("리뷰를 삭제하시겠습니까?")) return;
    try {
      await api(`/posts/${postId}/reactions/${reactionId}?user_id=${user.id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== reactionId));
    } catch { /* */ }
  }

  return (
    <>
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
        <div className="mt-2">
          <MediaUpload urls={reviewMediaUrls} onChange={setReviewMediaUrls} />
        </div>
      </form>

      {/* Reviews list */}
      <div className="mt-4">
        <h2 className="text-sm font-semibold mb-4">리뷰 {reviews.length}개</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">아직 리뷰가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-border pb-4 last:border-0">
                {editingId === r.id ? (
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
                      <button onClick={() => handleEdit(r.id)} className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white">
                        저장
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted">
                        취소
                      </button>
                    </div>
                    <div className="mt-2">
                      <MediaUpload urls={editMediaUrls} onChange={setEditMediaUrls} />
                    </div>
                  </div>
                ) : (
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
                            onClick={() => { setEditingId(r.id); setEditText(r.content || ""); setEditRating(r.rating || 5); setEditMediaUrls(r.media_urls || []); }}
                            className="text-xs text-muted hover:text-foreground transition-colors"
                          >
                            수정
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                    {r.content && <p className="mt-1 text-sm">{r.content}</p>}
                    {r.media_urls && r.media_urls.length > 0 && (
                      <div className="mt-2">
                        <MediaGallery urls={r.media_urls} />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
