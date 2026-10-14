import type { Metadata } from "next";
import { TrendingPage } from "@/components/trending-page";

export const metadata: Metadata = {
  title: "트렌드",
  description: "연령·성별별로 지금 실제 반응이 몰리는 제품 키워드",
};

export default function Trending() {
  return <TrendingPage />;
}
