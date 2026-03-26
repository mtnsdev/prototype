import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import {
  buildDirectoryCollectionRefs,
  DIRECTORY_EXTERNAL_COLLECTION_ID,
} from "./productDirectoryMock";

export function isExternalSearchCollectionId(collectionId: string): boolean {
  return collectionId === DIRECTORY_EXTERNAL_COLLECTION_ID;
}

/**
 * Call from chat / external-search save flows when persisting to the advisor’s directory.
 * Returns updated `products` and `directoryCollections`, or `null` if External Search is missing
 * or not owned by `advisorUserId`.
 */
export function applyAddProductToExternalSearch(args: {
  productId: string;
  advisorUserId: string;
  products: DirectoryProduct[];
  directoryCollections: DirectoryCollectionOption[];
}): { nextProducts: DirectoryProduct[]; nextCollections: DirectoryCollectionOption[] } | null {
  const { productId, advisorUserId, products, directoryCollections } = args;
  const ext = directoryCollections.find((c) => c.id === DIRECTORY_EXTERNAL_COLLECTION_ID);
  if (!ext?.isSystem || ext.scope !== "private" || ext.ownerId !== advisorUserId) return null;

  const product = products.find((p) => p.id === productId);
  if (!product) return null;

  const nextCollections = directoryCollections.map((c) => {
    if (c.id !== DIRECTORY_EXTERNAL_COLLECTION_ID) return c;
    const base = [...(c.productIds ?? [])];
    if (base.includes(productId)) return c;
    return { ...c, productIds: [...base, productId] };
  });

  if (product.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)) {
    return { nextProducts: products, nextCollections };
  }

  const nextIds = [...product.collectionIds, DIRECTORY_EXTERNAL_COLLECTION_ID];
  const nextProducts = products.map((p) =>
    p.id === productId
      ? {
          ...p,
          collectionIds: nextIds,
          collections: buildDirectoryCollectionRefs(nextIds, nextCollections),
          collectionCount: nextIds.length,
        }
      : p
  );

  return { nextProducts, nextCollections };
}
