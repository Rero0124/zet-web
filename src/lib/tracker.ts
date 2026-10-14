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

function flushWithBeacon() {
  if (queue.length === 0) return;
  const blob = new Blob(
    [JSON.stringify({ interactions: queue })],
    { type: "application/json" },
  );
  navigator.sendBeacon(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"}/interactions/batch`,
    blob,
  );
  queue = [];
}

// Flush on page unload (모바일 Safari는 beforeunload가 불안정해 pagehide/visibilitychange도 사용)
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushWithBeacon);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushWithBeacon();
  });
}

export function trackImpression(postId: string) {
  enqueue({ post_id: postId, interaction_type: "impression" });
}

export function trackClick(postId: string) {
  enqueue({ post_id: postId, interaction_type: "click" });
}

/** 광고 링크(CTA)로 외부 이동 */
export function trackCta(postId: string) {
  enqueue({ post_id: postId, interaction_type: "cta" });
  // 외부 페이지로 이동하므로 즉시 전송
  flushWithBeacon();
}

export function trackDwell(postId: string, durationMs: number) {
  if (durationMs < 1000) return; // Ignore very short dwells
  enqueue({ post_id: postId, interaction_type: "dwell", duration_ms: durationMs });
}
