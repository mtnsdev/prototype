"use client";

import type { KeyboardEvent } from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { destMuted } from "./destinationStyles";

export type DestinationNavItem = {
  id: string;
  label: string;
  iconKey: string;
  count: number;
};

type Props = {
  className?: string;
  items: DestinationNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Mobile: horizontal tabs. Desktop: vertical sidebar (~200px). */
  variant: "horizontal" | "vertical";
};

function SectionGlyph({ iconKey, className }: { iconKey: string; className?: string }) {
  const Cmp =
    (Lucide as unknown as Record<string, LucideIcon>)[iconKey] ?? Lucide.Circle;
  return <Cmp className={cn("size-4 shrink-0 opacity-90", className)} aria-hidden />;
}

export function DestinationSectionNav({ className, items, activeId, onChange, variant }: Props) {
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const moveFocusToActive = useRef(false);

  useLayoutEffect(() => {
    if (!moveFocusToActive.current) return;
    moveFocusToActive.current = false;
    activeTabRef.current?.focus();
  }, [activeId]);

  const onNavKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const i = items.findIndex((x) => x.id === activeId);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveFocusToActive.current = true;
      const next = items[(i + 1) % items.length]!;
      onChange(next.id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveFocusToActive.current = true;
      const next = items[(i - 1 + items.length) % items.length]!;
      onChange(next.id);
    }
  };

  const isVertical = variant === "vertical";

  return (
    <div
      className={cn(
        isVertical
          ? "rounded-xl border border-border bg-card/80 p-2"
          : "sticky top-0 z-20 -mx-1 border-b border-border/80 bg-background/90 px-1 py-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        className,
      )}
    >
      <p className={cn("mb-2 px-2 text-[10px] font-medium uppercase tracking-wide", destMuted, !isVertical && "sr-only")}>
        Sections
      </p>
      <nav
        role="tablist"
        aria-label="Destination sections"
        onKeyDown={onNavKeyDown}
        className={cn(
          isVertical ? "flex flex-col gap-0.5" : "flex gap-0.5 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {items.map(({ id, label, iconKey, count }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              ref={isActive ? activeTabRef : undefined}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(id)}
              className={cn(
                "relative flex min-w-0 items-center gap-2 rounded-lg text-left transition-colors",
                isVertical ? "w-full px-2.5 py-2" : "shrink-0 px-2.5 pb-2.5 pt-1.5",
                isActive
                  ? "bg-muted/50 text-foreground"
                  : cn(destMuted, "hover:bg-muted/30 hover:text-foreground/90"),
              )}
            >
              <SectionGlyph iconKey={iconKey} className={isVertical ? "" : "size-3.5"} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("text-xs font-medium sm:text-sm", !isVertical && "whitespace-nowrap")}>
                  {label}
                </span>
                <span
                  className={cn(
                    "tabular-nums text-[10px]",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/70",
                  )}
                  aria-hidden
                >
                  {count} items
                </span>
              </span>
              {!isVertical && isActive ? (
                <span
                  className="pointer-events-none absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-brand-cta sm:inset-x-2"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
