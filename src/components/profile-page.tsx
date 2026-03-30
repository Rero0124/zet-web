"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthUser, setAuthCookie, type User } from "@/lib/auth";
import { PostCard } from "./post-card";
import type { Post } from "@/lib/types";

const GENDERS = ["남성", "여성", "기타"];

export function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"profile" | "posts">("profile");
  const [form, setForm] = useState({ name: "", birth_date: "", gender: "", region: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    setForm({
      name: u.name,
      birth_date: u.birth_date || "",
      gender: u.gender || "",
      region: u.region || "",
    });

    api<{ posts: Post[] }>(`/users/${u.id}/posts`)
      .then((data) => setPosts(data.posts))
      .catch(() => {});
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");

    try {
      const data = await api<{ user: User }>(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name || null,
          birth_date: form.birth_date || null,
          gender: form.gender || null,
          region: form.region || null,
        }),
      });
      setAuthCookie(data.user);
      setUser(data.user);
      setMessage("저장되었습니다");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!user || !confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api(`/posts/${postId}?author_id=${user.id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* */ }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Tabs */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex px-4">
          <button
            onClick={() => setTab("profile")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "profile" ? "border-accent text-accent" : "border-transparent text-muted"
            }`}
          >
            프로필 편집
          </button>
          <button
            onClick={() => setTab("posts")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "posts" ? "border-accent text-accent" : "border-transparent text-muted"
            }`}
          >
            내 게시글 {posts.length > 0 && `(${posts.length})`}
          </button>
        </div>
      </div>

      {tab === "profile" ? (
        <form onSubmit={handleSave} className="px-4 py-6 flex flex-col gap-4">
          {message && (
            <div className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
              {message}
            </div>
          )}

          <div>
            <label className="block text-xs text-muted mb-1">이메일</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-border bg-border/30 px-4 py-3 text-sm text-muted"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">역할</label>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              user.role === "business" ? "bg-accent/10 text-accent" : "bg-border text-muted"
            }`}>
              {user.role === "business" ? "기업 회원" : "일반 회원"}
            </span>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">생년월일</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">성별</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="">선택</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">지역</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </form>
      ) : (
        <div>
          {posts.length === 0 ? (
            <div className="py-20 text-center text-muted">
              <p className="text-lg">작성한 게시글이 없습니다</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="relative">
                <PostCard post={post} />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/post/${post.id}/edit`)}
                    className="rounded-md bg-border px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
