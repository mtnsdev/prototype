import type { Destination } from "@/data/destinations";
import type { DirectoryProduct } from "@/types/product-directory";
import {
  mergeDirectoryProductIntoDmc,
  mergeDirectoryProductIntoHotel,
  mergeDirectoryProductIntoRestaurant,
  mergeDirectoryProductIntoYacht,
} from "@/lib/catalogProductMerge";

/**
 * Merges Product Directory catalog rows into destination mock data by `productId`.
 * Catalog wins for operational / identity fields where merge helpers apply.
 */
export function mergeDestinationWithCatalog(destination: Destination, products: DirectoryProduct[]): Destination {
  const byId = new Map(products.map((p) => [p.id, p]));

  const dmcPartners = destination.dmcPartners.map((d) => {
    if (!d.productId) return d;
    const p = byId.get(d.productId);
    return p ? mergeDirectoryProductIntoDmc(d, p) : d;
  });

  const restaurants: Destination["restaurants"] = {};
  for (const [region, list] of Object.entries(destination.restaurants)) {
    restaurants[region] = list.map((r) => {
      if (!r.productId) return r;
      const p = byId.get(r.productId);
      return p ? mergeDirectoryProductIntoRestaurant(r, p) : r;
    });
  }

  const hotels: Destination["hotels"] = {};
  for (const [group, list] of Object.entries(destination.hotels)) {
    hotels[group] = list.map((h) => {
      if (!h.productId) return h;
      const p = byId.get(h.productId);
      return p ? mergeDirectoryProductIntoHotel(h, p) : h;
    });
  }

  const yachtCompanies = destination.yachtCompanies?.map((y) => {
    if (!y.productId) return y;
    const p = byId.get(y.productId);
    return p ? mergeDirectoryProductIntoYacht(y, p) : y;
  });

  return {
    ...destination,
    dmcPartners,
    restaurants,
    hotels,
    ...(yachtCompanies ? { yachtCompanies } : {}),
  };
}
