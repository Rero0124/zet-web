"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { RichEditor } from "./rich-editor";
import type { Post, ContentBlock } from "@/lib/types";

const CATEGORIES = ["뷰티", "테크", "식품", "패션", "생활", "건강"];

export function EditPost({ id }: { id: string }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const user = getAuthUser();
    if (!user) { router.push("/login"); return; }

    api<{ post: Post }>(`/posts/${id}`)
      .then(({ post }) => {
        if (post.author_id !== user.id) {
          setError("본인의 게시글만 수정할 수 있습니다");
          return;
        }
        // Load blocks, fallback to content as single text block
        if (post.blocks && post.blocks.length > 0) {
          setBlocks(post.blocks as ContentBlock[]);
        } else {
          setBlocks([{ type: "text", value: post.content }]);
        }
        setCategory(post.category || "");
        setTagsInput(post.tags.join(", "));
      })
      .catch(() => setError("게시글을 찾을 수 없습니다"))
      .finally(() => setFetching(false));
  }, [id, router]);

  const hasContent = blocks.some((b) => b.type === "text" && b.value.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = getAuthUser();
    if (!user || !hasContent) return;
    setError("");
    setLoading(true);

    const tags = tagsInput.split(/[,#\s]+/).map((t) => t.trim()).filter(Boolean);

    try {
      await api(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          author_id: user.id,
          blocks,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
        }),
      });
      router.push(`/post/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return <div className="py-20 text-center text-muted">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold mb-6">게시글 수정</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <RichEditor initialBlocks={blocks} onChange={setBlocks} />

        <div>
          <label className="block text-xs text-muted mb-1">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? "" : cat)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  category === cat ? "bg-accent text-white" : "border border-border text-muted hover:bg-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">태그</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-muted hover:bg-border transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading || !hasContent}
            className="flex-1 rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
