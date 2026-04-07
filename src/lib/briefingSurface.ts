import { cn } from "@/lib/utils";

/** Large panels (agency hub) — depth, no hover lift. */
export const BRIEFING_PANEL_SURFACE = cn(
  "overflow-hidden rounded-2xl border border-border bg-card",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.055),0_1px_2px_rgba(0,0,0,0.22)]",
);

/** Dashboard widgets — same chrome + lift on hover. */
export const BRIEFING_WIDGET_SURFACE = cn(
  BRIEFING_PANEL_SURFACE,
  "text-card-foreground transition-[box-shadow,background-color] duration-200 ease-out",
  "hover:bg-[var(--surface-card-hover)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_12px_40px_-20px_rgba(0,0,0,0.55)]",
);
