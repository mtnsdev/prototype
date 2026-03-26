"use client";

import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  /** Violet accent for “enriched” style toggles */
  variant?: "gold" | "violet";
  "aria-labelledby"?: string;
};

/**
 * Compact directory filter switch — consistent sizing and click handling
 * (stops propagation so parent rows don’t mis-handle the event).
 */
export function ProductDirectoryFilterSwitch({
  checked,
  onCheckedChange,
  disabled,
  variant = "gold",
  "aria-labelledby": ariaLabelledBy,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onCheckedChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c12]",
        disabled && "cursor-not-allowed opacity-40",
        checked
          ? variant === "violet"
            ? "bg-[rgba(160,140,180,0.78)]"
            : "bg-[#B8976E]"
          : "bg-white/[0.08]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
