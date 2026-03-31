"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { RichEditor } from "./rich-editor";

interface ContentBlock {
  type: string;
  value: string;
}

const CATEGORIES = ["뷰티", "테크", "식품", "패션", "생활", "건강"];
const AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대 이상"];
const GENDERS = ["남성", "여성"];

export function WritePost() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([{ type: "text", value: "" }]);
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [targetAge, setTargetAge] = useState("");
  const [targetGender, setTargetGender] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "business") setError("기업 회원만 게시글을 작성할 수 있습니다");
    setUser(u);
  }, [router]);

  const hasContent = blocks.some((b) => b.type === "text" && b.value.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || user.role !== "business" || !hasContent) return;
    setError("");
    setLoading(true);

    const tags = tagsInput.split(/[,#\s]+/).map((t) => t.trim()).filter(Boolean);

    try {
      await api("/posts", {
        method: "POST",
        body: JSON.stringify({
          author_id: user.id,
          blocks,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
          target_age: targetAge || null,
          target_gender: targetGender || null,
          target_region: targetRegion || null,
        }),
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 작성 실패");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  if (user.role !== "business") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-muted">
        <p className="text-lg">기업 회원만 게시글을 작성할 수 있습니다</p>
        <p className="mt-1 text-sm">기업 회원으로 가입하면 제품 광고를 게시할 수 있어요</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold mb-6">새 게시글 작성</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Rich editor */}
        <RichEditor onChange={setBlocks} />

        {/* Category */}
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

        {/* Tags */}
        <div>
          <label className="block text-xs text-muted mb-1">태그 (쉼표 또는 # 구분)</label>
          <input
            type="text"
            placeholder="예: 스킨케어, 비타민C, 세럼"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>

        {/* Target demographics */}
        <div>
          <label className="block text-xs text-muted mb-2">타겟 설정 (선택)</label>
          <div className="flex gap-2">
            <select value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none">
              <option value="">나이대</option>
              {AGE_GROUPS.map((ag) => <option key={ag} value={ag}>{ag}</option>)}
            </select>
            <select value={targetGender} onChange={(e) => setTargetGender(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none">
              <option value="">성별</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <input type="text" placeholder="지역" value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !hasContent}
          className="rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "게시 중..." : "게시하기"}
        </button>
      </form>
    </div>
  );
}
