"use client";

import { useSyncExternalStore } from "react";
import { api } from "./api";
import { toast } from "@/components/ui/toast";
import { requireUser } from "@/components/ui/login-prompt";

interface FollowState {
  following: boolean;
  follower_count: number;
}

const states = new Map<string, FollowState>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function useFollowState(userId: string, initial: FollowState): FollowState {
  const stored = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => states.get(userId),
    () => undefined,
  );
  return stored ?? initial;
}

export async function toggleFollow(userId: string, name: string, initial: FollowState) {
  const user = requireUser(`${name}님을 팔로우하려면 로그인이 필요해요`);
  if (!user) return;
  if (user.id === userId) return;
  const prev = states.get(userId) ?? initial;
  const following = !prev.following;
  states.set(userId, { following, follower_count: Math.max(0, prev.follower_count + (following ? 1 : -1)) });
  emit();
  try {
    const res = await api<{ following: boolean; follower_count: number }>(`/users/${userId}/follow`, {
      method: "POST",
      body: JSON.stringify({ user_id: user.id }),
    });
    states.set(userId, res);
    emit();
    if (res.following) toast(`${name}님을 팔로우했어요. 새 소식이 피드에 먼저 보여요`);
  } catch {
    states.set(userId, prev);
    emit();
    toast("팔로우하지 못했어요. 잠시 후 다시 시도해주세요", { tone: "error" });
  }
}

export function resetFollowStates() {
  states.clear();
  emit();
}
