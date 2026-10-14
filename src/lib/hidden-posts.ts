"use client";

import { useSyncExternalStore } from "react";

/** "이 광고 숨기기" — 브라우저에만 저장되는 숨김 목록 */
const KEY = "zet:hidden-posts";
let hidden: Set<string> | null = null;
const listeners = new Set<() => void>();

function load(): Set<string> {
  if (hidden) return hidden;
  try {
    hidden = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    hidden = new Set();
  }
  return hidden;
}

function save(next: Set<string>) {
  hidden = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next].slice(-500)));
  } catch {
    // 저장 불가 환경에서는 세션 동안만 유지
  }
  for (const l of listeners) l();
}

const EMPTY = new Set<string>();

export function useHiddenPosts(): Set<string> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => EMPTY,
  );
}

export function hidePost(id: string) {
  save(new Set(load()).add(id));
}

export function unhidePost(id: string) {
  const next = new Set(load());
  next.delete(id);
  save(next);
}
