"use client";

import { BRIEFING_WIDGET_SURFACE } from "@/lib/briefingSurface";
import { cn } from "@/lib/utils";

type AccentColor =
  | "amber"
  | "blue"
  | "violet"
  | "emerald"
  | "cyan"
  | "rose"
  | "gray";

/** Icon well tints — use theme tokens (see globals.css semantic colors). */
const ACCENT_BG: Record<AccentColor, string> = {
  amber: "bg-[var(--color-warning-muted)]",
  blue: "bg-[var(--color-info-muted)]",
  violet: "bg-[var(--muted-accent-bg)]",
  /** Kept for call sites; same cool slate as info — no green. */
  emerald: "bg-[var(--color-info-muted)]",
  cyan: "bg-[var(--muted-info-bg)]",
  rose: "bg-[var(--color-muted-amber-bg)]",
  gray: "bg-muted/45",
};

export type WidgetCardDensity = "compact" | "default" | "expanded";

type Props = {
  accent: AccentColor;
  icon: React.ReactNode;
  title: string;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** @deprecated Prefer `density` */
  compact?: boolean;
  /** Padding and title scale: compact = denser, expanded = more prominent */
  density?: WidgetCardDensity;
  /** Animation delay index for stagger (0-based) */
  staggerIndex?: number;
};

export default function AppleWidgetCard({
  accent,
  icon,
  title,
  rightElement,
  children,
  className,
  compact,
  density: densityProp,
  staggerIndex = 0,
}: Props) {
  const density: WidgetCardDensity =
    densityProp ?? (compact ? "compact" : "default");

  const headerPad =
    density === "compact"
      ? "px-4 pt-4 pb-3"
      : density === "expanded"
        ? "px-7 pt-7 pb-5"
        : "px-5 pt-5 pb-4";
  const bodyPad =
    density === "compact"
      ? "px-4 pb-4 pt-3"
      : density === "expanded"
        ? "px-7 pb-7 pt-5"
        : "px-5 pb-5 pt-4";
  const iconWrap =
    density === "expanded"
      ? "w-10 h-10 [&_svg]:size-[22px]"
      : density === "compact"
        ? "w-8 h-8 [&_svg]:size-[17px]"
        : "w-9 h-9 [&_svg]:size-[18px]";
  const titleClass =
    density === "expanded"
      ? "text-base font-semibold text-foreground tracking-tight"
      : density === "compact"
        ? "text-xs font-semibold text-foreground tracking-tight"
        : "text-sm font-semibold text-foreground tracking-tight";

  return (
    <article
      className={cn(
        BRIEFING_WIDGET_SURFACE,
        "animate-briefing-fade-in",
        density === "expanded" && "min-h-0",
        className
      )}
      style={{ animationDelay: `${staggerIndex * 36}ms` }}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border/70",
          headerPad
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-[10px] text-foreground/90 ring-1 ring-border/80 ring-inset",
              iconWrap,
              ACCENT_BG[accent]
            )}
          >
            {icon}
          </div>
          <h3 className={cn("min-w-0 truncate", titleClass)}>{title}</h3>
        </div>
        {rightElement != null && <div className="shrink-0">{rightElement}</div>}
      </header>
      <div className={bodyPad}>{children}</div>
    </article>
  );
}

export type { AccentColor };
