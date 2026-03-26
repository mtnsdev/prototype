"use client";

type Props = {
  value: number;
  onChange: (n: number) => void;
};

export function ProductDirectoryStarRating({ value, onChange }: Props) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-[16px] leading-none text-[#C9A96E] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40 rounded"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value >= n}
        >
          {value >= n ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
