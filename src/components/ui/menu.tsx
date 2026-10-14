"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
}

export function Menu({
  trigger,
  items,
  label = "더보기",
  align = "right",
}: {
  trigger: ReactNode;
  items: MenuItem[];
  label?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 페이지가 숨겨질 때(뒤로가기 등) 열린 메뉴가 남지 않도록
  useLayoutEffect(() => () => setOpen(false), []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center justify-center rounded-full p-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => {
            const cls = `flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-subtle ${
              item.danger ? "text-danger" : ""
            }`;
            return item.href ? (
              <Link key={item.label} href={item.href} role="menuitem" className={cls} onClick={() => setOpen(false)}>
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                role="menuitem"
                className={cls}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
