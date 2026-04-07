"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser, type User } from "@/lib/auth";
import { MentionText } from "./mention-text";
import { MentionInput } from "./mention-input";
import type { Question, Answer } from "@/lib/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export function QnaDetail({ questionId }: { questionId: string }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    loadQuestion();
  }, [questionId]);

  async function loadQuestion() {
    setLoading(true);
    try {
      const data = await api<{ question: Question; answers: Answer[] }>(`/questions/${questionId}`);
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch {
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !answerContent.trim()) return;

    setSubmitting(true);
    try {
      await api(`/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          content: answerContent.trim(),
        }),
      });
      setAnswerContent("");
      loadQuestion();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAnswer(answerId: string) {
    if (!user) return;
    try {
      await api(`/questions/${questionId}/answers/${answerId}?user_id=${user.id}`, { method: "DELETE" });
      loadQuestion();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-muted">
        <p className="text-lg">질문을 찾을 수 없습니다</p>
        <Link href="/qna" className="mt-2 inline-block text-sm text-accent hover:underline">
          Q&A 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 헤더 */}
      <div className="border-b border-border px-4 py-3">
        <Link href="/qna" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Q&A 목록
        </Link>
      </div>

      {/* 질문 */}
      <div className="px-4 py-6 border-b border-border">
        <h1 className="text-lg font-bold leading-snug">{question.title}</h1>

        {question.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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

        <div className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap">
          <MentionText text={question.content} />
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted">
          <Link href={`/user/${question.user_username}`} className="font-medium hover:text-accent">
            @{question.user_username}
          </Link>
          <span>{timeAgo(question.created_at)}</span>
          <Link href={`/post/${question.post_id}`} className="hover:text-accent">
            원본 게시글 보기
          </Link>
        </div>
      </div>

      {/* 답변 목록 */}
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold mb-4">답변 {answers.length}개</h2>

        {answers.length === 0 ? (
          <p className="text-sm text-muted py-4">아직 답변이 없습니다. 첫 번째 답변을 남겨보세요!</p>
        ) : (
          <div className="space-y-4">
            {answers.map((a) => (
              <div key={a.id} className="border-b border-border pb-4 last:border-0">
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  <MentionText text={a.content} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <Link href={`/user/${a.user_username}`} className="font-medium hover:text-accent">
                    @{a.user_username}
                  </Link>
                  <span>{timeAgo(a.created_at)}</span>
                  {user?.id === a.user_id && (
                    <button
                      onClick={() => handleDeleteAnswer(a.id)}
                      className="hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 답변 작성 */}
      {user && (
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3">
          <form onSubmit={handleAnswer} className="flex gap-2">
            <MentionInput
              placeholder="답변을 입력하세요... (@로 유저 태그 가능)"
              value={answerContent}
              onChange={setAnswerContent}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting || !answerContent.trim()}
              className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              답변
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
