"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { invalidateFeed } from "@/lib/feed-cache";
import {
  formatCount,
  formatPrice,
  formatRating,
  postMedia,
  postPath,
  postText,
  profilePath,
  splitHeadline,
  timeAgo,
} from "@/lib/format";
import { hidePost, unhidePost } from "@/lib/hidden-posts";
import { useViewTracking } from "@/lib/hooks";
import { toggleBookmark, toggleLike, usePostState } from "@/lib/post-store";
import { shareLink } from "@/lib/share";
import { trackClick } from "@/lib/tracker";
import type { Post } from "@/lib/types";
import { CtaButton } from "./cta-button";
import {
  BookmarkIcon,
  ChartIcon,
  CommentIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  LinkIcon,
  MoreIcon,
  PencilIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  VerifiedBadge,
} from "./icons";
import { MediaCarousel } from "./media-carousel";
import { MentionText } from "./mention-text";
import { Avatar } from "./ui/avatar";
import { Menu, type MenuItem } from "./ui/menu";
import { toast } from "./ui/toast";

export function PostCard({
  post,
  onDeleted,
}: {
  post: Post;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const user = useAuthUser();
  const state = usePostState(post);
  const ref = useViewTracking<HTMLElement>(post.id, post.author_id);
  const [expanded, setExpanded] = useState(false);
  const [likePop, setLikePop] = useState(false);

  const href = postPath(post);
  const { headline, body } = splitHeadline(postText(post));
  const media = postMedia(post);
  const isBrand = post.author_role === "business";
  const isOwner = !!user && post.author_id === user.id;
  const authorHref = profilePath(post.author_username, post.author_id);
  const bodyIsLong = body.length > 120 || body.split("\n").length > 3;

  function open() {
    trackClick(post.id);
    router.push(href);
  }

  async function handleDelete() {
    if (!user || !confirm("이 게시물을 삭제할까요? 리뷰와 Q&A도 함께 삭제돼요.")) return;
    try {
      await api(`/posts/${post.id}?author_id=${user.id}`, { method: "DELETE" });
      invalidateFeed();
      onDeleted?.(post.id);
      toast("게시물을 삭제했어요");
    } catch {
      toast("삭제하지 못했어요", { tone: "error" });
    }
  }

  const menuItems: MenuItem[] = isOwner
    ? [
        { label: "광고 성과 보기", icon: <ChartIcon size={16} />, href: `${href}#insights` },
        { label: "수정하기", icon: <PencilIcon size={16} />, href: `/post/${post.id}/edit` },
        { label: "삭제하기", icon: <TrashIcon size={16} />, danger: true, onSelect: handleDelete },
      ]
    : [
        { label: "링크 복사", icon: <LinkIcon size={16} />, onSelect: () => shareLink(href) },
        ...(post.author_username
          ? [{ label: `${post.author_name ?? "작성자"} 프로필`, icon: <UserIcon size={16} />, href: authorHref }]
          : []),
        {
          label: "이 광고 숨기기",
          icon: <EyeOffIcon size={16} />,
          onSelect: () => {
            hidePost(post.id);
            toast("이 광고를 숨겼어요", { action: { label: "되돌리기", onClick: () => unhidePost(post.id) } });
          },
        },
      ];

  return (
    <article ref={ref} className="border-b border-border px-4 pb-2 pt-4">
      {/* 작성자 */}
      <header className="flex items-center gap-3">
        <Link href={authorHref} aria-label={`${post.author_name ?? ""} 프로필`}>
          <Avatar name={post.author_name} src={post.author_avatar_url} brand={isBrand} size={40} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1">
            <Link href={authorHref} className="truncate text-[15px] font-semibold hover:underline">
              {post.author_name ?? "알 수 없는 사용자"}
            </Link>
            {isBrand && <VerifiedBadge size={15} />}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            {isBrand && (
              <>
                <span className="font-medium text-foreground/70" title="브랜드가 게시한 광고입니다">광고</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
            {post.category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.category}</span>
              </>
            )}
          </p>
        </div>
        <Menu trigger={<MoreIcon size={20} />} items={menuItems} />
      </header>

      {/* 본문 */}
      <div className="mt-3">
        {headline && (
          <h2 className="text-[16px] font-semibold leading-snug">
            <Link href={href} onClick={() => trackClick(post.id)} className="hover:underline">
              {headline}
            </Link>
          </h2>
        )}
        {body && (
          <div onClick={open} className="cursor-pointer">
            <p
              className={`mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85 ${
                expanded ? "" : "line-clamp-3"
              }`}
            >
              <MentionText text={body} />
            </p>
          </div>
        )}
        {body && bodyIsLong && !expanded && (
          <button onClick={() => setExpanded(true)} className="mt-0.5 text-sm font-medium text-muted hover:text-foreground">
            더 보기
          </button>
        )}
      </div>

      {media.length > 0 && (
        <div className="mt-3">
          <MediaCarousel items={media} />
        </div>
      )}

      {/* 제품 정보 + CTA */}
      {(post.price != null || post.link_url) && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-subtle/60 px-3.5 py-2.5">
          <div className="min-w-0">
            {post.price != null && <p className="text-[15px] font-bold tracking-tight">{formatPrice(post.price)}</p>}
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              {post.avg_rating != null && post.review_count > 0 ? (
                <>
                  <StarIcon size={12} filled className="text-star" />
                  <span className="font-medium text-foreground">{formatRating(post.avg_rating)}</span>
                  <span>· 리뷰 {formatCount(post.review_count)}</span>
                </>
              ) : (
                <span>첫 리뷰를 기다리고 있어요</span>
              )}
            </p>
          </div>
          <CtaButton post={post} size="sm" />
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(`#${tag}`)}`}
              className="text-sm text-accent hover:underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* 반응 */}
      <div className="mt-1.5 flex items-center justify-between">
        <div className="-ml-2 flex items-center">
          <button
            onClick={() => {
              if (!state.liked) {
                setLikePop(true);
                setTimeout(() => setLikePop(false), 300);
              }
              toggleLike(post);
            }}
            aria-pressed={state.liked}
            aria-label={state.liked ? "좋아요 취소" : "좋아요"}
            className={`flex items-center gap-1.5 rounded-full px-2 py-2 text-sm transition-colors ${
              state.liked ? "text-like" : "text-muted hover:text-like"
            }`}
          >
            <HeartIcon size={20} filled={state.liked} className={likePop ? "animate-pop" : ""} />
            <span className="min-w-[1ch] tabular-nums">{formatCount(state.like_count)}</span>
          </button>
          <Link
            href={`${href}#reviews`}
            onClick={() => trackClick(post.id)}
            aria-label="리뷰 보기"
            className="flex items-center gap-1.5 rounded-full px-2 py-2 text-sm text-muted transition-colors hover:text-accent"
          >
            <CommentIcon size={20} />
            <span className="min-w-[1ch] tabular-nums">{formatCount(post.review_count)}</span>
          </Link>
          <button
            onClick={() => shareLink(href, headline)}
            aria-label="공유하기"
            className="rounded-full px-2 py-2 text-muted transition-colors hover:text-accent"
          >
            <ShareIcon size={19} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-xs text-muted" title="노출 수">
            <EyeIcon size={14} />
            {formatCount(post.impressions)}
          </span>
          <button
            onClick={() => toggleBookmark(post)}
            aria-pressed={state.bookmarked}
            aria-label={state.bookmarked ? "저장 취소" : "저장하기"}
            className={`rounded-full p-2 transition-colors ${
              state.bookmarked ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <BookmarkIcon size={20} filled={state.bookmarked} />
          </button>
        </div>
      </div>
    </article>
  );
}
