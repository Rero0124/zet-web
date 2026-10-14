export interface Post {
  id: string;
  author_id: string | null;
  content: string;
  blocks: ContentBlock[] | null;
  category: string | null;
  tags: string[];
  media_urls: string[];
  target_age?: string | null;
  target_gender?: string | null;
  target_region?: string | null;
  link_url?: string | null;
  cta_label?: string | null;
  price?: number | null;
  impressions: number;
  clicks: number;
  like_count: number;
  review_count: number;
  bookmark_count: number;
  score: number;
  created_at: string;
  // 서버 PostView에서 함께 내려오는 작성자/뷰어 정보
  author_name?: string | null;
  author_username?: string | null;
  author_role?: string | null;
  author_avatar_url?: string | null;
  avg_rating?: number | null;
  question_count?: number;
  liked?: boolean;
  bookmarked?: boolean;
}

export interface Reaction {
  id: string;
  post_id?: string;
  user_id: string;
  reaction_type: string;
  content: string | null;
  rating: number | null;
  media_urls: string[];
  created_at: string;
  user_name?: string;
  user_username?: string;
  user_avatar_url?: string | null;
}

/** 프로필의 리뷰 탭: 리뷰 + 대상 게시글 요약 */
export interface UserReview extends Reaction {
  post_content: string;
  post_category: string | null;
  post_author_name: string | null;
  post_author_username: string | null;
}

export interface ContentBlock {
  type: string;
  value: string;
}

export interface KeywordTrend {
  keyword: string;
  count: number;
}

export interface Question {
  id: string;
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  answer_count: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_username: string;
  post_content?: string | null;
  post_category?: string | null;
  post_author_id?: string | null;
  post_author_name?: string | null;
  post_author_username?: string | null;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_username: string;
  is_brand?: boolean;
}

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  bio?: string | null;
  avatar_url?: string | null;
  birth_date: string | null;
  gender: string | null;
  region: string | null;
  role: string;
  points: number;
  created_at: string;
}

export interface ProfileStats {
  posts: number;
  reviews: number;
  followers: number;
  following: number;
}

export interface Brand {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  post_count: number;
  follower_count: number;
  total_likes: number;
  is_following: boolean;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  role?: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface PostInsights {
  impressions: number;
  clicks: number;
  cta_clicks: number;
  ctr: number;
  avg_dwell_ms: number;
  likes: number;
  bookmarks: number;
  reviews: number;
  questions: number;
  avg_rating: number | null;
  series: { date: string; impressions: number; clicks: number }[];
  audience: { age: LabelCount[]; gender: LabelCount[]; region: LabelCount[] };
}
