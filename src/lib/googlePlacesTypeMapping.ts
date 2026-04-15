import type { DirectoryProductCategory } from "@/types/product-directory";
import mappingJson from "@/data/google-places-type-mapping.json";

const MAP = new Map<string, DirectoryProductCategory>(
  (mappingJson.mappings as { google: string; enable: DirectoryProductCategory }[]).map((m) => [
    m.google.toLowerCase(),
    m.enable,
  ])
);

/**
 * Maps raw Google Places `types` / `primary_type` strings to Enable directory categories.
 * Unrecognized types are omitted (caller may treat as needing a new mapping row).
 */
export function mapGooglePlaceTypesToEnableCategories(types: string[]): DirectoryProductCategory[] {
  const out: DirectoryProductCategory[] = [];
  const seen = new Set<DirectoryProductCategory>();
  for (const t of types) {
    const cat = MAP.get(t.toLowerCase().trim());
    if (cat && !seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
    }
  }
  return out;
}
