"use client";

import { toast } from "@/components/ui/toast";

export async function shareLink(path: string, title?: string) {
  const url = new URL(path, window.location.origin).toString();
  if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // 사용자가 공유 시트를 닫은 경우 — 링크 복사로 넘어가지 않음
      return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("링크를 복사했어요");
  } catch {
    toast("링크를 복사하지 못했어요", { tone: "error" });
  }
}
