"use client";

import type { ReactNode } from "react";
import { useScrollCollapseState } from "@/hooks/useScrollCollapseState";
import { cn } from "@/lib/utils";
import {
  APP_PAGE_HERO_DIVIDER,
  APP_PAGE_HERO_EYEBROW,
  APP_PAGE_HERO_GLOW,
  APP_PAGE_HERO_INNER,
  APP_PAGE_HERO_SUBTITLE,
  APP_PAGE_HERO_TITLE,
} from "@/lib/dashboardChrome";

export type AppPageHeroToolbarPlacement = "below" | "with-title";

export type AppPageHeroHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  belowSubtitle?: ReactNode;
  aside?: ReactNode;
  toolbar?: ReactNode;
  toolbarPlacement?: AppPageHeroToolbarPlacement;
  /**
   * Scroll container that includes this header as its first sticky child. Set via `ref` callback
   * on the same `overflow-y-auto` wrapper, then pass the element here.
   */
  scrollRoot?: HTMLElement | null;
  collapseOnScroll?: boolean;
  className?: string;
};

const HERO_INNER_COMPACT = "px-4 py-2.5 md:px-8 md:py-3";

/**
 * Dashboard page hero header. Optional `collapseOnScroll` + `scrollRoot` for a sticky compact top bar when scrolling.
 */
export function AppPageHeroHeader({
  eyebrow,
  title,
  subtitle,
  belowSubtitle,
  aside,
  toolbar,
  toolbarPlacement = "below",
  scrollRoot,
  collapseOnScroll = false,
  className,
}: AppPageHeroHeaderProps) {
  const withTitleLayout = toolbarPlacement === "with-title";
  const belowToolbar = toolbarPlacement === "below" && toolbar != null;

  const scrolled = useScrollCollapseState(scrollRoot ?? null, {
    enabled: Boolean(collapseOnScroll && scrollRoot),
    threshold: 16,
  });
  const compact = Boolean(collapseOnScroll && scrolled);

  return (
    <header
      data-compact={compact ? "true" : "false"}
      className={cn(
        "relative shrink-0 overflow-hidden bg-background motion-safe:transition-[box-shadow,background-color] motion-safe:duration-200",
        collapseOnScroll && "sticky top-0 z-30",
        compact && "border-b border-border/50 bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className={cn(APP_PAGE_HERO_GLOW, compact && "opacity-0")} aria-hidden />
      <div
        className={cn(
          "relative",
          compact ? HERO_INNER_COMPACT : APP_PAGE_HERO_INNER
        )}
      >
        {withTitleLayout ? (
          <>
            {eyebrow != null && eyebrow !== "" ? (
              <p className={cn(APP_PAGE_HERO_EYEBROW, compact && "hidden")}>{eyebrow}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <h1
                className={cn(
                  APP_PAGE_HERO_TITLE,
                  "min-w-0 flex-1 basis-[min(100%,20rem)]",
                  compact && "truncate text-lg md:text-xl"
                )}
              >
                {title}
              </h1>
              {toolbar != null || aside != null ? (
                <div
                  className={cn(
                    "flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-3",
                    compact && "gap-1.5 md:gap-2"
                  )}
                >
                  {toolbar != null ? toolbar : null}
                  {aside != null ? aside : null}
                </div>
              ) : null}
            </div>
            {subtitle != null && subtitle !== "" ? (
              <p className={cn(APP_PAGE_HERO_SUBTITLE, "mt-2", compact && "hidden")}>{subtitle}</p>
            ) : null}
            {belowSubtitle != null ? (
              <div className={cn("pt-4", compact && "hidden")}>{belowSubtitle}</div>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6 md:gap-8">
              <div className="min-w-0 flex-1 space-y-1">
                {eyebrow != null && eyebrow !== "" ? (
                  <p className={cn(APP_PAGE_HERO_EYEBROW, compact && "hidden")}>{eyebrow}</p>
                ) : null}
                <h1 className={cn(APP_PAGE_HERO_TITLE, compact && "truncate text-lg md:text-xl")}>{title}</h1>
                {subtitle != null && subtitle !== "" ? (
                  <p className={cn(APP_PAGE_HERO_SUBTITLE, compact && "hidden")}>{subtitle}</p>
                ) : null}
                {belowSubtitle != null ? (
                  <div className={cn("pt-4", compact && "hidden")}>{belowSubtitle}</div>
                ) : null}
              </div>
              {aside != null ? (
                <div
                  className={cn(
                    "shrink-0 self-end sm:ml-auto",
                    compact && "self-center [&_p]:py-1 [&_p]:text-2xs"
                  )}
                >
                  {aside}
                </div>
              ) : null}
            </div>
            {belowToolbar ? (
              <div
                className={cn(
                  "mt-5 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 md:gap-3",
                  compact && "mt-2 max-h-11 overflow-x-auto overflow-y-hidden py-0.5 sm:max-h-none sm:flex-nowrap"
                )}
              >
                {toolbar}
              </div>
            ) : null}
          </>
        )}
      </div>
      {!compact ? <div className={APP_PAGE_HERO_DIVIDER} aria-hidden /> : null}
    </header>
  );
}
