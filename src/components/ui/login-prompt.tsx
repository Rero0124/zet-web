"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getAuthUser, type User } from "@/lib/auth";
import { loginPath } from "@/lib/format";
import { XIcon } from "../icons";

let reason: string | null = null;
const listeners = new Set<() => void>();

function set(value: string | null) {
  reason = value;
  for (const l of listeners) l();
}

export function openLoginPrompt(message = "로그인하고 Zet을 더 편하게 이용해보세요") {
  set(message);
}

/**
 * 로그인이 필요한 동작 앞에서 호출. 로그인 상태면 유저를, 아니면 로그인 시트를 띄우고 null 반환
 */
export function requireUser(message?: string): User | null {
  const user = getAuthUser();
  if (!user) openLoginPrompt(message);
  return user;
}

export function LoginPrompt() {
  const pathname = usePathname();
  const message = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => reason,
    () => null,
  );

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message]);

  // 페이지 이동 시 닫기
  useEffect(() => set(null), [pathname]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <button aria-label="닫기" className="absolute inset-0 bg-black/40" onClick={() => set(null)} />
      <div className="animate-sheet-in pb-safe relative w-full max-w-md rounded-t-3xl bg-card p-6 shadow-xl md:rounded-3xl">
        <button
          onClick={() => set(null)}
          aria-label="닫기"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-subtle"
        >
          <XIcon size={18} />
        </button>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border md:hidden" />
        <p className="text-xl font-bold tracking-tight">zet</p>
        <p className="mt-2 text-base font-semibold">{message}</p>
        <p className="mt-1 text-sm text-muted">좋아요·저장·리뷰·팔로우로 나에게 맞는 제품 피드를 만들어보세요.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={loginPath(pathname)}
            className="rounded-xl bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
          >
            로그인
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(pathname)}`}
            className="rounded-xl bg-subtle py-3 text-center text-sm font-semibold hover:bg-border"
          >
            처음이신가요? 회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
