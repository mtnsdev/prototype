/** Primary tabs inside the Product Directory (catalog) area. */
export type ProductDirectoryMainTab = "browse" | "collections" | "partner-portal" | "rep-firms";

/** Same as main tabs plus Destinations (separate route under `/dashboard/products/destinations`). */
export type CatalogSegment = ProductDirectoryMainTab | "destinations";

export function hrefForCatalogTab(tab: ProductDirectoryMainTab): string {
  if (tab === "browse") return "/dashboard/products";
  if (tab === "collections") return "/dashboard/products?tab=collections";
  if (tab === "rep-firms") return "/dashboard/products?tab=rep-firms";
  return "/dashboard/products?tab=partner";
}
