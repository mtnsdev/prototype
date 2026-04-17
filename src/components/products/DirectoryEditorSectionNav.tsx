"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DirectoryEditorSectionLink = { id: string; label: string };

type Props = {
  ariaLabel: string;
  sections: DirectoryEditorSectionLink[];
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  onBackToTop?: () => void;
  className?: string;
};

export function DirectoryEditorSectionNav({
  ariaLabel,
  sections,
  scrollContainerRef,
  onBackToTop,
  className,
}: Props) {
  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const scroller = scrollContainerRef?.current;
    if (scroller) {
      const pad = 10;
      const er = el.getBoundingClientRect();
      const sr = scroller.getBoundingClientRect();
      const nextTop = scroller.scrollTop + (er.top - sr.top) - pad;
      scroller.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      aria-label={ariaLabel}
    >
      {sections.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className="rounded px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground sm:text-2xs"
          onClick={() => jump(id)}
        >
          {label}
        </button>
      ))}
      {onBackToTop ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-6 shrink-0 gap-0.5 px-1.5 text-[10px] text-muted-foreground sm:h-7 sm:text-2xs"
          onClick={onBackToTop}
        >
          Back to top
        </Button>
      ) : null}
    </nav>
  );
}
