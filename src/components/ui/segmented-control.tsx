"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string = string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  /** Active segment style — `gold` matches Enable dark toolbar accent. */
  activeTone?: "default" | "gold";
  /** Accessible label for the tablist */
  "aria-label"?: string;
};

/**
 * macOS-style segmented control — mutually exclusive modes (toolbar / window scope).
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  activeTone = "default",
  "aria-label": ariaLabel,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-[10px] border border-border/50 bg-muted/30 p-0.5 shadow-inner backdrop-blur-sm supports-[backdrop-filter]:bg-muted/20",
        className
      )}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-[color,background-color,box-shadow,border-color] duration-150",
              selected
                ? activeTone === "gold"
                  ? "border border-[rgba(201,169,110,0.35)] bg-[rgba(201,169,110,0.12)] text-brand-cta shadow-sm ring-1 ring-[rgba(201,169,110,0.12)]"
                  : "bg-background/90 text-foreground shadow-sm"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
