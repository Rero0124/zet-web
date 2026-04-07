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
}

export function setAuthCookie(user: User) {
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `zet_user=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = "zet_user=; path=/; max-age=0";
}

export function getAuthUser(): User | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )zet_user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
