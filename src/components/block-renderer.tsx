"use client";

import { MentionText } from "./mention-text";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3002";

interface ContentBlock {
  type: string;
  value: string;
}

export function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        const fullUrl = block.value.startsWith("http") ? block.value : `${API_HOST}${block.value}`;
        switch (block.type) {
          case "text":
            return (
              <p key={i} className="text-[15px] leading-relaxed whitespace-pre-wrap">
                <MentionText text={block.value} />
              </p>
            );
          case "image":
            return (
              <img
                key={i}
                src={fullUrl}
                alt=""
                className="w-full rounded-lg max-h-[500px] object-cover"
              />
            );
          case "video":
            return (
              <video
                key={i}
                src={fullUrl}
                controls
                className="w-full rounded-lg max-h-[500px]"
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
