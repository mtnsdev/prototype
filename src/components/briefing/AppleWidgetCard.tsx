"use client";

import { cn } from "@/lib/utils";

type AccentColor =
  | "amber"
  | "blue"
  | "violet"
  | "emerald"
  | "cyan"
  | "rose"
  | "gray";

const ACCENT_BG: Record<AccentColor, string> = {
  amber: "bg-amber-500/10",
  blue: "bg-blue-500/10",
  violet: "bg-violet-500/10",
  emerald: "bg-emerald-500/10",
  cyan: "bg-cyan-500/10",
  rose: "bg-rose-500/10",
  gray: "bg-white/5",
};

type Props = {
  accent: AccentColor;
  icon: React.ReactNode;
  title: string;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Less padding for full-width compact widgets */
  compact?: boolean;
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
  staggerIndex = 0,
}: Props) {
  return (
    <article
      className={cn(
        "rounded-[20px] border border-border overflow-hidden",
        "bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30 hover:border-white/[0.12]",
        "animate-briefing-fade-in",
        className
      )}
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
    >
      <div className={compact ? "p-4" : "p-6"}>
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white/90",
                ACCENT_BG[accent]
              )}
            >
              {icon}
            </div>
            <h3 className="text-sm font-medium text-muted-foreground/90 uppercase tracking-wider truncate">
              {title}
            </h3>
          </div>
          {rightElement != null && (
            <div className="shrink-0">{rightElement}</div>
          )}
        </header>
        {children}
      </div>
    </article>
  );
}

export type { AccentColor };
