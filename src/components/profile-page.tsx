"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getAuthUser, isBusiness, setAuthCookie, type User } from "@/lib/auth";
import { PROFILE_GENDERS, REGIONS } from "@/lib/constants";
import { loginPath, profilePath } from "@/lib/format";
import { uploadFiles } from "@/lib/upload";
import { CameraIcon, ChevronLeftIcon, LogOutIcon } from "./icons";
import { useLogout } from "./nav";
import { PageColumn } from "./page-column";
import { Avatar } from "./ui/avatar";
import { toast } from "./ui/toast";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent";

export function ProfilePage() {
  const router = useRouter();
  const logout = useLogout();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    name: "",
    bio: "",
    avatar_url: "",
    birth_date: "",
    gender: "",
    region: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace(loginPath("/profile"));
      return;
    }
    setUser(u);
    setForm({
      username: u.username,
      name: u.name,
      bio: u.bio || "",
      avatar_url: u.avatar_url || "",
      birth_date: u.birth_date || "",
      gender: u.gender || "",
      region: u.region || "",
    });
  }, [router]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const [url] = await uploadFiles([file]);
      set("avatar_url", url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "사진을 올리지 못했어요", { tone: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");

    try {
      const data = await api<{ user: User }>(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          username: form.username || null,
          name: form.name || null,
          bio: form.bio.trim(),
          avatar_url: form.avatar_url,
          birth_date: form.birth_date || null,
          gender: form.gender || null,
          region: form.region || null,
        }),
      });
      setAuthCookie(data.user);
      setUser(data.user);
      toast("프로필을 저장했어요", {
        action: { label: "프로필 보기", href: profilePath(data.user.username, data.user.id) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했어요");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;
  const business = isBusiness(user);

  return (
    <PageColumn>
      <form onSubmit={handleSave}>
        <div className="sticky top-14 z-30 flex h-12 items-center gap-1 border-b border-border bg-background/90 px-2 backdrop-blur-md">
          <button type="button" onClick={() => router.back()} aria-label="뒤로 가기" className="rounded-full p-1.5 hover:bg-subtle">
            <ChevronLeftIcon size={24} />
          </button>
          <h1 className="text-[15px] font-semibold">프로필 편집</h1>
          <button
            type="submit"
            disabled={saving || uploading || !form.name.trim() || form.username.length < 3}
            className="ml-auto rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        <div className="flex flex-col gap-6 px-4 py-6">
          {error && (
            <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          {/* 사진 */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative"
              aria-label="프로필 사진 변경"
            >
              <Avatar name={form.name} src={form.avatar_url || null} brand={business} size={96} />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
                {uploading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <CameraIcon size={15} />
                )}
              </span>
            </button>
            {form.avatar_url && (
              <button type="button" onClick={() => set("avatar_url", "")} className="text-xs text-muted hover:text-danger">
                사진 삭제
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </div>

          {/* 공개 정보 */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold">공개 프로필</h2>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{business ? "브랜드명" : "이름"}</span>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">아이디</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
                <input
                  value={form.username}
                  onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  minLength={3}
                  maxLength={30}
                  className={`${inputCls} pl-8`}
                />
              </div>
              <span className="mt-1 block text-xs text-muted">영문 소문자, 숫자, 마침표(.), 밑줄(_) · 3~30자</span>
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between text-xs text-muted">
                <span>{business ? "브랜드 소개" : "소개"}</span>
                <span>{form.bio.length}/300</span>
              </span>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value.slice(0, 300))}
                rows={3}
                placeholder={business ? "어떤 제품을 만드는 브랜드인지 알려주세요" : "나를 한 줄로 소개해보세요"}
                className={`${inputCls} resize-none`}
              />
            </label>
          </section>

          {/* 비공개 정보 */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold">맞춤 추천 정보</h2>
              <p className="mt-0.5 text-xs text-muted">
                {business
                  ? "브랜드 계정의 정보는 추천에 사용되지 않아요."
                  : "연령·성별·지역은 나에게 맞는 제품을 추천하는 데만 쓰이고 다른 사람에게 공개되지 않아요."}
              </p>
            </div>
            <div className="flex gap-2">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-muted">생년월일</span>
                <input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} className={inputCls} />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-muted">지역</span>
                <select value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls}>
                  <option value="">선택 안 함</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  {form.region && !REGIONS.includes(form.region) && <option value={form.region}>{form.region}</option>}
                </select>
              </label>
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-muted">성별</span>
              <div className="flex gap-2">
                {PROFILE_GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={form.gender === g}
                    onClick={() => set("gender", form.gender === g ? "" : g)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      form.gender === g ? "bg-foreground text-background" : "bg-subtle hover:bg-border"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-1 border-t border-border pt-5 text-sm">
            <p className="text-xs text-muted">이메일 {user.email}</p>
            <p className="text-xs text-muted">{business ? "브랜드(기업) 회원" : "일반 회원"}</p>
            <div className="mt-3 flex gap-2">
              <Link
                href={profilePath(user.username, user.id)}
                className="flex-1 rounded-xl bg-subtle py-2.5 text-center font-semibold hover:bg-border"
              >
                내 프로필 보기
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-subtle py-2.5 font-semibold text-danger hover:bg-border"
              >
                <LogOutIcon size={16} />
                로그아웃
              </button>
            </div>
          </section>
        </div>
      </form>
    </PageColumn>
  );
}
