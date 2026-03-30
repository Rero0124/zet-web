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
    name: "",
    birth_date: "",
    gender: "",
    region: "",
    is_business: false,
    business_name: "",
    registration_no: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.is_business && (!form.business_name || !form.registration_no)) {
      setError("기업명과 사업자등록번호를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        region: form.region || null,
        business_name: form.is_business ? form.business_name : undefined,
        registration_no: form.is_business ? form.registration_no : undefined,
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

      {form.is_business && (
        <div className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <input
            type="text"
            placeholder="기업명"
            value={form.business_name}
            onChange={(e) => update("business_name", e.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="text"
            placeholder="사업자등록번호 (000-00-00000)"
            value={form.registration_no}
            onChange={(e) => update("registration_no", e.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>
      )}

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
