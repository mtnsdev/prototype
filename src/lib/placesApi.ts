/**
 * Client-side helpers for the Places search + photo stub endpoints.
 *
 * The Add Product modal uses these directly; everything fronts the
 * server routes under /api/places so the swap to real Google Places
 * later is a server-only change.
 */

import type { ProductCategory } from "@/types/product";
import type { MockPlaceResult } from "@/data/mockGooglePlaces";

export type PlaceSearchResult = MockPlaceResult;

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const res = await fetch("/api/places/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => "Places search failed"));
  }
  const data = (await res.json()) as { results?: PlaceSearchResult[] };
  return data.results ?? [];
}

export async function fetchPlacePhoto(placeId: string): Promise<string | null> {
  const res = await fetch(
    `/api/places/photo?placeId=${encodeURIComponent(placeId)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

/**
 * Map a Google Places `types[]` array onto the master product-category enum
 * (`ProductCategory` in `types/product.ts`). Returns `null` when no usable
 * mapping is found so the caller can fall back to asking the user.
 *
 * Distinct from `mapGooglePlaceTypesToDirectoryCategories` which maps onto
 * the *directory* category set (`DirectoryProductCategory`). The Add Product
 * modal stores values in the master enum, so we need the master mapping.
 */
const PLACE_TYPE_TO_PRODUCT_CATEGORY: Record<string, ProductCategory> = {
  lodging: "accommodation",
  hotel: "accommodation",
  resort_hotel: "accommodation",
  extended_stay_hotel: "accommodation",
  motel: "accommodation",
  guest_house: "accommodation",
  hostel: "accommodation",
  bed_and_breakfast: "accommodation",
  restaurant: "restaurant",
  food: "restaurant",
  meal_takeaway: "restaurant",
  cafe: "restaurant",
  bar: "restaurant",
  travel_agency: "dmc",
  tourist_attraction: "activity",
  museum: "activity",
  art_gallery: "activity",
  park: "activity",
  spa: "activity",
  wellness_center: "activity",
  airport: "transportation",
  taxi_stand: "transportation",
  train_station: "transportation",
  bus_station: "transportation",
  cruise: "cruise",
};

export function inferProductCategoryFromPlaceTypes(
  placeTypes: string[],
): ProductCategory | null {
  for (const raw of placeTypes) {
    const mapped = PLACE_TYPE_TO_PRODUCT_CATEGORY[raw.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return null;
}
