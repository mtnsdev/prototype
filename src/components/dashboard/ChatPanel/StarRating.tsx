import { Star } from "lucide-react";

/** Displays a 0–5 rating as stars; supports float (e.g. 4.2 = 4 full + 1 partial). */
export function StarRating({
  value,
  max = 5,
  size = 12,
  className = "",
}: {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}) {
  const full = Math.floor(value);
  const fraction = value - full;
  const empty = max - Math.ceil(value);
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rating: ${value} out of ${max}`}>
      {Array.from({ length: full }, (_, i) => (
        <Star key={`f-${i}`} size={size} className="shrink-0 fill-current" strokeWidth={1.5} />
      ))}
      {fraction > 0 && (
        <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
          <Star size={size} className="fill-none stroke-current opacity-40" strokeWidth={1.5} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
            <Star size={size} className="fill-current" strokeWidth={1.5} />
          </span>
        </span>
      )}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`e-${i}`} size={size} className="shrink-0 fill-none stroke-current opacity-40" strokeWidth={1.5} />
      ))}
    </div>
  );
}
