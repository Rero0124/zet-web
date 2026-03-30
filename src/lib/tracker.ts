import { api } from "./api";
import { getAuthUser } from "./auth";

interface PendingInteraction {
  post_id: string;
  user_id: string;
  interaction_type: string;
  duration_ms?: number;
}

let queue: PendingInteraction[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function enqueue(interaction: Omit<PendingInteraction, "user_id">) {
  const user = getAuthUser();
  if (!user) return;

  queue.push({ ...interaction, user_id: user.id });

  if (!flushTimer) {
    flushTimer = setTimeout(flush, 3000);
  }
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;

  const batch = [...queue];
  queue = [];

  try {
    await api("/interactions/batch", {
      method: "POST",
      body: JSON.stringify({ interactions: batch }),
    });
  } catch {
    // Re-queue on failure
    queue.unshift(...batch);
  }
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (queue.length > 0) {
      const blob = new Blob(
        [JSON.stringify({ interactions: queue })],
        { type: "application/json" },
      );
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/interactions/batch`,
        blob,
      );
    }
  });
}

export function trackImpression(postId: string) {
  enqueue({ post_id: postId, interaction_type: "impression" });
}

export function trackClick(postId: string) {
  enqueue({ post_id: postId, interaction_type: "click" });
}

export function trackDwell(postId: string, durationMs: number) {
  if (durationMs < 1000) return; // Ignore very short dwells
  enqueue({ post_id: postId, interaction_type: "dwell", duration_ms: durationMs });
}
