"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser, type User } from "@/lib/auth";
import { MentionText } from "./mention-text";
import { MentionTextarea } from "./mention-textarea";
import { MentionInput } from "./mention-input";
import type { Question, Answer } from "@/lib/types";

const PAGE_SIZE = 20;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [searched, setSearched] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getAuthUser());
    loadQuestions();
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, questions.length, activeSearch, activeTag]);

  function buildParams(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (activeSearch) params.set("q", activeSearch);
    if (activeTag) params.set("tag", activeTag);
    params.set("limit", String(PAGE_SIZE));
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    return params.toString();
  }

  async function loadQuestions(opts?: { q?: string; tag?: string }) {
    setLoading(true);
    setHasMore(true);
    const q = opts?.q ?? activeSearch;
    const tag = opts?.tag ?? activeTag;
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      params.set("limit", String(PAGE_SIZE));
      const data = await api<{ questions: Question[] }>(`/questions?${params}`);
      setQuestions(data.questions);
      setHasMore(data.questions.length >= PAGE_SIZE);
    } catch {
      setQuestions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const qs = buildParams({ cursor: String(questions.length) });
      const data = await api<{ questions: Question[] }>(`/questions?${qs}`);
      setQuestions((prev) => [...prev, ...data.questions]);
      setHasMore(data.questions.length >= PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setSearched(true);
      setActiveSearch(q);
      loadQuestions({ q });
    } else {
      handleClearSearch();
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    setActiveSearch("");
    setSearched(false);
    loadQuestions({ q: "" });
  }

  function handleTagClick(tag: string) {
    if (activeTag === tag) {
      setActiveTag("");
      loadQuestions({ tag: "" });
    } else {
      setActiveTag(tag);
      loadQuestions({ tag });
    }
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
        {(searched || activeTag) && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {searched && <>&quot;{activeSearch}&quot; </>}
              {activeTag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-accent text-xs font-medium">
                  #{activeTag}
                  <button onClick={() => handleTagClick(activeTag)} className="hover:text-foreground">&times;</button>
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setActiveTag("");
                handleClearSearch();
              }}
              className="hover:text-foreground transition-colors"
            >
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
          {searched || activeTag ? (
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
        <>
          <div className="divide-y divide-border">
            {questions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                expanded={expandedId === q.id}
                onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                onTagClick={handleTagClick}
                activeTag={activeTag}
                user={user}
                onDeleted={() => loadQuestions()}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="flex justify-center py-6">
            {loadingMore && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            )}
            {!hasMore && questions.length > 0 && (
              <p className="text-sm text-muted">모든 질문을 불러왔습니다</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── 질문 작성 폼 ── */
function QuestionForm({
  user,
  onCreated,
}: {
  user: User;
  onCreated: () => void;
}) {
  const [postId, setPostId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, "");
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !postId.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await api("/questions", {
        method: "POST",
        body: JSON.stringify({
          post_id: postId.trim(),
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
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
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-accent"
      />
      <MentionTextarea
        placeholder="내용을 입력하세요... (@로 유저 태그 가능)"
        value={content}
        onChange={setContent}
        rows={5}
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
      />
      {/* 태그 입력 */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
          >
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-foreground">&times;</button>
          </span>
        ))}
        <input
          type="text"
          placeholder={tags.length === 0 ? "태그 입력 (Enter로 추가)" : ""}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          className="flex-1 min-w-30 bg-transparent text-sm outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim() || !postId.trim()}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}

/* ── 질문 아이템 (게시글 스타일) ── */
function QuestionItem({
  question,
  expanded,
  onToggle,
  onTagClick,
  activeTag,
  user,
  onDeleted,
}: {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  onTagClick: (tag: string) => void;
  activeTag: string;
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
      {/* 제목 + 메타 */}
      <div className="w-full text-left">
        <Link href={`/qna/${question.id}`} className="hover:text-accent transition-colors">
          <h3 className="text-[15px] font-semibold leading-snug">{question.title}</h3>
        </Link>
        {!expanded && question.content && (
          <button onClick={onToggle} className="w-full text-left">
            <p className="mt-1 text-sm text-muted line-clamp-2"><MentionText text={question.content} /></p>
          </button>
        )}
      </div>

      {/* 태그 */}
      {question.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {question.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                activeTag === tag
                  ? "bg-accent text-white"
                  : "bg-accent/10 text-accent hover:bg-accent/20"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 메타 정보 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href={`/user/${question.user_id}`} className="hover:text-accent">
            @{question.user_username}
          </Link>
          <span>{timeAgo(question.created_at)}</span>
          <button onClick={onToggle} className="hover:text-foreground">
            답변 {question.answer_count}
          </button>
        </div>
        {user?.id === question.user_id && (
          <button
            onClick={handleDelete}
            className="text-xs text-muted hover:text-red-500 transition-colors"
          >
            삭제
          </button>
        )}
      </div>

      {/* 펼쳐진 본문 + 답변 */}
      {expanded && (
        <div className="mt-3 space-y-4">
          {/* 본문 */}
          <div className="rounded-lg bg-background border border-border p-4 text-sm whitespace-pre-wrap leading-relaxed">
            <MentionText text={question.content} />
          </div>

          {/* 답변 영역 */}
          <div className="ml-2 border-l-2 border-border pl-4 space-y-3">
            <p className="text-xs font-medium text-muted">답변 {answers.length}개</p>
            {loadingAnswers ? (
              <div className="flex justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : answers.length === 0 ? (
              <p className="text-sm text-muted py-2">아직 답변이 없습니다</p>
            ) : (
              answers.map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="whitespace-pre-wrap"><MentionText text={a.content} /></p>
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
                <MentionInput
                  placeholder="답변을 입력하세요... (@로 유저 태그 가능)"
                  value={answerContent}
                  onChange={setAnswerContent}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={submitting || !answerContent.trim()}
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  답변
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
