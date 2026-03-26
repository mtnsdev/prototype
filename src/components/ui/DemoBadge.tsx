"use client";

import { IS_PREVIEW_MODE } from "@/config/preview";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DemoBadge({ className }: Props) {
  if (!IS_PREVIEW_MODE) return null;
  return (
    <span
      className={cn(
        "absolute top-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]",
        className
      )}
    >
      Demo
    </span>
  );
}
