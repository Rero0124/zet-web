"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { MentionText } from "./mention-text";
import { api } from "@/lib/api";
import type { Post, Question } from "@/lib/types";

interface UserData {
  id: string;
  username: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  region: string | null;
  role: string;
  points: number;
  created_at: string;
}

function getAgeGroup(birthDate: string): string {
  const birth = new Date(birthDate);
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 20) return "10대";
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  if (age < 60) return "50대";
  return "60대 이상";
}

function genderLabel(g: string | null): string | null {
  if (g === "male") return "남성";
  if (g === "female") return "여성";
  return g;
}

type Tab = "posts" | "qna";

export function UserProfile({ user, initialPosts }: { user: UserData; initialPosts: Post[] }) {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts] = useState(initialPosts);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQna, setLoadingQna] = useState(false);
  const [qnaLoaded, setQnaLoaded] = useState(false);

  useEffect(() => {
    if (tab === "qna" && !qnaLoaded) {
      setLoadingQna(true);
      api<{ questions: Question[] }>(`/questions?user_id=${user.id}&limit=50`)
        .then((data) => setQuestions(data.questions))
        .catch(() => setQuestions([]))
        .finally(() => {
          setLoadingQna(false);
          setQnaLoaded(true);
        });
    }
  }, [tab, qnaLoaded, user.id]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* 프로필 헤더 */}
      <div className="px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">@{user.username}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              user.role === "business"
                ? "bg-accent/10 text-accent"
                : "bg-border text-muted"
            }`}
          >
            {user.role === "business" ? "기업 회원" : "일반 회원"}
          </span>
        </div>

        {/* 상세 정보 */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {user.birth_date && (
            <span>{getAgeGroup(user.birth_date)}</span>
          )}
          {user.gender && (
            <span>{genderLabel(user.gender)}</span>
          )}
          {user.region && <span>{user.region}</span>}
          <span>
            가입일 {new Date(user.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("posts")}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            tab === "posts"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          게시글 {posts.length > 0 && `(${posts.length})`}
        </button>
        <button
          onClick={() => setTab("qna")}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            tab === "qna"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Q&A {qnaLoaded && questions.length > 0 && `(${questions.length})`}
        </button>
      </div>

      {/* 게시글 탭 */}
      {tab === "posts" && (
        posts.length === 0 ? (
          <div className="py-16 text-center text-muted">
            <p>작성한 게시글이 없습니다</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      )}

      {/* Q&A 탭 */}
      {tab === "qna" && (
        loadingQna ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center text-muted">
            <p>작성한 Q&A가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {questions.map((q) => (
              <Link key={q.id} href={`/qna/${q.id}`} className="block px-4 py-4 hover:bg-border/30 transition-colors">
                <h3 className="text-sm font-semibold">{q.title}</h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  <MentionText text={q.content} />
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                  {q.tags?.map((tag) => (
                    <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-accent font-medium">
                      #{tag}
                    </span>
                  ))}
                  <span>답변 {q.answer_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
