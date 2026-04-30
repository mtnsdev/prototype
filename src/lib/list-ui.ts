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
  return cn("w-full text-compact", minWidth);
}

/** Header: hairline only, no tinted band. */
export const listTheadRowClass =
  "border-b border-border bg-transparent text-left text-compact font-medium text-muted-foreground";

/** Standard header cell (sort buttons / labels). */
export const listThClass = "px-3 py-3";

/** Leading checkbox column */
export const listThCheckboxClass = "w-10 px-3 py-3 pl-4";

export const listTbodyRowClass =
  "border-b border-border/50 transition-colors hover:bg-muted/35";

/** Zebra rows: “white” = paper card (`--surface-card`), vs elevated linen — not literal #fff. */
export const listTbodyRowStripedClass = cn(
  listTbodyRowClass,
  "odd:bg-card even:bg-[var(--surface-elevated)]",
);

export const listTdClass = "px-3 py-3 align-middle text-compact";

export const listTdCheckboxClass = "w-10 px-3 py-3 pl-4 align-middle text-compact";

/**
 * Toolbar / filter chip font size (matches table `text-compact`).
 * Prefer this over `text-compact` inside `cn(...)` with `text-muted-foreground` / `text-brand-cta`:
 * tailwind-merge can drop unknown `text-*` font sizes when mixed with `text-*` colors.
 */
export const listToolbarChipFontClass = "[font-size:var(--text-compact)]";

/** Primary title / name in a row */
export const listPrimaryTextClass = "font-medium text-compact text-foreground";

/** Secondary metadata (pair with `listTdClass` on `<td>` — sets color only). */
export const listMutedCellClass = "text-muted-foreground";

/** Inline round pills (pipeline, status, acuity) — same size as table body text. */
export const listTablePillClass =
  "inline-flex items-center rounded-full px-2 py-0.5 text-compact font-medium leading-tight";

/** Inline rectangular tags (e.g. product tier in directory table). */
export const listTableTagClass =
  "inline-flex items-center rounded border px-1.5 py-0.5 text-compact leading-tight";

/**
 * Card-style row (virtualized product directory, dense lists).
 * Use with bulk/selection modifiers from the feature.
 */
export const listCardRowBaseClass =
  "group flex cursor-pointer gap-3 rounded-lg border border-border/80 bg-transparent px-3 py-3 transition-colors hover:bg-muted/35 hover:border-border";

export function listSurfaceWithState(opts: { refetching?: boolean }) {
  return cn(listSurfaceClass, listScrollClass, "overflow-hidden", opts.refetching && "opacity-[0.72]");
}
