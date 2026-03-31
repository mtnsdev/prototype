import { cn } from "@/lib/utils";

/**
 * Shared list / table chrome for VICs, products, knowledge documents, etc.
 * Keeps row height, hover, borders, and headers aligned across features.
 */

/** List shell: same base as the page — no lifted gray card. */
export const listSurfaceClass =
  "rounded-xl border border-border bg-background";

export const listScrollClass = "overflow-x-auto";

/** Default min-width for wide tables; pass a feature-specific min-w when needed. */
export function listTableClass(minWidth?: string) {
  return cn("w-full text-sm", minWidth);
}

/** Header: hairline only, no tinted band. */
export const listTheadRowClass =
  "border-b border-border bg-transparent text-left text-xs font-medium text-muted-foreground";

/** Standard header cell (sort buttons / labels). */
export const listThClass = "px-3 py-3";

/** Leading checkbox column */
export const listThCheckboxClass = "w-10 px-3 py-3 pl-4";

export const listTbodyRowClass =
  "border-b border-border/50 transition-colors hover:bg-muted/35";

export const listTdClass = "px-3 py-3 align-middle text-sm";

export const listTdCheckboxClass = "w-10 px-3 py-3 pl-4 align-middle";

/** Primary title / name in a row */
export const listPrimaryTextClass = "font-medium text-foreground";

/** Secondary metadata */
export const listMutedCellClass = "text-sm text-muted-foreground";

/**
 * Card-style row (virtualized product directory, dense lists).
 * Use with bulk/selection modifiers from the feature.
 */
export const listCardRowBaseClass =
  "group flex cursor-pointer gap-3 rounded-lg border border-border/80 bg-transparent px-3 py-3 transition-colors hover:bg-muted/35 hover:border-border";

export function listSurfaceWithState(opts: { refetching?: boolean }) {
  return cn(listSurfaceClass, listScrollClass, "overflow-hidden", opts.refetching && "opacity-[0.72]");
}
