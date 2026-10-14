"use client";

import { isVideoUrl, resolveMediaUrl } from "@/lib/format";

/** 리뷰 첨부 미디어 — 썸네일 줄, 누르면 원본 새 탭 */
export function MediaGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {urls.map((url, i) => {
        const fullUrl = resolveMediaUrl(url);
        return isVideoUrl(url) ? (
          <video
            key={i}
            src={fullUrl}
            controls
            playsInline
            preload="metadata"
            className="h-28 w-28 shrink-0 rounded-xl bg-black object-cover"
          />
        ) : (
          <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullUrl} alt="" loading="lazy" className="h-28 w-28 rounded-xl border border-border object-cover" />
          </a>
        );
      })}
    </div>
  );
}
