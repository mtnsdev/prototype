import type { DirectoryProduct } from "../types/product-directory";

/** Pure merge for catalog patches; used by catalog context and node tests (no side effects). */
export function mergeDirectoryProductPatchInCatalog(
  products: DirectoryProduct[],
  productId: string,
  patch: Partial<DirectoryProduct>
): DirectoryProduct[] | null {
  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) return null;
  return products.map((p, i) => (i === idx ? { ...p, ...patch } : p));
}
