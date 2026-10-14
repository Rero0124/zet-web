"use client";

import { useRef, useState } from "react";
import type { MediaItem } from "@/lib/format";

/** 인스타그램식 스와이프 캐러셀. 한 장이면 그대로 표시 */
export function MediaCarousel({ items, rounded = true }: { items: MediaItem[]; rounded?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const radius = rounded ? "rounded-2xl" : "";

  if (items.length === 0) return null;

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(i: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className={`relative overflow-hidden border border-border bg-subtle ${radius}`}>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {items.map((m, i) => (
          <div key={`${m.url}-${i}`} className="w-full shrink-0 snap-center">
            {m.type === "video" ? (
              <video
                src={m.url}
                controls
                playsInline
                preload="metadata"
                className="aspect-[4/5] max-h-[560px] w-full bg-black object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.url}
                alt=""
                loading="lazy"
                className={`w-full object-cover ${items.length > 1 ? "aspect-[4/5] max-h-[560px]" : "max-h-[560px]"}`}
              />
            )}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1}/{items.length}
          </span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번째 미디어`}
                onClick={(e) => {
                  e.preventDefault();
                  go(i);
                }}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
