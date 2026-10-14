"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isBusiness, useAuthUser } from "@/lib/auth";
import { loginPath } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { MegaphoneIcon } from "./icons";
import { PageColumn } from "./page-column";
import { PostForm } from "./post-form";
import { EmptyState } from "./ui/empty-state";
import { Spinner } from "./ui/skeleton";

export function WritePost() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthUser();

  useEffect(() => {
    if (hydrated && !user) router.replace(loginPath("/write"));
  }, [hydrated, user, router]);

  if (!hydrated || !user) return <Spinner className="py-20" />;

  if (!isBusiness(user)) {
    return (
      <PageColumn>
        <EmptyState
          icon={<MegaphoneIcon size={24} />}
          title="브랜드 회원만 광고를 만들 수 있어요"
          description="브랜드 계정으로 가입하면 제품 광고를 게시하고, 노출·클릭 성과와 반응한 고객을 확인할 수 있어요."
          action={
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/register?type=business"
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                브랜드 계정 만들기
              </Link>
              <Link href="/" className="text-sm text-muted hover:text-foreground">
                피드로 돌아가기
              </Link>
            </div>
          }
        />
      </PageColumn>
    );
  }

  return <PostForm mode="create" />;
}
