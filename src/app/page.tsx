import { Feed } from "@/components/feed";
import { FeedSidebar } from "@/components/feed-sidebar";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl justify-center gap-8 lg:px-4">
      <div className="min-h-[calc(100dvh-3.5rem)] w-full min-w-0 max-w-2xl border-border md:border-x">
        <Feed />
      </div>
      <aside className="hidden w-80 shrink-0 py-5 lg:block">
        <FeedSidebar />
      </aside>
    </div>
  );
}
