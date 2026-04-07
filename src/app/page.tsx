import { FeedControls } from "@/components/feed-controls";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl">
      <FeedControls initialPosts={[]} />
    </div>
  );
}
