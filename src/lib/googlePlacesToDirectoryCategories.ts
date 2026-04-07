import type { DirectoryProductCategory } from "@/types/product-directory";

function dedupeTypes(types: DirectoryProductCategory[]): DirectoryProductCategory[] {
  if (!types.length) return ["hotel"];
  const seen = new Set<DirectoryProductCategory>();
  const out: DirectoryProductCategory[] = [];
  for (const t of types) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.length ? out : ["hotel"];
}

/**
 * Placeholder map: Google Places types (snake_case) → directory categories.
 * Replace / extend when the definitive mapping is provided.
 */
const GOOGLE_PLACE_TYPE_TO_DIRECTORY: Record<string, DirectoryProductCategory> = {
  lodging: "hotel",
  hotel: "hotel",
  resort_hotel: "hotel",
  extended_stay_hotel: "hotel",
  motel: "hotel",
  guest_house: "hotel",
  hostel: "hotel",
  bed_and_breakfast: "hotel",
  spa: "wellness",
  wellness_center: "wellness",
  restaurant: "restaurant",
  food: "restaurant",
  meal_takeaway: "restaurant",
  cafe: "restaurant",
  bar: "restaurant",
  travel_agency: "dmc",
  tourist_attraction: "experience",
  museum: "experience",
  art_gallery: "experience",
  park: "experience",
  airport: "transport",
  taxi_stand: "transport",
  train_station: "transport",
  bus_station: "transport",
  subpremise: "transport",
  cruise: "cruise",
};

/**
 * Map raw Google Places `types[]` to directory categories (deduped, order preserved).
 */
export function mapGooglePlaceTypesToDirectoryCategories(placeTypes: string[]): DirectoryProductCategory[] {
  const out: DirectoryProductCategory[] = [];
  const seen = new Set<DirectoryProductCategory>();
  for (const raw of placeTypes) {
    const key = raw.trim().toLowerCase();
    const mapped = GOOGLE_PLACE_TYPE_TO_DIRECTORY[key];
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return dedupeTypes(out);
}
