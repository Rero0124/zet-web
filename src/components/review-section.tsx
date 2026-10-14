"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { formatRating, profilePath, timeAgo } from "@/lib/format";
import type { Reaction } from "@/lib/types";
import { MoreIcon, PencilIcon, StarIcon, TrashIcon } from "./icons";
import { MediaGallery } from "./media-gallery";
import { MediaUpload } from "./media-upload";
import { MentionText } from "./mention-text";
import { MentionTextarea } from "./mention-textarea";
import { Avatar } from "./ui/avatar";
import { EmptyState } from "./ui/empty-state";
import { requireUser } from "./ui/login-prompt";
import { Menu } from "./ui/menu";
import { StarInput, Stars } from "./ui/stars";
import { toast } from "./ui/toast";

type SortKey = "latest" | "high" | "low";

export function ReviewSection({
  postId,
  authorId,
  initialReviews,
  onCountChange,
}: {
  postId: string;
  authorId: string | null;
  initialReviews: Reaction[];
  onCountChange?: (count: number) => void;
}) {
  const user = useAuthUser();
  const [reviews, setReviews] = useState(initialReviews);
  const [sort, setSort] = useState<SortKey>("latest");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [editing, setEditing] = useState<Reaction | "new" | null>(null);

  const isOwner = !!user && user.id === authorId;
  const myReview = user ? reviews.find((r) => r.user_id === user.id) : undefined;

  const summary = useMemo(() => {
    const rated = reviews.filter((r) => r.rating);
    const avg = rated.length ? rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length : null;
    const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: rated.filter((r) => r.rating === n).length }));
    return { avg, dist, total: rated.length };
  }, [reviews]);

  const sorted = useMemo(() => {
    const list = photoOnly ? reviews.filter((r) => r.media_urls?.length) : [...reviews];
    if (sort === "high") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === "low") list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    else list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [reviews, sort, photoOnly]);

  function update(next: Reaction[]) {
    setReviews(next);
    onCountChange?.(next.length);
  }

  function startWrite() {
    if (!requireUser("리뷰를 남기려면 로그인이 필요해요")) return;
    setEditing(myReview ?? "new");
  }

  async function handleDelete(r: Reaction) {
    if (!user || !confirm("리뷰를 삭제할까요?")) return;
    try {
      await api(`/posts/${postId}/reactions/${r.id}?user_id=${user.id}`, { method: "DELETE" });
      update(reviews.filter((x) => x.id !== r.id));
      toast("리뷰를 삭제했어요");
    } catch {
      toast("삭제하지 못했어요", { tone: "error" });
    }
  }

  return (
    <div>
      {/* 요약 */}
      <div className="flex items-center gap-6 px-4 py-5">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold tracking-tight">{formatRating(summary.avg)}</span>
          <Stars value={summary.avg ?? 0} size={15} />
          <span className="mt-1 text-xs text-muted">리뷰 {summary.total}개</span>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {summary.dist.map(({ n, count }) => (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-muted">{n}점</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-star"
                  style={{ width: summary.total ? `${(count / summary.total) * 100}%` : 0 }}
                />
              </div>
              <span className="w-5 text-right tabular-nums text-muted">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 작성 */}
      <div className="px-4 pb-4">
        {editing ? (
          <ReviewForm
            postId={postId}
            existing={editing === "new" ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSaved={(saved) => {
              const exists = reviews.some((r) => r.id === saved.id);
              update(exists ? reviews.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...reviews]);
              setEditing(null);
              toast(exists ? "리뷰를 수정했어요" : "리뷰를 등록했어요. 고마워요!");
            }}
          />
        ) : isOwner ? (
          <p className="rounded-xl bg-subtle px-4 py-3 text-center text-sm text-muted">
            내가 올린 광고에는 리뷰를 남길 수 없어요
          </p>
        ) : myReview ? (
          <button
            onClick={startWrite}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-subtle"
          >
            <PencilIcon size={15} />내 리뷰 수정하기
          </button>
        ) : (
          <button
            onClick={startWrite}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-3 text-sm font-semibold text-background hover:opacity-85"
          >
            <StarIcon size={15} filled />
            리뷰 쓰기
          </button>
        )}
      </div>

      {/* 정렬 */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {(
            [
              ["latest", "최신순"],
              ["high", "별점 높은순"],
              ["low", "별점 낮은순"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                sort === key ? "bg-foreground text-background" : "bg-subtle text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={photoOnly}
              onChange={(e) => setPhotoOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            사진 리뷰만
          </label>
        </div>
      )}

      {/* 목록 */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon size={24} />}
          title="아직 리뷰가 없어요"
          description={isOwner ? "고객의 첫 리뷰를 기다리고 있어요." : "이 제품을 써봤다면 첫 리뷰를 남겨주세요."}
        />
      ) : sorted.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">사진이 있는 리뷰가 없어요</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {sorted.map((r) => {
            const mine = user?.id === r.user_id;
            return (
              <li key={r.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <Link href={profilePath(r.user_username, r.user_id)}>
                    <Avatar name={r.user_name} src={r.user_avatar_url} size={34} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={profilePath(r.user_username, r.user_id)}
                        className="truncate text-sm font-semibold hover:underline"
                      >
                        {r.user_name ?? "사용자"}
                      </Link>
                      {mine && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">내 리뷰</span>}
                      <span className="ml-auto shrink-0 text-xs text-muted">{timeAgo(r.created_at)}</span>
                      {mine && (
                        <Menu
                          trigger={<MoreIcon size={16} />}
                          items={[
                            { label: "수정", icon: <PencilIcon size={15} />, onSelect: () => setEditing(r) },
                            { label: "삭제", icon: <TrashIcon size={15} />, danger: true, onSelect: () => handleDelete(r) },
                          ]}
                        />
                      )}
                    </div>
                    {r.rating ? (
                      <div className="mt-0.5">
                        <Stars value={r.rating} size={13} />
                      </div>
                    ) : null}
                    {r.content && (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                        <MentionText text={r.content} />
                      </p>
                    )}
                    {r.media_urls?.length > 0 && (
                      <div className="mt-2">
                        <MediaGallery urls={r.media_urls} />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReviewForm({
  postId,
  existing,
  onCancel,
  onSaved,
}: {
  postId: string;
  existing?: Reaction;
  onCancel: () => void;
  onSaved: (r: Reaction) => void;
}) {
  const user = useAuthUser();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.content ?? "");
  const [media, setMedia] = useState<string[]>(existing?.media_urls ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ratingLabel = ["별점을 선택해주세요", "별로예요", "그저 그래요", "괜찮아요", "좋아요", "최고예요"][rating];
  const canSubmit = rating > 0 && text.trim().length > 0 && !saving;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setSaving(true);
    setError("");
    try {
      const body = { user_id: user.id, content: text.trim(), rating, media_urls: media };
      const data = existing
        ? await api<{ reaction: Reaction }>(`/posts/${postId}/reactions/${existing.id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          })
        : await api<{ reaction: Reaction }>(`/posts/${postId}/reactions`, {
            method: "POST",
            body: JSON.stringify({ ...body, reaction_type: "review" }),
          });
      // 서버가 작성자 정보를 내려주지 않는 경우에도 바로 표시되도록 보완
      onSaved({
        user_name: user.name,
        user_username: user.username,
        user_avatar_url: user.avatar_url,
        ...data.reaction,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰를 저장하지 못했어요");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold">{existing ? "리뷰 수정" : "이 제품, 어떠셨나요?"}</p>
      <div className="mt-3 flex items-center gap-3">
        <StarInput value={rating} onChange={setRating} />
        <span className={`text-sm ${rating ? "font-medium" : "text-muted"}`}>{ratingLabel}</span>
      </div>
      <MentionTextarea
        value={text}
        onChange={setText}
        placeholder="사용해보니 어땠는지 자유롭게 알려주세요 (@로 친구 태그)"
        className="mt-3 min-h-24 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="mt-3">
        <MediaUpload urls={media} onChange={setMedia} />
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-subtle"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
        >
          {saving ? "저장 중..." : existing ? "수정 완료" : "리뷰 등록"}
        </button>
      </div>
    </form>
  );
}
