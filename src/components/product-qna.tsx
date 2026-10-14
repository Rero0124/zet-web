"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import type { Question } from "@/lib/types";
import { QnaIcon } from "./icons";
import { MentionText } from "./mention-text";
import { MentionTextarea } from "./mention-textarea";
import { EmptyState } from "./ui/empty-state";
import { requireUser } from "./ui/login-prompt";
import { Spinner } from "./ui/skeleton";
import { toast } from "./ui/toast";

/** 상품 상세 안의 Q&A — 이 제품에 대한 질문만 모아 보고 바로 질문 */
export function ProductQna({
  postId,
  authorId,
  brandName,
  onCountChange,
}: {
  postId: string;
  authorId: string | null;
  brandName: string | null | undefined;
  onCountChange?: (n: number) => void;
}) {
  const user = useAuthUser();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [writing, setWriting] = useState(false);
  const isOwner = !!user && user.id === authorId;
  const countRef = useRef(onCountChange);
  useEffect(() => {
    countRef.current = onCountChange;
  });

  useEffect(() => {
    let cancelled = false;
    api<{ questions: Question[] }>(`/questions?post_id=${postId}&limit=50`)
      .then((d) => {
        if (cancelled) return;
        setQuestions(d.questions);
        countRef.current?.(d.questions.length);
      })
      .catch(() => !cancelled && setQuestions([]));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const unanswered = questions?.filter((q) => q.answer_count === 0).length ?? 0;

  return (
    <div>
      <div className="px-4 py-4">
        {isOwner ? (
          unanswered > 0 ? (
            <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
              답변을 기다리는 질문이 {unanswered}개 있어요. 빠른 답변은 구매 전환에 도움이 돼요.
            </p>
          ) : (
            <p className="rounded-xl bg-subtle px-4 py-3 text-center text-sm text-muted">
              고객 질문에 브랜드 계정으로 답변하면 &lsquo;브랜드 답변&rsquo; 배지가 표시돼요
            </p>
          )
        ) : writing ? (
          <QuestionForm
            postId={postId}
            onCancel={() => setWriting(false)}
            onCreated={(q) => {
              const next = [q, ...(questions ?? [])];
              setQuestions(next);
              onCountChange?.(next.length);
              setWriting(false);
              toast(`질문을 등록했어요. ${brandName ?? "브랜드"}의 답변을 기다려주세요`);
            }}
          />
        ) : (
          <button
            onClick={() => requireUser("질문하려면 로그인이 필요해요") && setWriting(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-subtle"
          >
            <QnaIcon size={16} />
            {brandName ? `${brandName}에게 질문하기` : "질문하기"}
          </button>
        )}
      </div>

      {questions === null ? (
        <Spinner />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<QnaIcon size={24} />}
          title="아직 질문이 없어요"
          description="사이즈, 성분, 배송 등 궁금한 점을 물어보세요."
        />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/qna/${q.id}`} className="block px-4 py-4 transition-colors hover:bg-subtle/60">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-sm font-bold text-accent">Q</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{q.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                      <MentionText text={q.content} />
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                      <span>@{q.user_username}</span>
                      <span>{timeAgo(q.created_at)}</span>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 font-medium ${
                          q.answer_count > 0 ? "bg-success/10 text-success" : "bg-subtle"
                        }`}
                      >
                        {q.answer_count > 0 ? `답변 ${q.answer_count}` : "답변 대기"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function QuestionForm({
  postId,
  onCancel,
  onCreated,
}: {
  postId: string;
  onCancel: () => void;
  onCreated: (q: Question) => void;
}) {
  const user = useAuthUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await api<{ question: Question }>("/questions", {
        method: "POST",
        body: JSON.stringify({ post_id: postId, user_id: user.id, title: title.trim(), content: content.trim() }),
      });
      onCreated({ ...data.question, user_name: user.name, user_username: user.username });
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문을 등록하지 못했어요");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="질문 제목 (예: 민감성 피부도 쓸 수 있나요?)"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-accent"
      />
      <MentionTextarea
        value={content}
        onChange={setContent}
        placeholder="궁금한 내용을 자세히 적어주세요"
        className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-subtle"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !content.trim()}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
        >
          {saving ? "등록 중..." : "질문 등록"}
        </button>
      </div>
    </form>
  );
}
