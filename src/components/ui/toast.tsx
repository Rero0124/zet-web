"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

interface ToastItem {
  id: number;
  message: string;
  tone: "default" | "error";
  action?: { label: string; href?: string; onClick?: () => void };
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(
  message: string,
  opts: { tone?: "default" | "error"; action?: ToastItem["action"]; duration?: number } = {},
) {
  const id = nextId++;
  items = [...items.slice(-2), { id, message, tone: opts.tone ?? "default", action: opts.action }];
  emit();
  setTimeout(() => dismiss(id), opts.duration ?? 3000);
}

const EMPTY: ToastItem[] = [];

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => EMPTY,
  );

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ${
            t.tone === "error" ? "bg-danger text-white" : "bg-foreground text-background"
          }`}
        >
          <span>{t.message}</span>
          {t.action &&
            (t.action.href ? (
              <Link
                href={t.action.href}
                onClick={() => dismiss(t.id)}
                className="shrink-0 font-semibold underline-offset-2 hover:underline"
              >
                {t.action.label}
              </Link>
            ) : (
              <button
                onClick={() => {
                  t.action?.onClick?.();
                  dismiss(t.id);
                }}
                className="shrink-0 font-semibold underline-offset-2 hover:underline"
              >
                {t.action.label}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
