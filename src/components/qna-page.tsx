"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser, type User } from "@/lib/auth";
import { formatPrice, postHeadline, profilePath, splitHeadline, timeAgo } from "@/lib/format";
import type { Post, Question } from "@/lib/types";
import { BagIcon, MoreIcon, QnaIcon, SearchIcon, TrashIcon, VerifiedBadge, XIcon } from "./icons";
import { MentionText } from "./mention-text";
import { MentionTextarea } from "./mention-textarea";
import { PageColumn } from "./page-column";
import { Avatar } from "./ui/avatar";
import { EmptyState } from "./ui/empty-state";
import { requireUser } from "./ui/login-prompt";
import { Menu } from "./ui/menu";
import { Spinner } from "./ui/skeleton";
import { toast } from "./ui/toast";

const PAGE_SIZE = 20;

function buildQuery(q: string, tag: string, cursor = 0) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
  params.set("limit", String(PAGE_SIZE));
  if (cursor) params.set("cursor", String(cursor));
  return params.toString();
}

async function fetchQuestions(q: string, tag: string, cursor = 0) {
  const data = await api<{ questions: Question[] }>(`/questions?${buildQuery(q, tag, cursor)}`);
  return data.questions;
}

export function QnaPage({ initialPostId, initialTag = "" }: { initialPostId?: string; initialTag?: string }) {
  const user = useAuthUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(!!initialPostId);
  const [preselected, setPreselected] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeTag, setActiveTag] = useState(initialTag);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // 첫 진입
  useEffect(() => {
    const id = ++requestId.current;
    fetchQuestions("", initialTag)
      .then((list) => {
        if (id !== requestId.current) return;
        setQuestions(list);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setQuestions([]);
        setHasMore(false);
      })
      .finally(() => id === requestId.current && setLoading(false));
  }, [initialTag]);

  // 상품 상세에서 "질문하기"로 들어온 경우 해당 상품을 미리 선택
  useEffect(() => {
    if (!initialPostId) return;
    api<{ post: Post }>(`/posts/${initialPostId}`)
      .then((d) => setPreselected(d.post))
      .catch(() => {});
  }, [initialPostId]);

  async function reload(q: string, tag: string) {
    const id = ++requestId.current;
    setLoading(true);
    setHasMore(true);
    try {
      const list = await fetchQuestions(q, tag);
      if (id !== requestId.current) return;
      setQuestions(list);
      setHasMore(list.length >= PAGE_SIZE);
    } catch {
      if (id !== requestId.current) return;
      setQuestions([]);
      setHasMore(false);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  // 무한 스크롤
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const id = requestId.current;
        setLoadingMore(true);
        try {
          const list = await fetchQuestions(activeSearch, activeTag, questions.length);
          if (id !== requestId.current) return;
          setQuestions((prev) => [...prev, ...list.filter((q) => !prev.some((p) => p.id === q.id))]);
          setHasMore(list.length >= PAGE_SIZE);
        } catch {
          setHasMore(false);
        } finally {
          setLoadingMore(false);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, questions.length, activeSearch, activeTag]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    setActiveSearch(q);
    reload(q, activeTag);
  }

  function clearSearch() {
    setSearchQuery("");
    setActiveSearch("");
    reload("", activeTag);
  }

  function toggleTag(tag: string) {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    reload(activeSearch, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    setSearchQuery("");
    setActiveSearch("");
    setActiveTag("");
    reload("", "");
  }

  function openForm() {
    if (!requireUser("질문하려면 로그인이 필요해요")) return;
    setShowForm(true);
  }

  const filtered = !!activeSearch || !!activeTag;

  return (
    <PageColumn>
      {/* 헤더 */}
      <div className="sticky top-14 z-30 space-y-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Q&A</h1>
            <p className="text-xs text-muted">제품이 궁금할 땐 브랜드와 사용자에게 직접 물어보세요</p>
          </div>
          {!showForm && (
            <button
              onClick={openForm}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              <QnaIcon size={16} />
              질문하기
            </button>
          )}
        </div>
        <form onSubmit={handleSearch} className="relative" role="search">
          <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="질문 제목, #태그 검색"
            aria-label="질문 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-subtle py-2 pl-9 pr-9 text-sm outline-none ring-accent/40 placeholder:text-muted focus:bg-background focus:ring-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="검색어 지우기"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-foreground"
            >
              <XIcon size={14} />
            </button>
          )}
        </form>
        {filtered && (
          <div className="flex items-center gap-2 text-sm">
            {activeSearch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs font-medium">
                &ldquo;{activeSearch}&rdquo;
                <button onClick={clearSearch} aria-label="검색어 해제" className="text-muted hover:text-foreground">
                  <XIcon size={12} />
                </button>
              </span>
            )}
            {activeTag && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                #{activeTag}
                <button onClick={() => toggleTag(activeTag)} aria-label="태그 해제" className="hover:text-foreground">
                  <XIcon size={12} />
                </button>
              </span>
            )}
            <button onClick={resetAll} className="ml-auto text-xs text-muted hover:text-foreground">
              초기화
            </button>
          </div>
        )}
      </div>

      {/* 질문 작성 */}
      {showForm && (
        <NewQuestionForm
          key={preselected?.id ?? "none"}
          user={user}
          initialProduct={preselected}
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            toast("질문을 등록했어요. 답변이 달리면 여기서 확인할 수 있어요");
            reload(activeSearch, activeTag);
          }}
        />
      )}

      {/* 목록 */}
      {loading ? (
        <Spinner />
      ) : questions.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={<SearchIcon size={24} />}
            title="검색 결과가 없어요"
            description="다른 키워드나 태그로 찾아보세요."
            action={
              <button onClick={resetAll} className="rounded-full bg-subtle px-5 py-2.5 text-sm font-semibold hover:bg-border">
                전체 질문 보기
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={<QnaIcon size={24} />}
            title="아직 질문이 없어요"
            description="제품에 대해 궁금한 점을 가장 먼저 물어보세요."
          />
        )
      ) : (
        <>
          <ul className="divide-y divide-border">
            {questions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                user={user}
                activeTag={activeTag}
                onTagClick={toggleTag}
                onDeleted={(id) => setQuestions((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </ul>
          <div ref={sentinelRef} className="flex justify-center py-6">
            {loadingMore && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            )}
            {!hasMore && <p className="text-sm text-muted">모든 질문을 확인했어요</p>}
          </div>
        </>
      )}
    </PageColumn>
  );
}

