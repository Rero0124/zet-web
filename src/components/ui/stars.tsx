import { StarIcon } from "../icons";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-star" aria-label={`별점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={size} filled={n <= Math.round(value)} strokeWidth={1.5} className={n <= Math.round(value) ? "" : "text-border"} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className={`transition-transform active:scale-90 ${n <= value ? "text-star" : "text-border"}`}
        >
          <StarIcon size={size} filled={n <= value} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
