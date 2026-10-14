"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { invalidateFeed } from "@/lib/feed-cache";
import {
  formatCount,
  formatPrice,
  formatRating,
  isVideoUrl,
  postText,
  profilePath,
  resolveMediaUrl,
  splitHeadline,
  timeAgo,
} from "@/lib/format";
import { hidePost } from "@/lib/hidden-posts";
import { useHydrated, useViewTracking } from "@/lib/hooks";
import { toggleBookmark, toggleLike, usePostState } from "@/lib/post-store";
import { shareLink } from "@/lib/share";
import type { Post, Reaction } from "@/lib/types";
import { CtaButton } from "./cta-button";
import { FollowButton } from "./follow-button";
import {
  BookmarkIcon,
  ChartIcon,
  ChevronLeftIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  LinkIcon,
  MegaphoneIcon,
  MoreIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  VerifiedBadge,
} from "./icons";
import { InsightsPanel } from "./insights-panel";
import { MediaCarousel } from "./media-carousel";
import { MentionText } from "./mention-text";
import { MiniPostRow } from "./mini-post-card";
import { PageColumn } from "./page-column";
import { ProductQna } from "./product-qna";
import { ReviewSection } from "./review-section";
import { Avatar } from "./ui/avatar";
import { Menu, type MenuItem } from "./ui/menu";
import { Stars } from "./ui/stars";
import { toast } from "./ui/toast";

type Tab = "reviews" | "qna";

