"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { AGE_GROUPS, CATEGORIES, CTA_LABELS, DEFAULT_CTA_LABEL, GENDERS, REGIONS } from "@/lib/constants";
import { invalidateFeed } from "@/lib/feed-cache";
import type { ContentBlock, Post } from "@/lib/types";
import { ChevronLeftIcon, XIcon } from "./icons";
import { PageColumn } from "./page-column";
import { PostCard } from "./post-card";
import { RichEditor } from "./rich-editor";
import { toast } from "./ui/toast";

const MAX_TAGS = 10;
const URL_RE = /^https?:\/\/\S+$/i;

/** 광고 작성/수정 공용 폼 */
export function PostForm({ mode, initial }: { mode: "create" | "edit"; initial?: Post }) {
  const router = useRouter();
  const user = useAuthUser();

  const [blocks, setBlocks] = useState<ContentBlock[]>(() =>
    initial
      ? initial.blocks && initial.blocks.length > 0
        ? initial.blocks
        : [{ type: "text", value: initial.content }]
      : [{ type: "text", value: "" }],
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [ctaLabel, setCtaLabel] = useState(initial?.cta_label || DEFAULT_CTA_LABEL);
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? "");
  const [targetAge, setTargetAge] = useState(initial?.target_age ?? "");
  const [targetGender, setTargetGender] = useState(initial?.target_gender ?? "");
  const [targetRegion, setTargetRegion] = useState(initial?.target_region ?? "");
  const [createdAt] = useState(() => initial?.created_at ?? new Date().toISOString());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const hasContent = blocks.some((b) => b.type === "text" && b.value.trim());
  const trimmedUrl = linkUrl.trim();
  const urlInvalid = trimmedUrl !== "" && !URL_RE.test(trimmedUrl);
  const canSubmit = hasContent && !!category && !urlInvalid && !saving;

  function addTag(raw: string) {
    const tag = raw.trim().replace(/^#+/, "").replace(/[,\s]+/g, "");
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags([...tags, tag]);
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Enter") {
      e.preventDefault();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setError("");
    setSaving(true);

    // 입력 중이던 태그도 반영
    const finalTags = tagInput.trim() && tags.length < MAX_TAGS
      ? Array.from(new Set([...tags, tagInput.trim().replace(/^#+/, "")])).filter(Boolean)
      : tags;

    const payload = {
      author_id: user.id,
      blocks,
      category,
      tags: finalTags,
      price: price ? Number(price) : null,
      link_url: trimmedUrl || null,
      cta_label: trimmedUrl ? ctaLabel : null,
      target_age: targetAge || null,
      target_gender: targetGender || null,
      target_region: targetRegion || null,
    };

    try {
      const data =
        mode === "create"
          ? await api<{ post: Post }>("/posts", { method: "POST", body: JSON.stringify(payload) })
          : await api<{ post: Post }>(`/posts/${initial!.id}`, { method: "PUT", body: JSON.stringify(payload) });
      invalidateFeed();
      toast(mode === "create" ? "광고를 게시했어요" : "수정했어요");
      router.push(`/post/${data.post?.id ?? initial?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했어요");
      setSaving(false);
    }
  }

  const text = blocks.filter((b) => b.type === "text").map((b) => b.value).join("\n");
  const previewPost: Post | null = user
    ? {
        id: "preview",
        author_id: user.id,
        content: text,
        blocks,
        category: category || null,
        tags,
        media_urls: [],
        link_url: trimmedUrl && !urlInvalid ? trimmedUrl : null,
        cta_label: trimmedUrl ? ctaLabel : null,
        price: price ? Number(price) : null,
        target_age: targetAge || null,
        target_gender: targetGender || null,
        target_region: targetRegion || null,
        impressions: 0,
        clicks: 0,
        like_count: 0,
        review_count: 0,
        bookmark_count: 0,
        score: 0,
        created_at: createdAt,
        author_name: user.name,
        author_username: user.username,
        author_role: "business",
        author_avatar_url: user.avatar_url ?? null,
        avg_rating: null,
        question_count: 0,
        liked: false,
        bookmarked: false,
      }
    : null;

  const submitLabel = saving ? "저장 중..." : mode === "create" ? "게시하기" : "저장";

  return (
    <PageColumn>
      <form onSubmit={handleSubmit}>
        {/* 상단 바 */}
        <div className="sticky top-14 z-30 flex h-12 items-center gap-1 border-b border-border bg-background/90 px-2 backdrop-blur-md">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="rounded-full p-1.5 hover:bg-subtle"
          >
            <ChevronLeftIcon size={24} />
          </button>
          <h1 className="text-[15px] font-semibold">{mode === "create" ? "새 광고 만들기" : "광고 수정"}</h1>
          <button
            type="submit"
            disabled={!canSubmit}
            className="ml-auto rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </div>
        )}

        <Section
          title="콘텐츠"
          required
          description="첫 줄은 피드에서 굵은 제목으로 보여요. 사진·영상은 끌어다 놓거나 붙여넣을 수 있어요."
        >
          <RichEditor initialBlocks={blocks} onChange={setBlocks} />
        </Section>

        <Section title="제품 정보" description="카테고리를 고르면 해당 카테고리 피드와 추천에 노출돼요.">
          <Label required>카테고리</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                <span className="mr-1">{c.emoji}</span>
                {c.value}
              </Chip>
            ))}
          </div>

          <Label className="mt-5">가격 (선택)</Label>
          <div className="relative">
            <input
              inputMode="numeric"
              value={price ? Number(price).toLocaleString("ko-KR") : ""}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12))}
              placeholder="예: 29,900"
              className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm outline-none focus:border-accent"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">원</span>
          </div>

          <Label className="mt-5">
            태그 <span className="font-normal text-muted">({tags.length}/{MAX_TAGS})</span>
          </Label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-accent">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
              >
                #{tag}
                <button
                  type="button"
                  aria-label={`${tag} 태그 삭제`}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="hover:text-foreground"
                >
                  <XIcon size={12} strokeWidth={2.4} />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => {
                const v = e.target.value;
                if (v.endsWith(",")) {
                  addTag(v.slice(0, -1));
                  setTagInput("");
                } else {
                  setTagInput(v);
                }
              }}
              onKeyDown={onTagKeyDown}
              onBlur={() => {
                if (tagInput.trim()) {
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              disabled={tags.length >= MAX_TAGS}
              placeholder={tags.length === 0 ? "스킨케어, 비타민C (Enter로 추가)" : ""}
              className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed"
            />
          </div>
          <Helper>태그는 검색과 트렌드 키워드 집계에 쓰여요.</Helper>
        </Section>

        <Section title="구매 링크" description="사용자가 광고에서 바로 이동할 판매 페이지예요.">
          <Label>버튼 문구</Label>
          <div className="flex flex-wrap gap-2">
            {CTA_LABELS.map((label) => (
              <Chip key={label} active={ctaLabel === label} onClick={() => setCtaLabel(label)}>
                {label}
              </Chip>
            ))}
          </div>
          <Label className="mt-5">링크 URL (선택)</Label>
          <input
            type="url"
            inputMode="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
            aria-invalid={urlInvalid}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ${
              urlInvalid ? "border-danger focus:border-danger" : "border-border focus:border-accent"
            }`}
          />
          {urlInvalid ? (
            <p className="mt-1.5 text-xs text-danger">링크는 http:// 또는 https://로 시작해야 해요</p>
          ) : (
            <Helper>
              {trimmedUrl
                ? `광고에 '${ctaLabel}' 버튼이 표시되고, 클릭 수가 성과에 집계돼요.`
                : "링크가 없으면 상세 보기 버튼이 표시돼요."}
            </Helper>
          )}
        </Section>

        <Section
          title="타겟팅"
          description="선택한 조건과 일치하는 사용자의 추천 피드에 우선 노출돼요. 다른 사용자에게도 노출은 돼요."
        >
          <Label>나이대</Label>
          <ChipGroup options={AGE_GROUPS} value={targetAge} onChange={setTargetAge} />
          <Label className="mt-4">성별</Label>
          <ChipGroup options={GENDERS} value={targetGender} onChange={setTargetGender} />
          <Label className="mt-4">지역</Label>
          <ChipGroup options={REGIONS} value={targetRegion} onChange={setTargetRegion} />
        </Section>

        {previewPost && (
          <Section title="미리보기" description="피드에서 이렇게 보여요.">
            <div className="pointer-events-none -mx-4 select-none border-y border-border" aria-hidden="true">
              <PostCard post={previewPost} />
            </div>
          </Section>
        )}

        <div className="px-4 py-6">
          {!canSubmit && !saving && (
            <p className="mb-3 text-center text-xs text-muted">
              {!hasContent ? "내용을 입력해주세요" : !category ? "카테고리를 선택해주세요" : urlInvalid ? "링크 형식을 확인해주세요" : ""}
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </PageColumn>
  );
}

function Section({
  title,
  description,
  required,
  children,
}: {
  title: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border px-4 py-5">
      <h2 className="text-[15px] font-bold">
        {title}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </h2>
      {description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Label({ children, required, className = "" }: { children: ReactNode; required?: boolean; className?: string }) {
  return (
    <p className={`mb-2 text-sm font-medium ${className}`}>
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </p>
  );
}

function Helper({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted">{children}</p>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-foreground text-background" : "bg-subtle text-foreground/80 hover:bg-border"
      }`}
    >
      {children}
    </button>
  );
}

/** "전체"(빈 값) + 단일 선택 칩 */
function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={value === ""} onClick={() => onChange("")}>
        전체
      </Chip>
      {options.map((o) => (
        <Chip key={o} active={value === o} onClick={() => onChange(value === o ? "" : o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}
