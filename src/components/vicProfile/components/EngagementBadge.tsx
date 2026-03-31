"use client";

import { cn } from "@/lib/utils";
import type { TouchPoint } from "@/types/vic-profile";
import { engagementHealth } from "@/lib/vic-profile-helpers";

const copy: Record<ReturnType<typeof engagementHealth>, { label: string; className: string }> = {
  green: { label: "Engaged (< 30d)", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35" },
  amber: { label: "Check in (30–90d)", className: "bg-amber-500/15 text-amber-300 border-amber-500/35" },
  red: { label: "Stale (> 90d)", className: "bg-red-500/15 text-red-300 border-red-500/35" },
};

export function EngagementBadge({ touchPoints, className }: { touchPoints: TouchPoint[]; className?: string }) {
  const level = engagementHealth(touchPoints);
  const { label, className: c } = copy[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        c,
        className
      )}
    >
      {label}
    </span>
  );
}
