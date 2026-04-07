"use client";

import Link from "next/link";

/**
 * 텍스트 안의 @username을 프로필 링크로 변환하여 렌더링
 */
export function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

  return (
    <>
      {parts.map((part, i) =>
        /^@[a-zA-Z0-9_]+$/.test(part) ? (
          <Link
            key={i}
            href={`/user/by/${part.slice(1)}`}
            className="text-accent font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
