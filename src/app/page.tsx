import { api } from "@/lib/api";
import { FeedControls } from "@/components/feed-controls";
import type { Post } from "@/lib/types";

export default async function Home() {
  let initialPosts: Post[] = [];

  try {
    const data = await api<{ posts: Post[] }>("/feed?sort=popular&limit=20");
    initialPosts = data.posts;
  } catch { /* */ }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Client: filters on top + manages additional loading + replaces on filter change */}
      <FeedControls initialPosts={initialPosts} />
    </div>
  );
}
