import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "회원가입" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { next, type } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-6">
        <p className="text-[32px] font-black leading-none tracking-tighter">
          zet<span className="text-accent">.</span>
        </p>
        <h1 className="mt-4 text-xl font-bold">Zet에 가입하기</h1>
        <p className="mt-1 text-sm text-muted">새로운 제품 트렌드를 가장 먼저 만나보세요.</p>
      </div>
      <RegisterForm
        next={typeof next === "string" ? next : undefined}
        defaultBusiness={type === "business"}
      />
    </div>
  );
}
