"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { Video } from "./tiptap-video";
import mentionSuggestion from "./tiptap-mention-suggestion";
import { uploadFiles } from "@/lib/upload";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3002";

interface ContentBlock {
  type: string;
  value: string;
}

export function RichEditor({
  initialBlocks,
  onChange,
}: {
  initialBlocks?: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpdate = useCallback(
    (html: string) => onChange(htmlToBlocks(html)),
    [onChange],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "w-full rounded-lg max-h-[500px] object-cover my-3" },
      }),
      Video,
      Placeholder.configure({
        placeholder: "제품을 소개해주세요. 사진이나 영상도 추가할 수 있어요...",
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Mention.configure({
        HTMLAttributes: {
          class: "inline-block rounded bg-accent/15 px-1 text-accent font-medium",
        },
        suggestion: mentionSuggestion,
      }),
    ],
    content: blocksToHtml(initialBlocks || []),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[300px] px-4 py-3 text-[15px] leading-relaxed",
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          handleFileInsert(Array.from(files));
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []);
        if (files.length > 0) {
          event.preventDefault();
          handleFileInsert(files);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => handleUpdate(e.getHTML()),
  });

  async function handleFileInsert(files: File[]) {
    if (!editor) return;
    const mediaFiles = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (mediaFiles.length === 0) return;
    try {
      const urls = await uploadFiles(mediaFiles);
      for (const url of urls) {
        const fullUrl = url.startsWith("http") ? url : `${API_HOST}${url}`;
        if (/\.(mp4|mov|webm|avi)$/i.test(url)) {
          editor.chain().focus().insertContent({ type: "video", attrs: { src: fullUrl } }).run();
        } else {
          editor.chain().focus().setImage({ src: fullUrl }).run();
        }
      }
    } catch { /* */ }
  }

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) await handleFileInsert(files);
    if (fileRef.current) fileRef.current.value = "";
  }

  function insertLink() {
    if (!editor) return;
    const url = window.prompt("URL을 입력하세요");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden focus-within:border-accent transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5 bg-card/50">
        {/* Text style */}
        <select
          value={editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else if (v === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (v === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className="rounded border border-border bg-background px-2 py-1 text-xs outline-none mr-1"
        >
          <option value="p">본문</option>
          <option value="h2">제목</option>
          <option value="h3">소제목</option>
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Inline formatting */}
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게">
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임">
          <em>I</em>
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄">
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선">
          <span className="line-through">S</span>
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Quote & Code */}
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용">
          &ldquo;
        </ToolBtn>
        <ToolBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드">
          {"</>"}
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Link & Media */}
        <ToolBtn active={editor.isActive("link")} onClick={insertLink} title="링크">
          🔗
        </ToolBtn>
        <ToolBtn active={false} onClick={() => fileRef.current?.click()} title="사진/영상">
          🖼
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="왼쪽">
          ≡
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="가운데">
          ≡
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists */}
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="목록">
          •≡
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록">
          1≡
        </ToolBtn>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={onFileSelect} className="hidden" />
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center h-7 w-7 rounded text-xs transition-colors ${
        active ? "bg-accent text-white" : "text-muted hover:bg-border"
      }`}
    >
      {children}
    </button>
  );
}

function blocksToHtml(blocks: ContentBlock[]): string {
  if (blocks.length === 0) return "";
  return blocks
    .map((b) => {
      switch (b.type) {
        case "text":
          return b.value
            .split("\n")
            .map((line) => {
              // @username → mention 노드로 변환
              const escaped = line
                ? line.replace(/@([a-zA-Z0-9_]+)/g, '<span data-type="mention" data-id="" data-label="$1" class="inline-block rounded bg-accent/15 px-1 text-accent font-medium">@$1</span>')
                : "<br>";
              return `<p>${escaped}</p>`;
            })
            .join("");
        case "image": {
          const src = b.value.startsWith("http") ? b.value : `${API_HOST}${b.value}`;
          return `<img src="${src}" />`;
        }
        case "video": {
          const src = b.value.startsWith("http") ? b.value : `${API_HOST}${b.value}`;
          return `<video src="${src}" controls></video>`;
        }
        default:
          return "";
      }
    })
    .join("");
}

function htmlToBlocks(html: string): ContentBlock[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const blocks: ContentBlock[] = [];
  let textBuffer = "";

  for (const node of Array.from(div.childNodes)) {
    if (node instanceof HTMLImageElement) {
      if (textBuffer.trim()) {
        blocks.push({ type: "text", value: textBuffer.trim() });
        textBuffer = "";
      }
      blocks.push({ type: "image", value: node.src });
    } else if (node instanceof HTMLVideoElement) {
      if (textBuffer.trim()) {
        blocks.push({ type: "text", value: textBuffer.trim() });
        textBuffer = "";
      }
      blocks.push({ type: "video", value: node.src });
    } else {
      const el = node as HTMLElement;
      // 멘션 노드 → @username 으로 변환
      let text = "";
      if (el.nodeType === Node.ELEMENT_NODE) {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("[data-type='mention']").forEach((m) => {
          const label = m.getAttribute("data-label") || m.textContent?.replace("@", "") || "";
          m.replaceWith(`@${label}`);
        });
        text = clone.textContent || "";
      } else {
        text = el.textContent || "";
      }
      if (text || textBuffer) {
        textBuffer += (textBuffer ? "\n" : "") + text;
      }
    }
  }

  if (textBuffer.trim()) {
    blocks.push({ type: "text", value: textBuffer.trim() });
  }

  return blocks;
}
