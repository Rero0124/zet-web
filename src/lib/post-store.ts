"use client";

import { useSyncExternalStore } from "react";
import { api } from "./api";
import { toast } from "@/components/ui/toast";
import { requireUser } from "@/components/ui/login-prompt";
import type { Post } from "./types";

/**
 * 좋아요/저장 상태를 게시글 id 단위로 공유하는 클라이언트 저장소.
 * 상세에서 누른 좋아요가 피드로 돌아와도 그대로 보이도록 한다.
 */
interface PostState {
  liked: boolean;
  bookmarked: boolean;
  like_count: number;
  bookmark_count: number;
}

const states = new Map<string, PostState>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function current(post: Post): PostState {
  return (
    states.get(post.id) ?? {
      liked: !!post.liked,
      bookmarked: !!post.bookmarked,
      like_count: post.like_count,
      bookmark_count: post.bookmark_count,
    }
  );
}

export function usePostState(post: Post): PostState {
  const stored = useSyncExternalStore(subscribe, () => states.get(post.id), () => undefined);
  return stored ?? current(post);
}

/** 로그아웃/계정 전환 시 이전 사용자의 상태 제거 */
export function resetPostStates() {
  states.clear();
  emit();
}

export async function toggleLike(post: Post) {
  const user = requireUser("좋아요를 누르려면 로그인이 필요해요");
  if (!user) return;
  const prev = current(post);
  const liked = !prev.liked;
  states.set(post.id, { ...prev, liked, like_count: Math.max(0, prev.like_count + (liked ? 1 : -1)) });
  emit();
  try {
    const res = await api<{ liked: boolean }>(`/posts/${post.id}/like`, {
      method: "POST",
      body: JSON.stringify({ user_id: user.id }),
    });
    if (res.liked !== liked) {
      states.set(post.id, { ...prev, liked: res.liked });
      emit();
    }
  } catch {
    states.set(post.id, prev);
    emit();
    toast("좋아요를 반영하지 못했어요. 잠시 후 다시 시도해주세요", { tone: "error" });
  }
}

export async function toggleBookmark(post: Post) {
  const user = requireUser("마음에 드는 제품을 저장하려면 로그인이 필요해요");
  if (!user) return;
  const prev = current(post);
  const bookmarked = !prev.bookmarked;
  states.set(post.id, {
    ...prev,
    bookmarked,
    bookmark_count: Math.max(0, prev.bookmark_count + (bookmarked ? 1 : -1)),
  });
  emit();
  try {
    const res = await api<{ bookmarked: boolean }>(`/posts/${post.id}/bookmark`, {
      method: "POST",
      body: JSON.stringify({ user_id: user.id }),
    });
    if (res.bookmarked) {
      toast("저장했어요", { action: { label: "저장 목록", href: `/user/${user.username}?tab=saved` } });
    } else {
      toast("저장을 취소했어요");
    }
  } catch {
    states.set(post.id, prev);
    emit();
    toast("저장하지 못했어요. 잠시 후 다시 시도해주세요", { tone: "error" });
  }
}
