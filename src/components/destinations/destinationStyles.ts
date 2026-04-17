import { cn } from "@/lib/utils";

/**
 * Destination surfaces — slightly lifted vs the app canvas (`bg-background`)
 * so cards read clearly without the old ultra-subtle white overlay.
 */
export const destPage = "flex min-h-0 flex-1 flex-col text-foreground";
export const destCard =
  "rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-border hover:bg-muted/25";
/** Row / trigger hover inside a destination card (accordions, dense lists). */
export const destCardRowHover = "transition-colors hover:bg-muted/35";
export const destMuted = "text-muted-foreground";
export const destMuted2 = "text-muted-foreground/75";

export function destCardClass(extra?: string) {
  return cn(destCard, extra);
}
