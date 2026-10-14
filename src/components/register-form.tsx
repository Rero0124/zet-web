"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { setAuthCookie, type User } from "@/lib/auth";
import { PROFILE_GENDERS, REGIONS } from "@/lib/constants";
import { safeNext } from "@/lib/format";
import { CheckIcon, MegaphoneIcon, UserIcon } from "./icons";
import { ErrorBox, Field, PasswordInput, friendlyError, inputClass } from "./login-form";
import { toast } from "./ui/toast";

const ACCOUNT_TYPES = [
  { business: false, title: "일반 회원", desc: "제품 발견 · 리뷰 · 저장 · 팔로우", icon: UserIcon },
  { business: true, title: "브랜드 회원", desc: "광고 게시 · 성과 분석 · 고객 Q&A 답변", icon: MegaphoneIcon },
] as const;

export function RegisterForm({ next, defaultBusiness = false }: { next?: string; defaultBusiness?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
    birth_date: "",
    gender: "",
    region: "",
    is_business: defaultBusiness,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim(),
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        region: form.region || null,
      };
      const data = await api<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuthCookie(data.user);
      toast(
        form.is_business
          ? "브랜드 계정이 만들어졌어요. 첫 광고를 만들어보세요"
          : `${data.user.name}님, 환영해요!`,
      );
      router.replace(next ? safeNext(next) : form.is_business ? "/write" : "/");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err, "회원가입하지 못했어요"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 계정 유형 */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="계정 유형">
        {ACCOUNT_TYPES.map(({ business, title, desc, icon: Icon }) => {
          const active = form.is_business === business;
          return (
            <button
              key={title}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update("is_business", business)}
              className={`relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition-colors ${
                active ? "border-accent bg-accent/5" : "border-border hover:bg-subtle"
              }`}
            >
              <Icon size={20} className={active ? "text-accent" : "text-muted"} />
              <span className="mt-2 text-sm font-semibold">{title}</span>
              <span className="mt-0.5 text-xs leading-snug text-muted">{desc}</span>
              {active && (
                <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                  <CheckIcon size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <ErrorBox message={error} />}

      <Field
        label={form.is_business ? "브랜드명" : "이름"}
        hint={form.is_business ? "피드와 프로필에 브랜드 이름으로 표시돼요" : undefined}
      >
        <input
          type="text"
          autoComplete={form.is_business ? "organization" : "name"}
          placeholder={form.is_business ? "예: 스킨랩 코리아" : "이름"}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          maxLength={100}
          className={inputClass}
        />
      </Field>
      <Field label="아이디" hint="영문 소문자, 숫자, 마침표(.), 밑줄(_) 3~30자">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
          <input
            type="text"
            autoComplete="username"
            placeholder="username"
            value={form.username}
            onChange={(e) => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
            required
            minLength={3}
            maxLength={30}
            className={`${inputClass} pl-8`}
          />
        </div>
      </Field>
      <Field label="이메일">
        <input
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          className={inputClass}
        />
      </Field>
      <Field label="비밀번호" hint="6자 이상">
        <PasswordInput
          autoComplete="new-password"
          placeholder="비밀번호"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          required
          minLength={6}
        />
      </Field>

      {/* 맞춤 추천 정보 */}
      <fieldset className="rounded-2xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">맞춤 추천 정보 (선택)</legend>
        <p className="text-xs text-muted">연령·성별·지역은 추천에만 쓰이고 프로필에 공개되지 않아요</p>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="생년월일">
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => update("birth_date", e.target.value)}
              className={inputClass}
            />
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium">성별</span>
            <div className="flex gap-2">
              {PROFILE_GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={form.gender === g}
                  onClick={() => update("gender", form.gender === g ? "" : g)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    form.gender === g ? "bg-foreground text-background" : "bg-subtle hover:bg-border"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Field label="지역">
            <select
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              className={inputClass}
            >
              <option value="">선택 안 함</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "가입 중..." : form.is_business ? "브랜드 계정 만들기" : "가입하기"}
      </button>
      <p className="text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-accent">
          로그인
        </Link>
      </p>
    </form>
  );
}
