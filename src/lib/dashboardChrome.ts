/**
 * Shared dashboard list/index page chrome (VICs, Knowledge Vault, Product Directory,
 * Itineraries, Analytics, Automations). Fixed height so the top banner matches everywhere.
 */
/** Same fixed row height as list page headers; sidebar brand strip aligns to this. */
export const DASHBOARD_CHROME_HEADER_ROW = "h-16 shrink-0";

export const DASHBOARD_LIST_PAGE_HEADER =
  "flex h-16 shrink-0 flex-nowrap items-center justify-between gap-4 overflow-hidden border-b border-border pl-6 pr-[4.5rem]";

export const DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK =
  "min-w-0 flex min-h-0 flex-col justify-center gap-1";

export const DASHBOARD_LIST_PAGE_HEADER_TITLE =
  "truncate text-sm font-semibold leading-none text-foreground";

export const DASHBOARD_LIST_PAGE_HEADER_SUBTITLE =
  "line-clamp-1 min-h-0 text-xs leading-snug text-muted-foreground/75";

/** Right-side controls: no wrapping so header height stays fixed; scroll horizontally on narrow viewports. */
export const DASHBOARD_LIST_PAGE_HEADER_ACTIONS =
  "flex min-h-0 shrink-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
