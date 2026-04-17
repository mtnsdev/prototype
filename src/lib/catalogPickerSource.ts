import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import type { EditorProductSlot } from "@/data/destinations";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";

/** Limits catalog search to categories that belong in this destination editor list. */
export function editorProductSlotToCategories(slot: EditorProductSlot): DirectoryProductCategory[] {
  switch (slot) {
    case "dmc":
      return ["dmc"];
    case "restaurants":
      return ["restaurant"];
    case "hotels":
      return ["hotel", "villa", "wellness"];
    case "yachts":
      return ["cruise", "transport", "experience"];
    case "tourism":
      return ["dmc", "experience"];
    case "documents":
      return [];
    default: {
      const _exhaustive: never = slot;
      return _exhaustive;
    }
  }
}

export function filterCatalogByTypes(allowedTypes: DirectoryProductCategory[]): DirectoryProduct[] {
  if (allowedTypes.length === 0) return [...MOCK_DIRECTORY_PRODUCTS];
  return MOCK_DIRECTORY_PRODUCTS.filter((p) => allowedTypes.some((t) => p.types.includes(t)));
}

export function searchCatalogProducts(
  query: string,
  allowedTypes: DirectoryProductCategory[],
): DirectoryProduct[] {
  const pool = filterCatalogByTypes(allowedTypes);
  const q = query.trim().toLowerCase();
  if (!q) return pool.slice(0, 80);
  return pool
    .filter((p) => {
      const hay = `${p.id} ${p.name} ${p.location} ${p.region} ${p.country ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 80);
}
