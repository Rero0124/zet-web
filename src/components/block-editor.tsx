"use client";

import { useRef, useState } from "react";
import { uploadFiles } from "@/lib/upload";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3002";

export interface ContentBlock {
  type: string;
  value: string;
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  function updateBlock(index: number, value: string) {
    const updated = [...blocks];
    updated[index] = { ...updated[index], value };
    onChange(updated);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function addTextBlock(afterIndex?: number) {
    const newBlock: ContentBlock = { type: "text", value: "" };
    if (afterIndex !== undefined) {
      const updated = [...blocks];
      updated.splice(afterIndex + 1, 0, newBlock);
      onChange(updated);
    } else {
      onChange([...blocks, newBlock]);
    }
  }

  function triggerMediaUpload(afterIndex: number) {
    setInsertIndex(afterIndex);
    fileRef.current?.click();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || insertIndex === null) return;

    setUploading(true);
    try {
      const urls = await uploadFiles(files);
      const newBlocks: ContentBlock[] = urls.map((url) => {
        const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
        return { type: isVideo ? "video" : "image", value: url };
      });
      const updated = [...blocks];
      updated.splice(insertIndex + 1, 0, ...newBlocks);
      onChange(updated);
    } catch { /* */ }
    setUploading(false);
    setInsertIndex(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {blocks.length === 0 && (
        <button
          type="button"
          onClick={() => addTextBlock()}
          className="rounded-lg border-2 border-dashed border-border py-8 text-sm text-muted hover:border-accent hover:text-accent transition-colors"
        >
          텍스트를 추가하세요
        </button>
      )}

      {blocks.map((block, i) => (
        <div key={i} className="group relative">
          {block.type === "text" ? (
            <textarea
              value={block.value}
              onChange={(e) => updateBlock(i, e.target.value)}
              placeholder="텍스트를 입력하세요..."
              rows={Math.max(2, block.value.split("\n").length)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent resize-none"
            />
          ) : (
            <div className="relative">
              {block.type === "video" ? (
                <video
                  src={block.value.startsWith("http") ? block.value : `${API_HOST}${block.value}`}
                  controls
                  className="w-full rounded-lg max-h-60 object-cover"
                />
              ) : (
                <img
                  src={block.value.startsWith("http") ? block.value : `${API_HOST}${block.value}`}
                  alt=""
                  className="w-full rounded-lg max-h-60 object-cover"
                />
              )}
            </div>
          )}

          {/* Block controls */}
          <div className="absolute -right-1 top-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => removeBlock(i)}
              className="h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
            >
              x
            </button>
          </div>

          {/* Insert buttons between blocks */}
          <div className="flex items-center justify-center gap-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => addTextBlock(i)}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              + 텍스트
            </button>
            <button
              type="button"
              onClick={() => triggerMediaUpload(i)}
              disabled={uploading}
              className="text-xs text-muted hover:text-accent transition-colors disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "+ 사진/영상"}
            </button>
          </div>
        </div>
      ))}

      {/* Bottom add buttons */}
      {blocks.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => addTextBlock()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-border transition-colors"
          >
            + 텍스트
          </button>
          <button
            type="button"
            onClick={() => triggerMediaUpload(blocks.length - 1)}
            disabled={uploading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-border transition-colors disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "+ 사진/영상"}
          </button>
        </div>
      )}
    </div>
  );
}
