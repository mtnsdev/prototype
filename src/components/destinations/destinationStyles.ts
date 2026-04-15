import { cn } from "@/lib/utils";

/**
 * Surfaces aligned with Product Directory / `DirectoryProductCard`
 * (`border-white/[0.04]`, `bg-white/[0.02]`, hover lift).
 */
export const destPage = "flex min-h-0 flex-1 flex-col text-foreground";
export const destCard =
  "rounded-xl border border-white/[0.04] bg-white/[0.02] transition-colors hover:border-border hover:bg-white/[0.04]";
export const destMuted = "text-muted-foreground";
export const destMuted2 = "text-muted-foreground/75";

export function destCardClass(extra?: string) {
  return cn(destCard, extra);
}
