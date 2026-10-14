"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { useFollowState } from "@/lib/follow-store";
import {
  ageGroupFromBirth,
  formatCount,
  postHeadline,
  postPath,
  splitHeadline,
  timeAgo,
} from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { shareLink } from "@/lib/share";
import type { Post, ProfileStats, PublicUser, Question, UserReview } from "@/lib/types";
import { FollowButton } from "./follow-button";
import {
  BookmarkIcon,
  ChartIcon,
  LogOutIcon,
  MegaphoneIcon,
  PlusIcon,
  QnaIcon,
  ShareIcon,
  StarIcon,
  VerifiedBadge,
} from "./icons";
import { MentionText } from "./mention-text";
import { useLogout } from "./nav";
import { PageColumn } from "./page-column";
import { PostList } from "./post-list";
import { Avatar } from "./ui/avatar";
import { EmptyState } from "./ui/empty-state";
import { Spinner } from "./ui/skeleton";
import { Stars } from "./ui/stars";

type TabKey = "posts" | "reviews" | "qna" | "saved" | "insights";

export function UserProfile({ initialUser, initialTab }: { initialUser: PublicUser; initialTab?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const me = useAuthUser();
  const logout = useLogout();
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<string>(initialTab ?? "");

  const isMe = hydrated && me?.id === user.id;
  const isBrand = user.role === "business";
  const follow = useFollowState(user.id, { following: isFollowing, follower_count: stats?.followers ?? 0 });

  const tabs: { key: TabKey; label: string }[] = [
    ...(isBrand ? [{ key: "posts" as const, label: "게시물" }] : [{ key: "reviews" as const, label: "리뷰" }]),
    { key: "qna", label: "Q&A" },
    ...(isMe ? [{ key: "saved" as const, label: "저장됨" }] : []),
    ...(isMe && isBrand ? [{ key: "insights" as const, label: "광고 성과" }] : []),
  ];
  const activeTab = (tabs.some((t) => t.key === tab) ? tab : tabs[0].key) as TabKey;

  useEffect(() => {
    if (!hydrated) return;
    const viewer = me ? `?viewer_id=${me.id}` : "";
    api<{ user: PublicUser; stats?: ProfileStats; is_following?: boolean }>(`/users/${initialUser.id}${viewer}`)
      .then((d) => {
        setUser(d.user);
        if (d.stats) setStats(d.stats);
        setIsFollowing(!!d.is_following);
      })
      .catch(() => {});
  }, [hydrated, me, initialUser.id]);

  function selectTab(key: TabKey) {
    setTab(key);
    router.replace(`?tab=${key}`, { scroll: false });
  }

  const privateInfo = [
    user.birth_date ? ageGroupFromBirth(user.birth_date) : null,
    user.gender,
    user.region,
  ].filter(Boolean);

  return (
    <PageColumn>
      {/* 프로필 헤더 */}
      <section className="px-4 pb-4 pt-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar_url} brand={isBrand} size={76} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 text-xl font-bold leading-tight">
              <span className="truncate">{user.name}</span>
              {isBrand && <VerifiedBadge size={19} />}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              @{user.username}
              {isBrand && <span className="ml-1.5 rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent">브랜드</span>}
            </p>
            <div className="mt-3 flex gap-5 text-sm">
              {isBrand ? (
                <>
                  <StatItem label="게시물" value={stats?.posts} />
                  <StatItem label="팔로워" value={stats ? follow.follower_count : undefined} />
                </>
              ) : (
                <StatItem label="리뷰" value={stats?.reviews} />
              )}
              <StatItem label="팔로잉" value={stats?.following} />
            </div>
          </div>
        </div>

        {user.bio && <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{user.bio}</p>}
        {isMe && !user.bio && (
          <Link href="/profile" className="mt-4 block text-sm text-muted hover:text-foreground">
            + {isBrand ? "브랜드 소개를 추가해보세요" : "한 줄 소개를 추가해보세요"}
          </Link>
        )}
        {isMe && !isBrand && privateInfo.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            {privateInfo.join(" · ")} <span className="ml-1">(나에게만 보여요 · 추천에 사용)</span>
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {isMe ? (
            <>
              <Link href="/profile" className="flex-1 rounded-xl bg-subtle py-2 text-center text-sm font-semibold hover:bg-border">
                프로필 편집
              </Link>
              {isBrand && (
                <Link
                  href="/write"
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-accent py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  <PlusIcon size={15} strokeWidth={2.4} />
                  광고 만들기
                </Link>
              )}
              <button
                onClick={logout}
                aria-label="로그아웃"
                className="rounded-xl bg-subtle px-3 text-muted hover:bg-border hover:text-foreground md:hidden"
              >
                <LogOutIcon size={17} />
              </button>
            </>
          ) : isBrand && hydrated ? (
            <FollowButton
              userId={user.id}
              name={user.name}
              following={isFollowing}
              followerCount={stats?.followers ?? 0}
              className="flex-1 !rounded-xl !py-2"
            />
          ) : null}
          <button
            onClick={() => shareLink(`/user/${user.username}`, user.name)}
            aria-label="프로필 공유"
            className={`flex items-center justify-center gap-1.5 rounded-xl bg-subtle px-3 py-2 text-sm font-semibold hover:bg-border ${
              !isMe && !isBrand ? "flex-1" : ""
            }`}
          >
            <ShareIcon size={16} />
            {!isMe && !isBrand && "프로필 공유"}
          </button>
        </div>
      </section>

      {/* 탭 */}
      <div role="tablist" className="sticky top-14 z-30 flex border-b border-border bg-background/90 backdrop-blur-md">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => selectTab(t.key)}
            className={`relative flex-1 py-3 text-[15px] ${
              activeTab === t.key ? "font-bold" : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {activeTab === t.key && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-10 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>

      {activeTab === "posts" && (
        <PostList
          path={`/users/${user.id}/posts`}
          empty={
            <EmptyState
              icon={<MegaphoneIcon size={24} />}
              title={isMe ? "첫 광고를 올려보세요" : "아직 게시물이 없어요"}
              description={isMe ? "제품을 소개하면 관심 있는 사용자의 피드에 노출돼요." : undefined}
              action={
                isMe && (
                  <Link href="/write" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
                    광고 만들기
                  </Link>
                )
              }
            />
          }
        />
      )}
      {activeTab === "reviews" && <ReviewsTab userId={user.id} isMe={isMe} />}
      {activeTab === "qna" && <QnaTab userId={user.id} />}
      {activeTab === "saved" && isMe && (
        <PostList
          path={`/users/${user.id}/bookmarks`}
          empty={
            <EmptyState
              icon={<BookmarkIcon size={24} />}
              title="저장한 제품이 없어요"
              description="마음에 드는 제품의 저장 버튼을 누르면 여기에 모여요."
              action={
                <Link href="/" className="rounded-full bg-subtle px-5 py-2.5 text-sm font-semibold hover:bg-border">
                  피드 둘러보기
                </Link>
              }
            />
          }
        />
      )}
      {activeTab === "insights" && isMe && <BrandDashboard userId={user.id} />}
    </PageColumn>
  );
}

function StatItem({ label, value }: { label: string; value: number | undefined }) {
  return (
    <span>
      <span className="font-bold">{value === undefined ? "-" : formatCount(value)}</span>{" "}
      <span className="text-muted">{label}</span>
    </span>
  );
}

function ReviewsTab({ userId, isMe }: { userId: string; isMe: boolean }) {
  const [reviews, setReviews] = useState<UserReview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ reviews: UserReview[] }>(`/users/${userId}/reviews?limit=50`)
      .then((d) => !cancelled && setReviews(d.reviews))
      .catch(() => !cancelled && setReviews([]));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (reviews === null) return <Spinner />;
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<StarIcon size={24} />}
        title={isMe ? "아직 작성한 리뷰가 없어요" : "작성한 리뷰가 없어요"}
        description={isMe ? "써본 제품에 리뷰를 남기면 다른 사람들의 선택에 도움이 돼요." : undefined}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {reviews.map((r) => (
        <li key={r.id} className="px-4 py-4">
          <Link
            href={`/post/${r.post_id}#reviews`}
            className="flex items-center gap-2 rounded-xl bg-subtle px-3 py-2 text-sm transition-colors hover:bg-border"
          >
            <span className="shrink-0 font-semibold">{r.post_author_name}</span>
            <span className="truncate text-muted">{splitHeadline(r.post_content || "").headline}</span>
          </Link>
          <div className="mt-2 flex items-center gap-2">
            {r.rating ? <Stars value={r.rating} size={13} /> : null}
            <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
          </div>
          {r.content && (
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              <MentionText text={r.content} />
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function QnaTab({ userId }: { userId: string }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ questions: Question[] }>(`/questions?user_id=${userId}&limit=50`)
      .then((d) => !cancelled && setQuestions(d.questions))
      .catch(() => !cancelled && setQuestions([]));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (questions === null) return <Spinner />;
  if (questions.length === 0) {
    return <EmptyState icon={<QnaIcon size={24} />} title="작성한 질문이 없어요" />;
  }

  return (
    <ul className="divide-y divide-border">
      {questions.map((q) => (
        <li key={q.id}>
          <Link href={`/qna/${q.id}`} className="block px-4 py-4 transition-colors hover:bg-subtle/60">
            {q.post_author_name && (
              <p className="mb-1 truncate text-xs text-muted">
                {q.post_author_name} · {splitHeadline(q.post_content || "").headline}
              </p>
            )}
            <p className="text-sm font-semibold">{q.title}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">
              <MentionText text={q.content} />
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
              <span>{timeAgo(q.created_at)}</span>
              <span className={q.answer_count > 0 ? "font-medium text-success" : ""}>
                {q.answer_count > 0 ? `답변 ${q.answer_count}` : "답변 대기"}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 브랜드 본인용 광고 성과 요약 — 게시물별 지표를 한눈에 */
function BrandDashboard({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ posts: Post[] }>(`/users/${userId}/posts?limit=50&viewer_id=${userId}`)
      .then((d) => !cancelled && setPosts(d.posts))
      .catch(() => !cancelled && setPosts([]));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (posts === null) return <Spinner />;
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<ChartIcon size={24} />}
        title="아직 집계할 광고가 없어요"
        description="광고를 게시하면 노출·클릭·반응 성과를 여기서 확인할 수 있어요."
        action={
          <Link href="/write" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
            광고 만들기
          </Link>
        }
      />
    );
  }

  const sum = (f: (p: Post) => number) => posts.reduce((s, p) => s + f(p), 0);
  const impressions = sum((p) => p.impressions);
  const clicks = sum((p) => p.clicks);
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const sorted = [...posts].sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="px-4 py-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="총 노출" value={formatCount(impressions)} />
        <Tile label="상세 클릭" value={formatCount(clicks)} hint={`클릭률 ${ctr.toFixed(1)}%`} />
        <Tile label="좋아요 · 저장" value={`${formatCount(sum((p) => p.like_count))} · ${formatCount(sum((p) => p.bookmark_count))}`} />
        <Tile label="리뷰" value={formatCount(sum((p) => p.review_count))} hint={`게시물 ${posts.length}개`} />
      </div>

      <h3 className="mt-6 text-sm font-semibold">게시물별 성과</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[520px] text-sm tabular-nums">
          <thead className="bg-subtle text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">게시물</th>
              <th className="px-3 py-2 text-right font-medium">노출</th>
              <th className="px-3 py-2 text-right font-medium">클릭</th>
              <th className="px-3 py-2 text-right font-medium">클릭률</th>
              <th className="px-3 py-2 text-right font-medium">좋아요</th>
              <th className="px-3 py-2 text-right font-medium">리뷰</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((p) => (
              <tr key={p.id} className="hover:bg-subtle/60">
                <td className="max-w-56 px-3 py-2.5">
                  <Link href={`${postPath(p)}#insights`} className="block truncate font-medium hover:underline">
                    {postHeadline(p) || "(제목 없음)"}
                  </Link>
                  <span className="text-xs text-muted">{timeAgo(p.created_at)}</span>
                </td>
                <td className="px-3 py-2.5 text-right">{formatCount(p.impressions)}</td>
                <td className="px-3 py-2.5 text-right">{formatCount(p.clicks)}</td>
                <td className="px-3 py-2.5 text-right">
                  {p.impressions ? `${((p.clicks / p.impressions) * 100).toFixed(1)}%` : "-"}
                </td>
                <td className="px-3 py-2.5 text-right">{formatCount(p.like_count)}</td>
                <td className="px-3 py-2.5 text-right">{formatCount(p.review_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">게시물을 누르면 일별 추이와 반응한 사용자 분포를 볼 수 있어요.</p>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-subtle px-3.5 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
