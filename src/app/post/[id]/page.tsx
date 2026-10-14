import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { postMedia, postText, splitHeadline } from "@/lib/format";
import { PostDetail } from "@/components/post-detail";
import type { Post, Reaction } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { post } = await api<{ post: Post }>(`/posts/${id}`);
    const { headline, body } = splitHeadline(postText(post));
    const image = postMedia(post).find((m) => m.type === "image");
    const title = headline || "게시물";
    const description = [post.author_name, body.replace(/\s+/g, " ").slice(0, 100)].filter(Boolean).join(" · ");
    return {
      title,
      description,
      openGraph: { title, description, images: image ? [image.url] : undefined },
    };
  } catch {
    return { title: "게시물" };
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let post: Post;
  let reactions: Reaction[];

  try {
    const [postData, reactionsData] = await Promise.all([
      api<{ post: Post }>(`/posts/${id}`),
      api<{ reactions: Reaction[] }>(`/posts/${id}/reactions`),
    ]);
    post = postData.post;
    reactions = reactionsData.reactions;
  } catch {
    notFound();
  }

  const reviews = reactions.filter((r) => r.reaction_type === "review");

  return <PostDetail initialPost={post} initialReviews={reviews} />;
}
