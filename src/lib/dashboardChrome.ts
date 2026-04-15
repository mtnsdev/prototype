/**
 * Dashboard / app chrome — hierarchical surfaces inspired by desktop OS patterns:
 * system shell (menu) → window title → toolbar → content.
 *
 * Use semantic Tailwind tokens only (background, border, muted, foreground).
 */

/** Top system row (global shell: identity, search, system actions). */
export const DASHBOARD_CHROME_HEADER_ROW =
  "flex h-[52px] shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 md:px-4";

/** List & index pages: document title + subtitle + primary actions (right). */
export const APP_WINDOW_TITLE_BAR =
  "flex min-h-14 shrink-0 flex-nowrap items-center justify-between gap-4 overflow-hidden border-b border-border/60 bg-background/55 px-5 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/45 md:px-6";

export const APP_WINDOW_TITLE_STACK = "flex min-h-0 min-w-0 flex-col justify-center gap-0.5";

export const APP_WINDOW_TITLE =
  "truncate text-base font-semibold tracking-[-0.02em] text-foreground";

export const APP_WINDOW_SUBTITLE =
  "line-clamp-1 min-h-0 text-xs leading-snug text-muted-foreground/80";

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
