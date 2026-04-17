/** Primary tabs in the catalog chrome — Destinations uses `/dashboard/products/destinations`; others use `/dashboard/products` with `?tab=`. */
export type ProductDirectoryMainTab =
  | "browse"
  | "collections"
  | "destinations"
  | "rep-firms"
  | "partner-programs";

export type CatalogSegment = ProductDirectoryMainTab;

export function hrefForCatalogTab(tab: ProductDirectoryMainTab): string {
  if (tab === "browse") return "/dashboard/products";
  if (tab === "collections") return "/dashboard/products?tab=collections";
  if (tab === "destinations") return "/dashboard/products/destinations";
  if (tab === "rep-firms") return "/dashboard/products?tab=rep-firms";
  return "/dashboard/products?tab=partner";
}
