"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getAuthUser } from "./auth";
import { trackDwell, trackImpression } from "./tracker";

const noopSubscribe = () => () => {};

/** 하이드레이션이 끝난 뒤에만 true — 로그인 쿠키 기반 요청을 중복 없이 한 번만 보내기 위해 사용 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * 화면에 50% 이상 노출되면 impression, 벗어나면 체류시간(dwell)을 기록.
 * 작성자 본인의 조회는 광고 성과를 왜곡하므로 기록하지 않는다.
 */
export function useViewTracking<T extends HTMLElement>(postId: string, authorId?: string | null) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (authorId && getAuthUser()?.id === authorId) return;

    let start: number | null = null;
    let impressed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!impressed) {
            trackImpression(postId);
            impressed = true;
          }
          start = Date.now();
        } else if (start) {
          trackDwell(postId, Date.now() - start);
          start = null;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (start) trackDwell(postId, Date.now() - start);
    };
  }, [postId, authorId]);

  return ref;
}
