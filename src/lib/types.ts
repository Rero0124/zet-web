export interface Post {
  id: string;
  author_id: string | null;
  content: string;
  category: string | null;
  tags: string[];
  impressions: number;
  clicks: number;
  like_count: number;
  review_count: number;
  bookmark_count: number;
  score: number;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
  content: string | null;
  rating: number | null;
  created_at: string;
}

export interface KeywordTrend {
  keyword: string;
  count: number;
}
