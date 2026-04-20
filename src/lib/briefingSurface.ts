import { cn } from "@/lib/utils";

/** Large panels (agency hub) — depth, no hover lift. */
export const BRIEFING_PANEL_SURFACE = cn(
  "overflow-hidden rounded-2xl border border-border bg-card",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85),0_1px_3px_rgba(28,26,22,0.07)]",
);

/** Dashboard widgets — same chrome + lift on hover. */
export const BRIEFING_WIDGET_SURFACE = cn(
  BRIEFING_PANEL_SURFACE,
  "text-card-foreground transition-[box-shadow,background-color] duration-200 ease-out",
  "hover:bg-[var(--surface-card-hover)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_12px_32px_-10px_rgba(28,26,22,0.14)]",
);
