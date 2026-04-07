/**
 * Map directory catalog rows to registry `Product` shape for shared flows
 * (e.g. Add to itinerary / preview overlay) without duplicating modal logic.
 */

import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import type { PriceRange, Product, ProductCategory, ProductStatus } from "@/types/product";
import type { DirectoryPriceTier } from "@/components/products/productDirectoryDetailMeta";

function directoryTypeToCategory(t: DirectoryProductCategory): ProductCategory {
  switch (t) {
    case "hotel":
    case "villa":
      return "accommodation";
    case "restaurant":
      return "restaurant";
    case "dmc":
      return "dmc";
    case "experience":
    case "wellness":
      return "activity";
    case "cruise":
      return "cruise";
    case "transport":
      return "transportation";
    case "rep_firm":
      return "rep_firm";
    default:
      return "activity";
  }
}

function priceTierToRange(tier: DirectoryPriceTier | undefined): PriceRange | undefined {
  switch (tier) {
    case "$":
      return "budget";
    case "$$":
      return "mid";
    case "$$$":
      return "premium";
    case "$$$$":
      return "luxury";
    case "$$$$$":
      return "ultra_luxury";
    default:
      return undefined;
  }
}

function locationParts(p: DirectoryProduct): { city: string; country: string } {
  const city = (p.city ?? "").trim();
  const country = (p.country ?? "").trim();
  if (city || country) {
    return {
      city: city || "—",
      country: country || "—",
    };
  }
  const loc = (p.location ?? "").trim();
  if (!loc) return { city: "—", country: "—" };
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0] ?? "—", country: parts[parts.length - 1] ?? "—" };
  }
  return { city: loc, country: "—" };
}

/** Minimal `Product` for itinerary preview persistence and display. */
export function directoryProductToProduct(p: DirectoryProduct): Product {
  const { city, country } = locationParts(p);
  const rate = p.effectiveCommissionRate ?? p.commissionRate ?? p.baseCommissionRate ?? undefined;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: directoryTypeToCategory(p.type),
    status: "active" as ProductStatus,
    country,
    city,
    region: p.region || undefined,
    commission_rate: rate ?? undefined,
    hero_image_url: p.imageUrl,
    gallery_urls: p.imageGalleryUrls,
    price_range: priceTierToRange(p.priceTier),
    tags: p.tags,
  };
}