export function PostDetail({ initialPost, initialReviews }: { initialPost: Post; initialReviews: Reaction[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthUser();
  const [post, setPost] = useState(initialPost);
  const state = usePostState(post);
  const ref = useViewTracking<HTMLElement>(post.id, post.author_id);
  const [tab, setTab] = useState<Tab>("reviews");
  const [reviewCount, setReviewCount] = useState(initialReviews.length);
  const [qnaCount, setQnaCount] = useState(post.question_count ?? 0);
  const [authorFollow, setAuthorFollow] = useState<{ following: boolean; followers: number } | null>(null);
  const [brandPosts, setBrandPosts] = useState<Post[] | null>(initialPost.author_id ? null : []);
  const [similar, setSimilar] = useState<Post[] | null>(null);

  const isBrand = post.author_role === "business";
  const isOwner = hydrated && !!user && user.id === post.author_id;
  const authorHref = profilePath(post.author_username, post.author_id);
  const headline = splitHeadline(postText(post)).headline;

  // 로그인 사용자 기준 좋아요/저장 상태 다시 받기
  useEffect(() => {
    if (!hydrated || !user) return;
    api<{ post: Post }>(`/posts/${initialPost.id}?viewer_id=${user.id}`)
      .then((d) => setPost(d.post))
      .catch(() => {});
  }, [hydrated, user, initialPost.id]);

  // 브랜드 팔로우 상태
  useEffect(() => {
    if (!hydrated || !initialPost.author_id) return;
    const viewer = user ? `?viewer_id=${user.id}` : "";
    api<{ stats?: { followers: number }; is_following?: boolean }>(`/users/${initialPost.author_id}${viewer}`)
      .then((d) => setAuthorFollow({ following: !!d.is_following, followers: d.stats?.followers ?? 0 }))
      .catch(() => {});
  }, [hydrated, user, initialPost.author_id]);

  // 같은 브랜드의 다른 제품 / 비슷한 제품
  useEffect(() => {
    const id = initialPost.id;
    if (initialPost.author_id) {
      api<{ posts: Post[] }>(`/users/${initialPost.author_id}/posts?limit=8`)
        .then((d) => setBrandPosts(d.posts.filter((p) => p.id !== id).slice(0, 6)))
        .catch(() => setBrandPosts([]));
    }
    const params = new URLSearchParams({ sort: "popular", limit: "10" });
    if (initialPost.category) params.set("category", initialPost.category);
    api<{ posts: Post[] }>(`/feed?${params}`)
      .then((d) =>
        setSimilar(d.posts.filter((p) => p.id !== id && p.author_id !== initialPost.author_id).slice(0, 6)),
      )
      .catch(() => setSimilar([]));
  }, [initialPost.id, initialPost.author_id, initialPost.category]);

  // #reviews, #qna, #insights 로 들어오면 해당 위치로
  useEffect(() => {
    const hash = window.location.hash;
    if (!["#reviews", "#qna", "#insights"].includes(hash)) return;
    const timer = setTimeout(() => {
      if (hash === "#qna") setTab("qna");
      const target = hash === "#insights" ? "insights" : "detail-tabs";
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  function jumpTo(next: Tab) {
    setTab(next);
    document.getElementById("detail-tabs")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleDelete() {
    if (!user || !confirm("이 게시물을 삭제할까요? 리뷰와 Q&A도 함께 삭제돼요.")) return;
    try {
      await api(`/posts/${post.id}?author_id=${user.id}`, { method: "DELETE" });
      invalidateFeed();
      toast("게시물을 삭제했어요");
      router.push(profilePath(user.username, user.id));
    } catch {
      toast("삭제하지 못했어요", { tone: "error" });
    }
  }

  const menuItems: MenuItem[] = isOwner
    ? [
        { label: "수정하기", icon: <PencilIcon size={16} />, href: `/post/${post.id}/edit` },
        { label: "삭제하기", icon: <TrashIcon size={16} />, danger: true, onSelect: handleDelete },
      ]
    : [
        { label: "링크 복사", icon: <LinkIcon size={16} />, onSelect: () => shareLink(`/post/${post.id}`) },
        {
          label: "이 광고 숨기기",
          icon: <EyeOffIcon size={16} />,
          onSelect: () => {
            hidePost(post.id);
            toast("피드에서 이 광고를 숨겼어요");
            goBack();
          },
        },
      ];

  const targeting = [post.target_age, post.target_gender, post.target_region].filter(Boolean);
  const hasProduct = post.price != null || !!post.link_url;

  return (
    <PageColumn>
      {/* 상단 바 */}
      <div className="sticky top-14 z-30 flex h-12 items-center gap-1 border-b border-border bg-background/90 px-2 backdrop-blur-md">
        <button onClick={goBack} aria-label="뒤로 가기" className="rounded-full p-1.5 hover:bg-subtle">
          <ChevronLeftIcon size={24} />
        </button>
        <span className="truncate text-[15px] font-semibold">{post.author_name ?? "게시물"}</span>
        <div className="ml-auto flex items-center">
          <button
            onClick={() => shareLink(`/post/${post.id}`, headline)}
            aria-label="공유하기"
            className="rounded-full p-2 text-muted hover:bg-subtle hover:text-foreground"
          >
            <ShareIcon size={19} />
          </button>
          <Menu trigger={<MoreIcon size={20} />} items={menuItems} />
        </div>
      </div>

      <article ref={ref} className="px-4 pt-4">
        {/* 작성자 */}
        <header className="flex items-center gap-3">
          <Link href={authorHref}>
            <Avatar name={post.author_name} src={post.author_avatar_url} brand={isBrand} size={44} />
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <Link href={authorHref} className="flex items-center gap-1 font-semibold hover:underline">
              <span className="truncate">{post.author_name ?? "알 수 없는 사용자"}</span>
              {isBrand && <VerifiedBadge size={15} />}
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              {post.author_username && <span>@{post.author_username}</span>}
              {isBrand && <span>· 광고</span>}
              <span>· {timeAgo(post.created_at)}</span>
            </p>
          </div>
          {isBrand && !isOwner && authorFollow && post.author_id && (
            <FollowButton
              userId={post.author_id}
              name={post.author_name ?? "브랜드"}
              following={authorFollow.following}
              followerCount={authorFollow.followers}
              size="sm"
            />
          )}
        </header>

        <PostContent post={post} />

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(`#${tag}`)}`}
                className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/15"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {isBrand && (
          <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
            <MegaphoneIcon size={14} className="mt-px shrink-0" />
            <span>
              {post.author_name} 공식 계정이 게시한 광고예요.
              {targeting.length > 0 && <> {targeting.join(" · ")} 사용자에게 우선 노출돼요.</>}
            </span>
          </p>
        )}
      </article>

      {/* 제품 정보 */}
      {hasProduct && (
        <div className="mx-4 mt-5 rounded-2xl border border-border p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              {post.price != null && <p className="text-2xl font-bold tracking-tight">{formatPrice(post.price)}</p>}
              <button
                onClick={() => jumpTo("reviews")}
                className="mt-1 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
              >
                <Stars value={post.avg_rating ?? 0} size={14} />
                <span className="font-medium text-foreground">{formatRating(post.avg_rating)}</span>
                <span>리뷰 {reviewCount}</span>
              </button>
            </div>
            {post.link_url && (
              <span className="hidden max-w-[45%] truncate text-xs text-muted sm:block">
                {safeHost(post.link_url)}
              </span>
            )}
          </div>
          {post.link_url && (
            <div className="mt-4 hidden md:block">
              <CtaButton post={post} size="lg" className="w-full" />
            </div>
          )}
        </div>
      )}

      {/* 반응 */}
      <div className="mt-3 flex items-center border-b border-border px-2 pb-2">
        <button
          onClick={() => toggleLike(post)}
          aria-pressed={state.liked}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm ${
            state.liked ? "text-like" : "text-muted hover:text-like"
          }`}
        >
          <HeartIcon size={21} filled={state.liked} />
          좋아요 {formatCount(state.like_count)}
        </button>
        <button
          onClick={() => toggleBookmark(post)}
          aria-pressed={state.bookmarked}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm ${
            state.bookmarked ? "text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <BookmarkIcon size={20} filled={state.bookmarked} />
          저장 {formatCount(state.bookmark_count)}
        </button>
        <span className="ml-auto flex items-center gap-1 px-2 text-xs text-muted">
          <EyeIcon size={14} />
          노출 {formatCount(post.impressions)}
        </span>
      </div>

      {isOwner && (
        <>
          <div className="flex gap-2 border-b border-border px-4 py-3">
            <Link
              href={`/post/${post.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-subtle py-2.5 text-sm font-semibold hover:bg-border"
            >
              <PencilIcon size={15} />
              수정
            </Link>
            <Link
              href="#insights"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("insights")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-subtle py-2.5 text-sm font-semibold hover:bg-border"
            >
              <ChartIcon size={15} />
              성과 보기
            </Link>
          </div>
          <InsightsPanel post={post} />
        </>
      )}

      {/* 리뷰 / Q&A */}
      <div
        id="detail-tabs"
        role="tablist"
        className="sticky top-[6.5rem] z-20 flex scroll-mt-[6.5rem] border-b border-border bg-background/95 backdrop-blur-md"
      >
        {(
          [
            ["reviews", `리뷰 ${reviewCount}`],
            ["qna", `Q&A ${qnaCount}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`relative flex-1 py-3 text-[15px] ${
              tab === key ? "font-bold" : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {label}
            {tab === key && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-12 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>
      <div id="reviews" className={tab === "reviews" ? "" : "hidden"}>
        <ReviewSection
          postId={post.id}
          authorId={post.author_id}
          initialReviews={initialReviews}
          onCountChange={setReviewCount}
        />
      </div>
      <div id="qna" className={tab === "qna" ? "" : "hidden"}>
        <ProductQna
          postId={post.id}
          authorId={post.author_id}
          brandName={post.author_name}
          onCountChange={setQnaCount}
        />
      </div>

      <div className="border-t border-border">
        <MiniPostRow
          title={`${post.author_name ?? "이 브랜드"}의 다른 제품`}
          posts={brandPosts}
          action={
            <Link href={authorHref} className="text-xs text-muted hover:text-foreground">
              브랜드 홈
            </Link>
          }
        />
        <MiniPostRow title="함께 보면 좋은 제품" posts={similar} />
      </div>

      {/* 모바일 하단 고정 바 */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => toggleLike(post)}
            aria-label={state.liked ? "좋아요 취소" : "좋아요"}
            aria-pressed={state.liked}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl text-[10px] ${
              state.liked ? "text-like" : "text-muted"
            }`}
          >
            <HeartIcon size={22} filled={state.liked} />
            {formatCount(state.like_count)}
          </button>
          <button
            onClick={() => toggleBookmark(post)}
            aria-label={state.bookmarked ? "저장 취소" : "저장하기"}
            aria-pressed={state.bookmarked}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl text-[10px] ${
              state.bookmarked ? "text-foreground" : "text-muted"
            }`}
          >
            <BookmarkIcon size={21} filled={state.bookmarked} />
            저장
          </button>
          {post.link_url ? (
            <CtaButton post={post} size="lg" className="flex-1" />
          ) : (
            <button
              onClick={() => jumpTo(isOwner ? "qna" : "reviews")}
              className="flex-1 rounded-xl bg-foreground py-3.5 text-[15px] font-semibold text-background"
            >
              {isOwner ? "고객 질문 확인하기" : `리뷰 ${reviewCount} · Q&A ${qnaCount} 보기`}
            </button>
          )}
        </div>
      </div>
    </PageColumn>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** 첫 텍스트 줄은 제목으로, 나머지 블록은 순서대로 */
function PostContent({ post }: { post: Post }) {
  const blocks = post.blocks && post.blocks.length > 0 ? post.blocks : [{ type: "text", value: post.content }];
  const firstTextIndex = blocks.findIndex((b) => b.type === "text" && b.value.trim());
  const extraMedia = (post.media_urls || []).map((url) => ({
    type: isVideoUrl(url) ? ("video" as const) : ("image" as const),
    url: resolveMediaUrl(url),
  }));

  return (
    <div className="mt-4 flex flex-col gap-3">
      {blocks.map((b, i) => {
        if (b.type === "text") {
          if (i === firstTextIndex) {
            const { headline, body } = splitHeadline(b.value);
            return (
              <div key={i}>
                <h1 className="text-xl font-bold leading-snug tracking-tight">{headline}</h1>
                {body && (
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                    <MentionText text={body} />
                  </p>
                )}
              </div>
            );
          }
          return b.value.trim() ? (
            <p key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              <MentionText text={b.value} />
            </p>
          ) : null;
        }
        if (b.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={resolveMediaUrl(b.value)} alt="" className="w-full rounded-2xl border border-border object-cover" />
          );
        }
        if (b.type === "video") {
          return (
            <video
              key={i}
              src={resolveMediaUrl(b.value)}
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-2xl bg-black"
            />
          );
        }
        return null;
      })}
      {extraMedia.length > 0 && <MediaCarousel items={extraMedia} />}
    </div>
  );
}
