/**
 * Shared listing typography for products in directory, catalog cards, and compact rows
 * so title + meta lines scan the same across surfaces.
 */
export const productListingTitleClass = "truncate font-semibold text-compact text-foreground";

/** Grid / tall cards where the title may wrap to two lines. */
export const productListingTitleMultilineClass =
  "line-clamp-2 font-semibold text-compact leading-snug text-foreground";

export const productListingMetaLineClass = "mt-0.5 text-xs text-muted-foreground";

export const productListingCompactTitleLinkClass =
  "font-medium text-foreground hover:underline block truncate";
