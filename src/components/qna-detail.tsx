"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { formatPrice, postHeadline, postMedia, profilePath, splitHeadline, timeAgo } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import type { Answer, Post, Question } from "@/lib/types";
import { BagIcon, ChevronLeftIcon, ChevronRightIcon, MoreIcon, QnaIcon, TrashIcon, VerifiedBadge } from "./icons";
import { MentionText } from "./mention-text";
import { MentionTextarea } from "./mention-textarea";
import { PageColumn } from "./page-column";
import { Avatar } from "./ui/avatar";
import { EmptyState } from "./ui/empty-state";
import { requireUser } from "./ui/login-prompt";
import { Menu } from "./ui/menu";
import { Spinner } from "./ui/skeleton";
import { toast } from "./ui/toast";

async function fetchQuestion(id: string) {
  return api<{ question: Question; answers: Answer[] }>(`/questions/${id}`);
}

export function QnaDetail({ questionId }: { questionId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthUser();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [product, setProduct] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchQuestion(questionId)
      .then((data) => {
        if (cancelled) return;
        setQuestion(data.question);
        setAnswers(data.answers);
        return api<{ post: Post }>(`/posts/${data.question.post_id}`)
          .then((d) => !cancelled && setProduct(d.post))
          .catch(() => {});
      })
      .catch(() => !cancelled && setQuestion(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  async function refreshAnswers() {
    try {
      const data = await fetchQuestion(questionId);
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch {
      // 목록 갱신 실패 시 기존 화면 유지
    }
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/qna");
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !answerContent.trim()) return;

    setSubmitting(true);
    try {
      await api(`/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, content: answerContent.trim() }),
      });
      setAnswerContent("");
      toast("답변을 등록했어요");
      await refreshAnswers();
    } catch (err) {
      toast(err instanceof Error ? err.message : "답변을 등록하지 못했어요", { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAnswer(answerId: string) {
    if (!user || !confirm("답변을 삭제할까요?")) return;
    try {
      await api(`/questions/${questionId}/answers/${answerId}?user_id=${user.id}`, { method: "DELETE" });
      setAnswers((prev) => prev.filter((a) => a.id !== answerId));
      toast("답변을 삭제했어요");
    } catch {
      toast("답변을 삭제하지 못했어요", { tone: "error" });
    }
  }

  async function handleDeleteQuestion() {
    if (!user || !confirm("이 질문을 삭제할까요? 달린 답변도 함께 삭제돼요.")) return;
    try {
      await api(`/questions/${questionId}?user_id=${user.id}`, { method: "DELETE" });
      toast("질문을 삭제했어요");
      router.push("/qna");
    } catch {
      toast("질문을 삭제하지 못했어요", { tone: "error" });
    }
  }

  const isMine = !!user && question?.user_id === user.id;
  const isProductOwner =
    !!user && (question?.post_author_id === user.id || (!!product && product.author_id === user.id));

  return (
    <PageColumn>
      {/* 상단 바 */}
      <div className="sticky top-14 z-30 flex h-12 items-center gap-1 border-b border-border bg-background/90 px-2 backdrop-blur-md">
        <button onClick={goBack} aria-label="뒤로 가기" className="rounded-full p-1.5 hover:bg-subtle">
          <ChevronLeftIcon size={24} />
        </button>
        <span className="text-[15px] font-semibold">질문</span>
        {isMine && (
          <div className="ml-auto">
            <Menu
              trigger={<MoreIcon size={20} />}
              items={[{ label: "질문 삭제", icon: <TrashIcon size={16} />, danger: true, onSelect: handleDeleteQuestion }]}
            />
          </div>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : !question ? (
        <EmptyState
          icon={<QnaIcon size={24} />}
          title="질문을 찾을 수 없어요"
          description="삭제되었거나 주소가 잘못되었을 수 있어요."
          action={
            <Link href="/qna" className="rounded-full bg-subtle px-5 py-2.5 text-sm font-semibold hover:bg-border">
              Q&A 목록으로
            </Link>
          }
        />
      ) : (
        <>
          {/* 제품 */}
          <div className="px-4 pt-4">
            <ProductCard question={question} product={product} />
          </div>

          {/* 질문 */}
          <section className="border-b border-border px-4 py-5">
            <div className="flex items-center gap-2.5">
              <Link href={profilePath(question.user_username, question.user_id)}>
                <Avatar name={question.user_name} size={36} />
              </Link>
              <div className="min-w-0 leading-tight">
                <Link
                  href={profilePath(question.user_username, question.user_id)}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {question.user_name}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  @{question.user_username} · {timeAgo(question.created_at)}
                </p>
              </div>
            </div>

            <h1 className="mt-4 text-lg font-bold leading-snug">
              <span className="mr-1 text-accent">Q.</span>
              {question.title}
            </h1>

            <div className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">
              <MentionText text={question.content} />
            </div>

            {question.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {question.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/qna?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 답변 */}
          <section className="px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold">답변 {answers.length}개</h2>

            {answers.length === 0 ? (
              <p className="rounded-xl bg-subtle px-4 py-6 text-center text-sm text-muted">
                아직 답변이 없어요. {question.post_author_name ? `${question.post_author_name}의 답변을 기다리고 있어요.` : "첫 답변을 남겨보세요."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {answers.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-2xl px-4 py-3 ${
                      a.is_brand ? "border border-accent/25 bg-accent/5" : "border border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Link href={profilePath(a.user_username, a.user_id)} className="shrink-0">
                        <Avatar name={a.user_name} size={32} brand={!!a.is_brand} />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <Link
                          href={profilePath(a.user_username, a.user_id)}
                          className="truncate text-sm font-semibold hover:underline"
                        >
                          {a.user_name}
                        </Link>
                        {a.is_brand && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            <VerifiedBadge size={12} />
                            브랜드 답변
                          </span>
                        )}
                        <span className="text-xs text-muted">{timeAgo(a.created_at)}</span>
                      </div>
                      {user?.id === a.user_id && (
                        <Menu
                          trigger={<MoreIcon size={16} />}
                          items={[
                            { label: "삭제", icon: <TrashIcon size={15} />, danger: true, onSelect: () => handleDeleteAnswer(a.id) },
                          ]}
                        />
                      )}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      <MentionText text={a.content} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* 답변 작성 */}
            <div className="mt-4">
              {!hydrated ? null : !user ? (
                <button
                  onClick={() => requireUser("답변하려면 로그인이 필요해요")}
                  className="w-full rounded-xl border border-border py-3 text-sm font-semibold hover:bg-subtle"
                >
                  로그인하고 답변 남기기
                </button>
              ) : (
                <form onSubmit={handleAnswer} className="rounded-2xl border border-border p-3">
                  {isProductOwner && (
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-accent">
                      <VerifiedBadge size={13} />
                      브랜드 계정으로 답변하면 &lsquo;브랜드 답변&rsquo;으로 표시돼요
                    </p>
                  )}
                  <MentionTextarea
                    placeholder={isProductOwner ? "브랜드 공식 답변을 남겨주세요" : "답변을 입력하세요 (@로 유저 태그)"}
                    value={answerContent}
                    onChange={setAnswerContent}
                    className="min-h-20 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !answerContent.trim()}
                      className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                    >
                      {submitting ? "등록 중..." : "답변 등록"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </>
      )}
    </PageColumn>
  );
}

/** 질문 대상 제품 카드 — 제품 정보를 못 받아와도 질문에 담긴 요약으로 표시 */
function ProductCard({ question, product }: { question: Question; product: Post | null }) {
  const brandName = product?.author_name ?? question.post_author_name;
  const headline = product
    ? postHeadline(product)
    : question.post_content
      ? splitHeadline(question.post_content).headline
      : "";
  const thumb = product ? postMedia(product).find((m) => m.type === "image") : undefined;

  return (
    <Link
      href={`/post/${question.post_id}`}
      className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-subtle"
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb.url} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover" />
      ) : brandName ? (
        <Avatar name={brandName} src={product?.author_avatar_url} brand size={48} />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted">
          <BagIcon size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-xs text-muted">
          <span className="truncate">{brandName ?? "질문한 제품"}</span>
          {(product?.author_role === "business" || (!product && question.post_author_name)) && <VerifiedBadge size={12} />}
        </p>
        <p className="truncate text-sm font-semibold">{headline || "제품 보러 가기"}</p>
        {product?.price != null && <p className="text-xs font-semibold">{formatPrice(product.price)}</p>}
      </div>
      <ChevronRightIcon size={18} className="shrink-0 text-muted" />
    </Link>
  );
}
