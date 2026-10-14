"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import { loginPath } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import type { Post } from "@/lib/types";
import { PencilIcon } from "./icons";
import { PageColumn } from "./page-column";
import { PostForm } from "./post-form";
import { EmptyState } from "./ui/empty-state";
import { Spinner } from "./ui/skeleton";

export function EditPost({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthUser();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(loginPath(`/post/${id}/edit`));
      return;
    }
    let cancelled = false;
    api<{ post: Post }>(`/posts/${id}`)
      .then(({ post }) => {
        if (cancelled) return;
        if (post.author_id !== user.id) setError("본인이 게시한 광고만 수정할 수 있어요");
        else setPost(post);
      })
      .catch(() => !cancelled && setError("게시물을 찾을 수 없어요"));
    return () => {
      cancelled = true;
    };
  }, [hydrated, user, id, router]);

  if (error) {
    return (
      <PageColumn>
        <EmptyState
          icon={<PencilIcon size={24} />}
          title={error}
          action={
            <Link href={`/post/${id}`} className="rounded-full bg-subtle px-5 py-2.5 text-sm font-semibold hover:bg-border">
              게시물로 돌아가기
            </Link>
          }
        />
      </PageColumn>
    );
  }

  if (!post) return <Spinner className="py-20" />;

  return <PostForm mode="edit" initial={post} />;
}
