import type { Destination, DMCPartner, Hotel, Restaurant, YachtCompany } from "@/data/destinations";

/**
 * Product-directory rows on a destination: DMCs, yachts, restaurants, and hotels are all catalog products.
 * Storage remains the legacy bundle shape on {@link Destination}; this module is the single read path for
 * “what catalog products does this guide reference?” and for assembling virtual sections.
 */
export type DestinationCatalogProductKind = "dmc" | "yacht" | "restaurant" | "hotel";

export type DestinationCatalogItem =
  | { kind: "dmc"; partner: DMCPartner }
  | { kind: "yacht"; yacht: YachtCompany }
  | { kind: "restaurant"; region: string; restaurant: Restaurant }
  | { kind: "hotel"; region: string; hotel: Hotel };

/** Ordered flat list: DMCs → yachts → restaurants (by region) → hotels (by region). */
export function flattenDestinationCatalogProducts(d: Destination): DestinationCatalogItem[] {
  const out: DestinationCatalogItem[] = [];
  for (const partner of d.dmcPartners ?? []) {
    out.push({ kind: "dmc", partner });
  }
  for (const y of d.yachtCompanies ?? []) {
    out.push({ kind: "yacht", yacht: y });
  }
  const restaurants = d.restaurants ?? {};
  for (const [region, list] of Object.entries(restaurants)) {
    if (list == null) continue;
    for (const restaurant of list) {
      if (restaurant != null) out.push({ kind: "restaurant", region, restaurant });
    }
  }
  const hotels = d.hotels ?? {};
  for (const [region, list] of Object.entries(hotels)) {
    if (list == null) continue;
    for (const hotel of list) {
      if (hotel != null) out.push({ kind: "hotel", region, hotel });
    }
  }
  return out;
}

function regroupRestaurants(items: DestinationCatalogItem[]): Record<string, Restaurant[]> {
  const m: Record<string, Restaurant[]> = {};
  for (const it of items) {
    if (it.kind !== "restaurant") continue;
    const list = m[it.region] ?? [];
    list.push(it.restaurant);
    m[it.region] = list;
  }
  return m;
}

function regroupHotels(items: DestinationCatalogItem[]): Record<string, Hotel[]> {
  const m: Record<string, Hotel[]> = {};
  for (const it of items) {
    if (it.kind !== "hotel") continue;
    const list = m[it.region] ?? [];
    list.push(it.hotel);
    m[it.region] = list;
  }
  return m;
}

/** Rebuild legacy bundle shapes from the unified list (inverse of {@link flattenDestinationCatalogProducts}). */
export function regroupDestinationCatalogFromFlat(items: DestinationCatalogItem[]): {
  dmcPartners: DMCPartner[];
  yachtCompanies: YachtCompany[];
  restaurants: Record<string, Restaurant[]>;
  hotels: Record<string, Hotel[]>;
} {
  return {
    dmcPartners: items
      .filter((i): i is Extract<DestinationCatalogItem, { kind: "dmc" }> => i.kind === "dmc")
      .map((i) => i.partner),
    yachtCompanies: items
      .filter((i): i is Extract<DestinationCatalogItem, { kind: "yacht" }> => i.kind === "yacht")
      .map((i) => i.yacht),
    restaurants: regroupRestaurants(items),
    hotels: regroupHotels(items),
  };
}

/**
 * Canonical catalog bundles for section rendering — derived from the unified flat list so there is one
 * conceptual pipeline for all product-backed rows.
 */
export function getDestinationCatalogBundles(d: Destination): {
  dmcPartners: DMCPartner[];
  yachtCompanies: YachtCompany[];
  restaurants: Record<string, Restaurant[]>;
  hotels: Record<string, Hotel[]>;
} {
  return regroupDestinationCatalogFromFlat(flattenDestinationCatalogProducts(d));
}

export function countDestinationCatalogProductRows(d: Destination): number {
  return flattenDestinationCatalogProducts(d).length;
}
