"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface UserResult {
  id: string;
  username: string;
  name: string;
}

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

/**
 * 인스타 스타일 @멘션 에디터.
 * - contenteditable 기반
 * - @입력 → 자동완성 → Enter로 확정
 * - 확정된 멘션은 atomic span (한 글자라도 지우면 통째 삭제)
 */
export function MentionEditor({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  multiline = false,
}: MentionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isComposing = useRef(false);
  const lastValue = useRef(value);

  // 외부 value 변경 시 에디터 동기화 (초기 렌더링 또는 외부 리셋)
  useEffect(() => {
    if (!editorRef.current) return;
    if (lastValue.current === value) return;
    lastValue.current = value;
    // 외부에서 빈 문자열로 리셋된 경우에만 에디터 내용 초기화
    if (value === "") {
      editorRef.current.innerHTML = "";
    }
  }, [value]);

  // DOM → plain text (멘션 span은 @username으로 변환)
  function extractText(el: HTMLElement): string {
    let text = "";
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      } else if (node instanceof HTMLElement) {
        if (node.dataset.mention) {
          text += `@${node.dataset.mention}`;
        } else if (node.tagName === "BR") {
          text += "\n";
        } else {
          text += extractText(node);
        }
      }
    }
    return text;
  }

  function emitChange() {
    if (!editorRef.current) return;
    const text = extractText(editorRef.current);
    lastValue.current = text;
    onChange(text);
  }

  // 현재 커서 앞의 @쿼리 추출
  function getMentionContext(): { query: string; range: Range } | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return null;

    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const text = node.textContent || "";
    const offset = range.startOffset;
    const before = text.slice(0, offset);
    const match = before.match(/@([a-zA-Z0-9_]*)$/);
    if (!match) return null;

    const atIdx = before.lastIndexOf("@");
    const mentionRange = document.createRange();
    mentionRange.setStart(node, atIdx);
    mentionRange.setEnd(node, offset);

    return { query: match[1], range: mentionRange };
  }

  function searchUsers(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      api<{ users: UserResult[] }>(`/users/search?q=${encodeURIComponent(query)}&limit=5`)
        .then((data) => {
          setSuggestions(data.users);
          setShowSuggestions(data.users.length > 0);
          setSelectedIdx(0);
        })
        .catch(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        });
    }, 150);
  }

  function insertMention(username: string) {
    const ctx = getMentionContext();
    if (!ctx) {
      setShowSuggestions(false);
      return;
    }

    // @쿼리 범위를 멘션 span으로 교체
    ctx.range.deleteContents();
    const span = createMentionSpan(username);
    ctx.range.insertNode(span);

    // span 뒤에 공백 삽입 후 커서 이동
    const space = document.createTextNode("\u00A0");
    span.after(space);
    const sel = window.getSelection();
    if (sel) {
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    setShowSuggestions(false);
    setSuggestions([]);
    emitChange();
  }

  function createMentionSpan(username: string): HTMLSpanElement {
    const span = document.createElement("span");
    span.contentEditable = "false";
    span.dataset.mention = username;
    span.className = "inline-block rounded bg-accent/15 px-1 text-accent font-medium select-all";
    span.textContent = `@${username}`;
    return span;
  }

  function handleInput() {
    if (isComposing.current) return;
    const ctx = getMentionContext();
    if (ctx) {
      searchUsers(ctx.query);
    } else {
      setShowSuggestions(false);
    }
    emitChange();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" && suggestions.length > 0) {
        e.preventDefault();
        insertMention(suggestions[selectedIdx].username);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // 한 줄 모드에서 Enter → submit (가장 가까운 form 또는 onSubmit 콜백)
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      if (onSubmit) {
        onSubmit();
      } else {
        editorRef.current?.closest("form")?.requestSubmit();
      }
      return;
    }

    // Backspace로 멘션 span 통째 삭제
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) return;

      const node = range.startContainer;
      // 커서가 텍스트 노드 맨 앞이고 바로 앞이 멘션 span인 경우
      if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
        const prev = node.previousSibling;
        if (prev instanceof HTMLElement && prev.dataset.mention) {
          e.preventDefault();
          prev.remove();
          emitChange();
          return;
        }
      }
      // 커서가 element 내부에 있고 앞 형제가 멘션인 경우
      if (node.nodeType === Node.ELEMENT_NODE) {
        const offset = range.startOffset;
        const child = node.childNodes[offset - 1];
        if (child instanceof HTMLElement && child.dataset.mention) {
          e.preventDefault();
          child.remove();
          emitChange();
          return;
        }
      }
    }
  }

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // placeholder 처리
  const [isEmpty, setIsEmpty] = useState(!value);
  useEffect(() => {
    setIsEmpty(!value);
  }, [value]);

  function handleFocus() {
    setIsEmpty(false);
  }

  function handleBlur() {
    if (!editorRef.current) return;
    const text = extractText(editorRef.current);
    setIsEmpty(!text);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {isEmpty && placeholder && (
          <div
            className="pointer-events-none absolute inset-0 px-4 py-2.5 text-sm text-muted/60"
            aria-hidden
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => {
            isComposing.current = false;
            handleInput();
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={className}
          style={{
            minHeight: multiline ? "120px" : undefined,
            whiteSpace: multiline ? "pre-wrap" : "nowrap",
            overflowX: multiline ? undefined : "hidden",
            overflowY: multiline ? "auto" : "hidden",
          }}
        />
      </div>
      {showSuggestions && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
          {suggestions.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // blur 방지
                insertMention(user.username);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                idx === selectedIdx ? "bg-accent/10" : "hover:bg-border/50"
              }`}
            >
              <span className="font-medium text-accent">@{user.username}</span>
              <span className="text-muted">{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
