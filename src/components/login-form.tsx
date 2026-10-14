"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { api } from "@/lib/api";
import { setAuthCookie, type User } from "@/lib/auth";
import { safeNext } from "@/lib/format";
import { EyeIcon, EyeOffIcon } from "./icons";
import { toast } from "./ui/toast";

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent";

/** 라벨 + 입력 영역 */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${inputClass} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:text-foreground"
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

/** 서버/네트워크 오류를 사용자 문구로 */
export function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요";
  }
  return msg && msg !== "Request failed" ? msg : fallback;
}

export function LoginForm({ next }: { next?: string }) {
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
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setAuthCookie(data.user);
      toast(`${data.user.name}님, 다시 만나서 반가워요`);
      router.replace(safeNext(next));
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /invalid credentials/i.test(msg)
          ? "이메일 또는 비밀번호가 올바르지 않아요"
          : friendlyError(err, "로그인하지 못했어요"),
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorBox message={error} />}
      <Field label="이메일">
        <input
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <Field label="비밀번호">
        <PasswordInput
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="font-semibold text-accent"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}
