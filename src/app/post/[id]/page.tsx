import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { PostActions } from "@/components/post-actions";
import { ReviewSection } from "@/components/review-section";
import { BlockRenderer } from "@/components/block-renderer";
import type { Post, Reaction } from "@/lib/types";

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Post content — server rendered */}
      <article>
        {post.category && (
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent mb-3">
            {post.category}
          </span>
        )}
        {post.blocks && post.blocks.length > 0 ? (
          <BlockRenderer blocks={post.blocks} />
        ) : (
          <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-sm text-accent">#{tag}</span>
            ))}
          </div>
        )}

        {/* Stats + interactive buttons (client) */}
        <PostActions post={post} />
      </article>

      {/* Reviews — server rendered list + client interactive form/edit/delete */}
      <ReviewSection postId={id} initialReviews={reviews} />
    </div>
  );
}
