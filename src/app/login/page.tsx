import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <p className="text-[32px] font-black leading-none tracking-tighter">
          zet<span className="text-accent">.</span>
        </p>
        <h1 className="mt-4 text-xl font-bold leading-snug">
          광고도 콘텐츠처럼,
          <br />
          나에게 맞는 제품만
        </h1>
        <p className="mt-2 text-sm text-muted">로그인하고 맞춤 피드와 저장·리뷰·팔로우를 이용해보세요.</p>
      </div>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