/* ── 상품 선택 ── */
function ProductPicker({ selected, onSelect }: { selected: Post | null; onSelect: (p: Post | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ term: string; posts: Post[] } | null>(null);
  const term = query.trim();

  useEffect(() => {
    if (!term) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api<{ posts: Post[] }>(`/search?q=${encodeURIComponent(term)}&limit=8`)
        .then((d) => !cancelled && setResults({ term, posts: d.posts }))
        .catch(() => !cancelled && setResults({ term, posts: [] }));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2.5">
        <Avatar name={selected.author_name} src={selected.author_avatar_url} brand size={36} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-xs text-muted">
            <span className="truncate">{selected.author_name ?? "브랜드"}</span>
            {selected.author_role === "business" && <VerifiedBadge size={12} />}
          </p>
          <p className="truncate text-sm font-semibold">{postHeadline(selected)}</p>
          {selected.price != null && <p className="text-xs font-medium">{formatPrice(selected.price)}</p>}
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="선택한 제품 해제"
          className="rounded-full p-1.5 text-muted hover:bg-subtle hover:text-foreground"
        >
          <XIcon size={16} />
        </button>
      </div>
    );
  }

  const searching = !!term && results?.term !== term;
  const list = term && results?.term === term ? results.posts : [];

  return (
    <div>
      <div className="relative">
        <BagIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="어떤 제품에 대한 질문인가요? 제품명·브랜드로 검색"
          aria-label="질문할 제품 검색"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-accent"
        />
      </div>
      {term && (
        <div className="mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-border">
          {searching ? (
            <p className="px-4 py-3 text-sm text-muted">검색 중...</p>
          ) : list.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">&ldquo;{term}&rdquo;에 해당하는 제품이 없어요</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-subtle"
                  >
                    <Avatar name={p.author_name} src={p.author_avatar_url} brand size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted">{p.author_name ?? "브랜드"}</p>
                      <p className="truncate text-sm font-medium">{postHeadline(p)}</p>
                    </div>
                    {p.price != null && <span className="shrink-0 text-xs font-semibold">{formatPrice(p.price)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 질문 작성 폼 ── */
function NewQuestionForm({
  user,
  initialProduct,
  onCancel,
  onCreated,
}: {
  user: User | null;
  initialProduct: Post | null;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [product, setProduct] = useState<Post | null>(initialProduct);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  const canSubmit = !!product && !!title.trim() && !!content.trim() && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const me = user ?? requireUser("질문하려면 로그인이 필요해요");
    if (!me || !product || !canSubmit) return;

    setSubmitting(true);
    setError("");
    try {
      await api("/questions", {
        method: "POST",
        body: JSON.stringify({
          post_id: product.id,
          user_id: me.id,
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문을 등록하지 못했어요");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-b border-border px-4 py-4">
      <p className="text-sm font-semibold">새 질문</p>
      <ProductPicker selected={product} onSelect={setProduct} />
      <input
        type="text"
        placeholder="질문 제목 (예: 민감성 피부도 쓸 수 있나요?)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:border-accent"
      />
      <MentionTextarea
        placeholder="궁금한 내용을 자세히 적어주세요 (@로 유저 태그)"
        value={content}
        onChange={setContent}
        className="min-h-24 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-accent">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
          >
            #{tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              aria-label={`${tag} 태그 삭제`}
              className="hover:text-foreground"
            >
              <XIcon size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={tags.length === 0 ? "태그 입력 후 Enter (선택)" : ""}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={() => tagInput.trim() && addTag()}
          className="min-w-30 flex-1 bg-transparent py-0.5 text-sm outline-none"
        />
      </div>
      {!product && <p className="text-xs text-muted">질문할 제품을 먼저 선택해주세요.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-subtle"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {submitting ? "등록 중..." : "질문 등록"}
        </button>
      </div>
    </form>
  );
}

/* ── 질문 아이템 ── */
function QuestionItem({
  question,
  user,
  activeTag,
  onTagClick,
  onDeleted,
}: {
  question: Question;
  user: User | null;
  activeTag: string;
  onTagClick: (tag: string) => void;
  onDeleted: (id: string) => void;
}) {
  const headline = question.post_content ? splitHeadline(question.post_content).headline : "";
  const isMine = user?.id === question.user_id;

  async function handleDelete() {
    if (!user || !confirm("이 질문을 삭제할까요? 달린 답변도 함께 삭제돼요.")) return;
    try {
      await api(`/questions/${question.id}?user_id=${user.id}`, { method: "DELETE" });
      onDeleted(question.id);
      toast("질문을 삭제했어요");
    } catch {
      toast("질문을 삭제하지 못했어요", { tone: "error" });
    }
  }

  return (
    <li className="px-4 py-4">
      {/* 제품 */}
      <Link
        href={`/post/${question.post_id}`}
        className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground"
      >
        <BagIcon size={13} className="shrink-0" />
        {question.post_author_name ? (
          <>
            <span className="shrink-0 font-medium text-foreground/80">{question.post_author_name}</span>
            {headline && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{headline}</span>
              </>
            )}
          </>
        ) : (
          <span>제품 보기</span>
        )}
      </Link>

      <Link href={`/qna/${question.id}`} className="block hover:underline">
        <h3 className="text-[15px] font-semibold leading-snug">
          <span className="mr-1 text-accent">Q.</span>
          {question.title}
        </h3>
      </Link>
      {question.content && (
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          <MentionText text={question.content} />
        </p>
      )}

      {question.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {question.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              aria-pressed={activeTag === tag}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                activeTag === tag ? "bg-accent text-white" : "bg-accent/10 text-accent hover:bg-accent/20"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <Link
          href={profilePath(question.user_username, question.user_id)}
          className="flex min-w-0 items-center gap-1.5 hover:text-foreground"
        >
          <Avatar name={question.user_name} size={28} />
          <span className="truncate font-medium text-foreground/80">{question.user_name}</span>
          <span className="truncate">@{question.user_username}</span>
        </Link>
        <span aria-hidden="true">·</span>
        <span className="shrink-0">{timeAgo(question.created_at)}</span>
        <Link
          href={`/qna/${question.id}`}
          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-medium ${
            question.answer_count > 0 ? "bg-success/10 text-success" : "bg-subtle"
          }`}
        >
          {question.answer_count > 0 ? `답변 ${question.answer_count}` : "답변 대기"}
        </Link>
        {isMine && (
          <Menu
            trigger={<MoreIcon size={16} />}
            items={[{ label: "삭제", icon: <TrashIcon size={15} />, danger: true, onSelect: handleDelete }]}
          />
        )}
      </div>
    </li>
  );
}
