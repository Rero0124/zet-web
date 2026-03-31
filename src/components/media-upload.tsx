"use client";

import { useRef, useState } from "react";
import { uploadFiles } from "@/lib/upload";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3002";

export function MediaUpload({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const newUrls = await uploadFiles(files);
      onChange([...urls, ...newUrls]);
    } catch { /* */ }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div>
      {/* Preview */}
      {urls.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {urls.map((url, i) => {
            const fullUrl = url.startsWith("http") ? url : `${API_HOST}${url}`;
            const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
            return (
              <div key={i} className="relative group">
                {isVideo ? (
                  <video src={fullUrl} className="h-20 w-20 rounded-lg object-cover" muted />
                ) : (
                  <img src={fullUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-border transition-colors disabled:opacity-50"
      >
        {uploading ? "업로드 중..." : "사진/동영상 추가"}
      </button>
    </div>
  );
}
