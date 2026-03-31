"use client";

import { cn } from "@/lib/utils";
import type { VICProfile } from "@/types/vic-profile";

const tierStyles: Record<VICProfile["ltvTier"], string> = {
  platinum: "bg-violet-500/15 text-violet-300 border-violet-500/35",
  gold: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  silver: "bg-muted/50 text-muted-foreground border-border",
  bronze: "bg-orange-900/20 text-orange-300/90 border-orange-900/40",
  pending: "bg-muted/40 text-muted-foreground border-border",
};

export function LTVBadge({ tier, className }: { tier: VICProfile["ltvTier"]; className?: string }) {
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tierStyles[tier],
        className
      )}
    >
      {label}
    </span>
  );
}
