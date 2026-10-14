"use client";

import Link from "next/link";
import { categoryEmoji } from "@/lib/constants";
import { formatPrice, formatRating, postHeadline, postMedia, postPath } from "@/lib/format";
import { trackClick } from "@/lib/tracker";
import type { Post } from "@/lib/types";
import { StarIcon } from "./icons";
import { Skeleton } from "./ui/skeleton";

/** 가로 목록용 작은 제품 카드 */
export function MiniPostCard({ post, className = "w-44" }: { post: Post; className?: string }) {
  const thumb = postMedia(post).find((m) => m.type === "image");
  const headline = postHeadline(post);

  return (
    <Link
      href={postPath(post)}
      onClick={() => trackClick(post.id)}
      className={`group flex shrink-0 flex-col ${className}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-subtle">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-accent/15 via-subtle to-subtle p-3">
            <span className="text-2xl">{categoryEmoji(post.category) || "🛍️"}</span>
            <p className="line-clamp-3 text-[13px] font-semibold leading-snug">{headline}</p>
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-xs text-muted">{post.author_name}</p>
      {thumb && <p className="line-clamp-2 text-[13px] font-medium leading-snug">{headline}</p>}
      <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
        {post.price != null && <span className="font-bold">{formatPrice(post.price)}</span>}
        {post.avg_rating != null && post.review_count > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-muted">
            <StarIcon size={11} filled className="text-star" />
            {formatRating(post.avg_rating)}
          </span>
        )}
      </div>
    </Link>
  );
}

export function MiniPostRow({
  title,
  posts,
  action,
}: {
  title: string;
  posts: Post[] | null;
  action?: React.ReactNode;
}) {
  if (posts && posts.length === 0) return null;
  return (
    <section className="py-5">
      <div className="mb-3 flex items-center justify-between px-4">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {action}
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
        {posts === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-44 shrink-0">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="mt-2 h-3 w-20" />
                <Skeleton className="mt-1.5 h-3.5 w-32" />
              </div>
            ))
          : posts.map((p) => <MiniPostCard key={p.id} post={p} />)}
      </div>
    </section>
  );
}
