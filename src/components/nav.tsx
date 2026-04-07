"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthUser, clearAuthCookie, type User } from "@/lib/auth";

const links = [
  { href: "/", label: "피드" },
  { href: "/trending", label: "트렌드" },
  { href: "/search", label: "검색" },
  { href: "/qna", label: "Q&A" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getAuthUser());
  }, [pathname]);

  function handleLogout() {
    clearAuthCookie();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Zet
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "font-semibold" : "text-muted hover:text-foreground"}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "business" && (
                <Link
                  href="/write"
                  className="rounded-full bg-accent px-4 py-1.5 text-white text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  글쓰기
                </Link>
              )}
              <Link href="/profile" className="text-sm font-medium hover:text-accent transition-colors">
                @{user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-accent px-4 py-1.5 text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
