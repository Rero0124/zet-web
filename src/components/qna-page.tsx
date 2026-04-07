"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser, type User } from "@/lib/auth";
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

export function QnaPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    loadQuestions();
  }, []);

  async function loadQuestions(q?: string) {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const data = await api<{ questions: Question[] }>(`/questions${params}`);
      setQuestions(data.questions);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setSearched(true);
      loadQuestions(q);
    } else {
      setSearched(false);
      loadQuestions();
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearched(false);
    loadQuestions();
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Q&A</h1>
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              질문하기
            </button>
          )}
        </div>
        {/* 검색바 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="질문·답변 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            검색
          </button>
        </form>
        {searched && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>&quot;{searchQuery}&quot; 검색 결과 {questions.length}건</span>
            <button onClick={handleClearSearch} className="hover:text-foreground transition-colors">
              초기화
            </button>
          </div>
        )}
      </div>

      {/* 질문 작성 폼 */}
      {showForm && user && (
        <QuestionForm
          user={user}
          onCreated={() => {
            setShowForm(false);
            loadQuestions();
          }}
        />
      )}

      {/* 질문 목록 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : questions.length === 0 ? (
        <div className="py-20 text-center text-muted">
          {searched ? (
            <>
              <p className="text-lg">검색 결과가 없습니다</p>
              <p className="mt-1 text-sm">다른 키워드로 검색해보세요</p>
            </>
          ) : (
            <>
              <p className="text-lg">아직 질문이 없습니다</p>
              <p className="mt-1 text-sm">제품에 대해 궁금한 점을 질문해보세요</p>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              expanded={expandedId === q.id}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
              user={user}
              onDeleted={() => loadQuestions(searched ? searchQuery : undefined)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionForm({
  user,
  onCreated,
}: {
  user: User;
  onCreated: () => void;
}) {
  const [postId, setPostId] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !postId.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await api("/questions", {
        method: "POST",
        body: JSON.stringify({
          post_id: postId.trim(),
          user_id: user.id,
          content: content.trim(),
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문 작성에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-border px-4 py-4 space-y-3">
      <input
        type="text"
        placeholder="게시글 ID (질문할 제품의 ID)"
        value={postId}
        onChange={(e) => setPostId(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <textarea
        placeholder="질문 내용을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={submitting || !content.trim() || !postId.trim()}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}

function QuestionItem({
  question,
  expanded,
  onToggle,
  user,
  onDeleted,
}: {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  user: User | null;
  onDeleted: () => void;
}) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadAnswers();
    }
  }, [expanded]);

  async function loadAnswers() {
    setLoadingAnswers(true);
    try {
      const data = await api<{ answers: Answer[] }>(`/questions/${question.id}/answers`);
      setAnswers(data.answers);
    } catch {
      setAnswers([]);
    } finally {
      setLoadingAnswers(false);
    }
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !answerContent.trim()) return;

    setSubmitting(true);
    try {
      await api(`/questions/${question.id}/answers`, {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          content: answerContent.trim(),
        }),
      });
      setAnswerContent("");
      loadAnswers();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    try {
      await api(`/questions/${question.id}?user_id=${user.id}`, { method: "DELETE" });
      onDeleted();
    } catch {
      // ignore
    }
  }

  async function handleDeleteAnswer(answerId: string) {
    if (!user) return;
    try {
      await api(`/questions/${question.id}/answers/${answerId}?user_id=${user.id}`, { method: "DELETE" });
      loadAnswers();
    } catch {
      // ignore
    }
  }

  return (
    <div className="px-4 py-4">
      {/* 질문 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <button onClick={onToggle} className="flex-1 text-left">
          <p className="text-sm font-medium">{question.content}</p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
            <Link
              href={`/user/${question.user_id}`}
              className="hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              @{question.user_username}
            </Link>
            <span>{timeAgo(question.created_at)}</span>
            <span>답변 {question.answer_count}</span>
          </div>
        </button>
        {user?.id === question.user_id && (
          <button
            onClick={handleDelete}
            className="shrink-0 text-xs text-muted hover:text-red-500 transition-colors"
          >
            삭제
          </button>
        )}
      </div>

      {/* 답변 영역 */}
      {expanded && (
        <div className="mt-3 ml-3 border-l-2 border-border pl-4 space-y-3">
          {loadingAnswers ? (
            <div className="flex justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : answers.length === 0 ? (
            <p className="text-sm text-muted py-2">아직 답변이 없습니다</p>
          ) : (
            answers.map((a) => (
              <div key={a.id} className="text-sm">
                <p>{a.content}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <Link href={`/user/${a.user_id}`} className="hover:text-accent">
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
            ))
          )}

          {/* 답변 작성 */}
          {user && (
            <form onSubmit={handleAnswer} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="답변을 입력하세요..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={submitting || !answerContent.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                답변
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
