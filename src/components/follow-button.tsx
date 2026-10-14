"use client";

import { useAuthUser } from "@/lib/auth";
import { toggleFollow, useFollowState } from "@/lib/follow-store";

export function FollowButton({
  userId,
  name,
  following,
  followerCount,
  size = "md",
  className = "",
}: {
  userId: string;
  name: string;
  following: boolean;
  followerCount: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const me = useAuthUser();
  const initial = { following, follower_count: followerCount };
  const state = useFollowState(userId, initial);
  if (me?.id === userId) return null;

  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2 text-sm";
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollow(userId, name, state);
      }}
      aria-pressed={state.following}
      className={`shrink-0 rounded-full font-semibold transition-colors ${sizes} ${
        state.following
          ? "border border-border bg-background text-foreground hover:border-danger/50 hover:text-danger"
          : "bg-foreground text-background hover:opacity-85"
      } ${className}`}
    >
      {state.following ? "팔로잉" : "팔로우"}
    </button>
  );
}
