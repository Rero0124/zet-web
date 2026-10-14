"use client";

import Link from "next/link";
import { trackClick, trackCta } from "@/lib/tracker";
import { DEFAULT_CTA_LABEL } from "@/lib/constants";
import { postPath } from "@/lib/format";
import { ChevronRightIcon, ExternalLinkIcon } from "./icons";
import type { Post } from "@/lib/types";

/**
 * 광고 CTA. 구매 링크가 있으면 외부로, 없으면 상세 페이지로 이동
 */
export function CtaButton({
  post,
  size = "md",
  className = "",
}: {
  post: Pick<Post, "id" | "link_url" | "cta_label">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "px-3.5 py-2 text-[13px]",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3.5 text-[15px]",
  };
  const base = `inline-flex shrink-0 items-center justify-center gap-1 rounded-xl font-semibold transition-colors ${sizes[size]} ${className}`;

  if (post.link_url) {
    return (
      <a
        href={post.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={(e) => {
          e.stopPropagation();
          trackCta(post.id);
        }}
        className={`${base} bg-accent text-white hover:bg-accent-hover`}
      >
        {post.cta_label || DEFAULT_CTA_LABEL}
        <ExternalLinkIcon size={size === "sm" ? 13 : 15} strokeWidth={2.2} />
      </a>
    );
  }

  return (
    <Link
      href={postPath(post)}
      onClick={() => trackClick(post.id)}
      className={`${base} bg-foreground text-background hover:opacity-85`}
    >
      자세히 보기
      <ChevronRightIcon size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
    </Link>
  );
}
