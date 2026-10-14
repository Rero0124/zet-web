"use client";

import { useRef, useState } from "react";
import { isVideoUrl, resolveMediaUrl } from "@/lib/format";
import { uploadFiles } from "@/lib/upload";
import { ImageIcon, XIcon } from "./icons";
import { toast } from "./ui/toast";

export function MediaUpload({
  urls,
  onChange,
  max = 10,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, max - urls.length);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const newUrls = await uploadFiles(files);
      onChange([...urls, ...newUrls]);
    } catch (err) {
      toast(err instanceof Error ? err.message : "업로드하지 못했어요", { tone: "error" });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pt-1.5">
      {urls.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted transition-colors hover:bg-subtle disabled:opacity-50"
        >
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <ImageIcon size={20} />
          )}
          <span>
            {urls.length}/{max}
          </span>
        </button>
      )}
      {urls.map((url, i) => {
        const fullUrl = resolveMediaUrl(url);
        return (
          <div key={`${url}-${i}`} className="relative shrink-0">
            {isVideoUrl(url) ? (
              <video src={fullUrl} className="h-20 w-20 rounded-xl object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fullUrl} alt="" className="h-20 w-20 rounded-xl border border-border object-cover" />
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="첨부 삭제"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
            >
              <XIcon size={12} strokeWidth={2.6} />
            </button>
          </div>
        );
      })}
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={handleFiles} className="hidden" />
    </div>
  );
}
