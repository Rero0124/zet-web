import type { Metadata } from "next";
import { WritePost } from "@/components/write-post";

export const metadata: Metadata = { title: "새 광고 만들기" };

export default function WritePage() {
  return <WritePost />;
}
