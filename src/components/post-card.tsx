"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { trackImpression, trackClick, trackDwell } from "@/lib/tracker";
import { BlockRenderer } from "./block-renderer";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  const timeAgo = getTimeAgo(post.created_at);
  const [likes, setLikes] = useState(post.like_count);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const dwellStart = useRef<number | null>(null);
  const impressed = useRef(false);

  // Load user's reaction status
  useEffect(() => {
    const user = getAuthUser();
    if (!user) return;
    api<{ liked: boolean; bookmarked: boolean }>(`/posts/${post.id}/status?user_id=${user.id}`)
      .then((res) => {
        setLiked(res.liked);
        setBookmarked(res.bookmarked);
      })
      .catch(() => {});
  }, [post.id]);

  // Intersection Observer for impression + dwell tracking
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!impressed.current) {
            trackImpression(post.id);
            impressed.current = true;
          }
          dwellStart.current = Date.now();
        } else if (dwellStart.current) {
          trackDwell(post.id, Date.now() - dwellStart.current);
          dwellStart.current = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id]);

  function handleClick() {
    trackClick(post.id);
  }

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    const user = getAuthUser();
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

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    const user = getAuthUser();
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
    <article ref={ref} className="border-b border-border px-4 py-4 hover:bg-card/50 transition-colors">
      <Link href={`/post/${post.id}`} className="block" onClick={handleClick}>
        {post.category && (
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent mb-2">
            {post.category}
          </span>
        )}
        {post.blocks && post.blocks.length > 0 ? (
          <BlockRenderer blocks={post.blocks} />
        ) : (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-accent">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-4">
          <span>{timeAgo}</span>
          <span>조회 {formatNumber(post.impressions)}</span>
          <span>리뷰 {post.review_count}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${liked ? "text-red-500" : "hover:text-red-500"}`}
          >
            {liked ? "♥" : "♡"} {formatNumber(likes)}
          </button>
          <button
            onClick={handleBookmark}
            className={`transition-colors ${bookmarked ? "text-accent" : "hover:text-accent"}`}
          >
            {bookmarked ? "★" : "☆"}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${Math.floor(days / 30)}개월 전`;
}
