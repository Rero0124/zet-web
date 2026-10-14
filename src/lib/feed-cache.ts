import type { Post } from "./types";

/**
 * 피드 목록/스크롤 위치를 메모리에 보관해, 상세로 갔다가 돌아왔을 때
 * 처음부터 다시 불러오지 않고 보던 위치로 복원한다.
 */
export interface FeedCacheEntry {
  posts: Post[];
  cursor: number;
  hasMore: boolean;
  scrollY: number;
}

export const feedCache = new Map<string, FeedCacheEntry>();

export const feedFilter = { sort: "recommended", category: "전체" };

/** 글 작성/수정/삭제 후 피드를 새로 받도록 무효화 */
export function invalidateFeed() {
  feedCache.clear();
}
