import type { Post } from "./types";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3002";

export function resolveMediaUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_HOST}${url}`;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  if (date.getFullYear() === new Date().getFullYear()) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
  return date.toLocaleDateString("ko-KR");
}

function trimDecimal(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** 1,234 → 1.2천, 12,345 → 1.2만 */
export function formatCount(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 100_000_000) return `${trimDecimal(v / 100_000_000)}억`;
  if (v >= 10_000) return `${trimDecimal(v / 10_000)}만`;
  if (v >= 1_000) return `${trimDecimal(v / 1_000)}천`;
  return String(v);
}

export function formatPrice(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatRating(r: number | null | undefined): string {
  return r == null ? "-" : r.toFixed(1);
}

export function ageGroupFromBirth(birthDate: string): string {
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 20) return "10대";
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  return "50대 이상";
}

/** 블록/본문에서 텍스트만 추출 */
export function postText(post: Pick<Post, "blocks" | "content">): string {
  if (post.blocks && post.blocks.length > 0) {
    return post.blocks
      .filter((b) => b.type === "text")
      .map((b) => b.value)
      .join("\n");
  }
  return post.content || "";
}

/** 첫 줄을 헤드라인으로, 나머지를 본문으로 분리 */
export function splitHeadline(text: string): { headline: string; body: string } {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => l.trim());
  if (idx === -1) return { headline: "", body: "" };
  return {
    headline: lines[idx].trim(),
    body: lines.slice(idx + 1).join("\n").trim(),
  };
}

export function postHeadline(post: Pick<Post, "blocks" | "content">): string {
  return splitHeadline(postText(post)).headline;
}

export interface MediaItem {
  type: "image" | "video";
  url: string;
}

/** 본문 블록의 이미지/영상 + 첨부 미디어 */
export function postMedia(post: Pick<Post, "blocks" | "media_urls">): MediaItem[] {
  const items: MediaItem[] = [];
  for (const b of post.blocks || []) {
    if (b.type === "image" || b.type === "video") {
      items.push({ type: b.type, url: resolveMediaUrl(b.value) });
    }
  }
  for (const url of post.media_urls || []) {
    items.push({ type: isVideoUrl(url) ? "video" : "image", url: resolveMediaUrl(url) });
  }
  return items;
}

export function postPath(post: Pick<Post, "id">): string {
  return `/post/${post.id}`;
}

export function profilePath(username: string | null | undefined, id?: string | null): string {
  return `/user/${encodeURIComponent(username || id || "")}`;
}

export function loginPath(next?: string): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

/** 외부 이동을 막기 위해 같은 사이트 경로만 허용 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
