import type { ReactNode } from "react";

/** 피드형 단일 컬럼 레이아웃 (데스크톱에서는 좌우 구분선) */
export function PageColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl border-border md:border-x ${className}`}>
      {children}
    </div>
  );
}
