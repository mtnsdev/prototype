import type { DirectoryProduct } from "@/types/product-directory";

/** Human-readable line for cards and detail when a property has a planned opening. */
export function formatProductOpeningLine(product: DirectoryProduct): string | null {
  const label = product.openingLabel?.trim();
  if (label) return label;
  const raw = product.openingDate?.trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return `Opens ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

/** True when the product shows an opening line in the UI (label or parseable date). */
export function productHasPlannedOpening(product: DirectoryProduct): boolean {
  return formatProductOpeningLine(product) != null;
}

/** Lowercase text used for directory search (label, formatted line, raw date). */
export function directoryProductOpeningSearchText(product: DirectoryProduct): string {
  const parts = [
    product.openingLabel ?? "",
    formatProductOpeningLine(product) ?? "",
    product.openingDate ?? "",
  ];
  return parts.join(" ").toLowerCase();
}
