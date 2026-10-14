import { useSyncExternalStore } from "react";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  region: string | null;
  role: string;
  points: number;
  bio?: string | null;
  avatar_url?: string | null;
}

const AUTH_EVENT = "zet:auth";

export function setAuthCookie(user: User) {
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `zet_user=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthCookie() {
  document.cookie = "zet_user=; path=/; max-age=0";
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// useSyncExternalStore는 같은 값이면 같은 참조를 돌려줘야 하므로 쿠키 원문 기준으로 캐시
let cachedRaw: string | null | undefined;
let cachedUser: User | null = null;

export function getAuthUser(): User | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )zet_user=([^;]*)/);
  const raw = match ? match[1] : null;
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? JSON.parse(decodeURIComponent(raw)) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function subscribe(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("focus", callback);
  };
}

/** 로그인 상태를 구독하는 훅. 서버 렌더링 시에는 null */
export function useAuthUser(): User | null {
  return useSyncExternalStore(subscribe, getAuthUser, () => null);
}

export function isBusiness(user: { role?: string | null } | null | undefined) {
  return user?.role === "business";
}
