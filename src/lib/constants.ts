export const CATEGORIES = [
  { value: "뷰티", emoji: "💄" },
  { value: "테크", emoji: "🎧" },
  { value: "식품", emoji: "🥗" },
  { value: "패션", emoji: "👟" },
  { value: "생활", emoji: "🏠" },
  { value: "건강", emoji: "💊" },
] as const;

export const AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대 이상"];

export const GENDERS = ["남성", "여성"];

/** 프로필 입력용 (기타 포함) */
export const PROFILE_GENDERS = ["남성", "여성", "기타"];

/** 타겟팅 매칭이 정확히 일치해야 하므로 지역은 자유 입력 대신 고정 목록 사용 */
export const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

export const CTA_LABELS = ["구매하기", "자세히 보기", "할인받기", "예약하기", "신청하기"];

export const DEFAULT_CTA_LABEL = "구매하기";

export function categoryEmoji(category: string | null | undefined): string {
  return CATEGORIES.find((c) => c.value === category)?.emoji ?? "";
}
