import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile-page";

export const metadata: Metadata = { title: "프로필 편집" };

export default function Profile() {
  return <ProfilePage />;
}
