"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAuthCookie, type User } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthCookie(data.user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/register" className="font-medium text-accent">
          회원가입
        </Link>
      </p>
    </form>
  );
}
