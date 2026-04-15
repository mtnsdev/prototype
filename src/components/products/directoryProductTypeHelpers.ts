import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import { directoryCategoryLabel } from "@/components/products/productDirectoryProductTypes";

const DMC_GOOGLE_TYPE_SET = new Set(["travel_agency", "tour_operator", "dmc"]);

/** True when this catalog row is a DMC — uses `types` and optional `google_types` until a dedicated API field exists. */
export function isDMCProduct(
  product: Pick<DirectoryProduct, "types"> & { google_types?: string[] | null | undefined },
): boolean {
  if (product.types?.includes("dmc")) return true;
  return (
    product.google_types?.some((t) => DMC_GOOGLE_TYPE_SET.has(String(t).toLowerCase())) ?? false
  );
}

/** At least one DMC operational field has non-empty text (for badges / defensive section visibility). */
export function dmcOperationalDataPresent(product: DirectoryProduct): boolean {
  const fields = [
    product.general_requests_email,
    product.pricing_model,
    product.payment_process,
    product.commission_process,
    product.after_hours_support,
    product.destinations_served,
    product.repped_by,
  ];
  return fields.some((v) => v != null && String(v).trim() !== "");
}

/** Concatenate searchable text for Cmd+K / global search (includes DMC operational copy). */
export function directoryProductSearchHaystack(p: DirectoryProduct): string {
  const typeLabels = (p.types ?? []).map((t) => directoryCategoryLabel(t));
  const parts: (string | number | null | undefined)[] = [
    p.name,
    p.location,
    p.city,
    p.country,
    p.region,
    p.description,
    ...(p.tags ?? []),
    ...typeLabels,
    p.general_requests_email,
    p.pricing_model,
    p.payment_process,
    p.commission_process,
    p.after_hours_support,
    p.destinations_served,
    p.repped_by,
    p.destinations,
    ...(p.google_types ?? []),
  ];
  return parts
    .filter((x) => x != null && String(x).trim() !== "")
    .map((x) => String(x))
    .join(" ");
}

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
