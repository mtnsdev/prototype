import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import { directoryCategoryLabel } from "@/components/products/productDirectoryProductTypes";

/** First type is the primary badge / pin color when a product has multiple categories. */
export function getPrimaryDirectoryType(product: DirectoryProduct): DirectoryProductCategory {
  return product.types[0] ?? "hotel";
}

/** Compact label for tables (primary category + count when multi-type). */
export function directoryProductTypeShortLabel(product: DirectoryProduct): string {
  const primary = getPrimaryDirectoryType(product);
  const base = directoryCategoryLabel(primary);
  return product.types.length > 1 ? `${base} +${product.types.length - 1}` : base;
}

/** OR semantics for directory type chips: match if any product type is selected. */
export function directoryProductMatchesActiveTypeFilters(
  product: DirectoryProduct,
  activeTypeFilters: DirectoryProductCategory[]
): boolean {
  if (activeTypeFilters.length === 0) return true;
  return product.types.some((t) => activeTypeFilters.includes(t));
}

export function normalizeDirectoryProductTypes(
  types: DirectoryProductCategory[] | undefined | null
): DirectoryProductCategory[] {
  if (!types?.length) return ["hotel"];
  const seen = new Set<DirectoryProductCategory>();
  const out: DirectoryProductCategory[] = [];
  for (const t of types) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.length > 0 ? out : ["hotel"];
}

type LegacyProductJson = DirectoryProduct & { type?: DirectoryProductCategory };

/** Migrate persisted or legacy JSON: `type` → `types`, drop obsolete rep_firm product type. */
export function migrateDirectoryProductJson(raw: unknown): DirectoryProduct {
  const p = raw as LegacyProductJson;
  if (!p || typeof p !== "object") {
    throw new Error("Invalid directory product payload");
  }
  let types = Array.isArray(p.types) ? normalizeDirectoryProductTypes(p.types as DirectoryProductCategory[]) : [];
  const legacyRaw = p.type as string | undefined;
  if (types.length === 0 && legacyRaw && typeof legacyRaw === "string") {
    if (legacyRaw === "rep_firm") {
      types = ["hotel"];
    } else {
      types = normalizeDirectoryProductTypes([legacyRaw as DirectoryProductCategory]);
    }
  }
  if (types.length === 0) types = ["hotel"];
  const { type: _drop, ...rest } = p;
  return { ...rest, types };
}
