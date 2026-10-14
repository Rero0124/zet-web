import { resolveMediaUrl } from "@/lib/format";

const PALETTE = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
  "bg-teal-500", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/**
 * 브랜드 계정은 로고처럼 둥근 사각형, 일반 사용자는 원형으로 구분
 */
export function Avatar({
  name,
  src,
  size = 40,
  brand = false,
  className = "",
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  brand?: boolean;
  className?: string;
}) {
  const label = (name || "?").trim();
  const shape = brand ? "rounded-[28%]" : "rounded-full";
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveMediaUrl(src)}
        alt=""
        style={style}
        className={`${shape} shrink-0 object-cover bg-subtle ${className}`}
      />
    );
  }

  return (
    <span
      style={style}
      aria-hidden="true"
      className={`${shape} ${colorFor(label)} inline-flex shrink-0 select-none items-center justify-center font-semibold text-white ${className}`}
    >
      {label.charAt(0)}
    </span>
  );
}
