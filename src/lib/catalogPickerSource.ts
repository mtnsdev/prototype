import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";

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
