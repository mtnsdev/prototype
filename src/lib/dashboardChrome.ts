/**
 * Dashboard / app chrome — hierarchical surfaces inspired by desktop OS patterns:
 * system shell (menu) → window title → toolbar → content.
 *
 * Use semantic Tailwind tokens only (background, border, muted, foreground).
 */

/** Top system row (global shell: identity, search, system actions). */
export const DASHBOARD_CHROME_HEADER_ROW =
  "flex h-[52px] shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 md:px-4";

/** Compact single-row title bar (legacy / modals). Prefer AppPageHeroHeader for dashboard index pages. */
export const APP_WINDOW_TITLE_BAR =
  "flex min-h-14 shrink-0 flex-nowrap items-center justify-between gap-4 overflow-hidden border-b border-border/60 bg-background/55 px-5 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/45 md:px-6";

export const APP_WINDOW_TITLE_STACK = "flex min-h-0 min-w-0 flex-col justify-center gap-0.5";

export const APP_WINDOW_TITLE =
  "truncate text-xl font-semibold tracking-[-0.02em] text-foreground";

export const APP_WINDOW_SUBTITLE =
  "line-clamp-1 min-h-0 text-sm leading-snug text-muted-foreground";

export const APP_WINDOW_ACTIONS =
  "flex min-h-0 shrink-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Secondary chrome: filters, segmented controls, view toggles.
 * Sits below the window title row.
 */
export const APP_TOOLBAR_ROW =
  "flex shrink-0 flex-wrap items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-muted/12 md:px-6";

/** Detail / document hero (trip name, product title strip). */
export const APP_DOCUMENT_HEAD =
  "w-full border-b border-border/60 bg-background/40 px-5 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/30";

/** Centered app content column (matches briefing home / analytics cap). Pair with APP_PAGE_CONTENT_PAD_X. */
export const APP_PAGE_CONTENT_MAX = "mx-auto w-full max-w-[1600px]";

/** Horizontal padding for pages that use APP_PAGE_CONTENT_MAX — aligns with BriefingRoomPage. */
export const APP_PAGE_CONTENT_PAD_X = "px-6 md:px-10";

/** Combined body shell: centered max width + standard horizontal padding (use for tables, grids, and stacked sections under the hero). */
export const APP_PAGE_CONTENT_SHELL = `${APP_PAGE_CONTENT_MAX} ${APP_PAGE_CONTENT_PAD_X}`;

/** Briefing-style hero header: soft tint behind title row. */
export const APP_PAGE_HERO_GLOW =
  "pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--muted-info-bg)] to-transparent opacity-90";

/** Tighter bottom padding than top so the hero band sits closer to page content. */
export const APP_PAGE_HERO_INNER = "px-6 pt-7 pb-4 md:px-10 md:pt-9 md:pb-5";

export const APP_PAGE_HERO_EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/50";

export const APP_PAGE_HERO_TITLE =
  "text-balance text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-[1.75rem] md:leading-snug";

export const APP_PAGE_HERO_SUBTITLE =
  "max-w-md pt-0.5 text-sm leading-relaxed text-muted-foreground/80";

export const APP_PAGE_HERO_DIVIDER =
  "pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent";

/** @deprecated Use APP_WINDOW_TITLE_BAR — alias for list page headers */
export const DASHBOARD_LIST_PAGE_HEADER = APP_WINDOW_TITLE_BAR;

/** @deprecated Use APP_WINDOW_TITLE_STACK */
export const DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK = APP_WINDOW_TITLE_STACK;

/** @deprecated Use APP_WINDOW_TITLE */
export const DASHBOARD_LIST_PAGE_HEADER_TITLE = APP_WINDOW_TITLE;

/** @deprecated Use APP_WINDOW_SUBTITLE */
export const DASHBOARD_LIST_PAGE_HEADER_SUBTITLE = APP_WINDOW_SUBTITLE;

/** @deprecated Use APP_WINDOW_ACTIONS */
export const DASHBOARD_LIST_PAGE_HEADER_ACTIONS = APP_WINDOW_ACTIONS;
