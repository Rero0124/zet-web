"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAuthCookie, type User } from "@/lib/auth";

const GENDERS = ["남성", "여성", "기타"];

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
    birth_date: "",
    gender: "",
    region: "",
    is_business: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        region: form.region || null,
      };
      const data = await api<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuthCookie(data.user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 실패");
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
        type="text"
        placeholder="이름"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
        className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
        <input
          type="text"
          placeholder="아이디"
          value={form.username}
          onChange={(e) => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
          required
          minLength={3}
          maxLength={30}
          className="w-full rounded-lg border border-border bg-background py-3 pl-8 pr-4 text-sm outline-none focus:border-accent"
        />
      </div>
      <input
        type="email"
        placeholder="이메일"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        required
        className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
        required
        minLength={6}
        className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">생년월일</label>
          <input
            type="date"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">성별</label>
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          >
            <option value="">선택</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <input
        type="text"
        placeholder="지역 (선택)"
        value={form.region}
        onChange={(e) => update("region", e.target.value)}
        className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />

      {/* Business toggle */}
      <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_business}
          onChange={(e) => update("is_business", e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <div>
          <span className="text-sm font-medium">기업 회원으로 가입</span>
          <p className="text-xs text-muted">게시글(광고)을 작성하려면 기업 회원이어야 합니다</p>
        </div>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {loading ? "가입 중..." : "회원가입"}
      </button>
      <p className="text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-accent">
          로그인
        </Link>
      </p>
    </form>
  );
}
