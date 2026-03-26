import type {
  DirectoryCollectionOption,
  DirectoryExternalSearchMeta,
  DirectoryProduct,
} from "@/types/product-directory";
import { cloneMockDirectoryCatalogForAdvisor } from "./productDirectoryMock";
import {
  cloneDirectoryCollectionsForState,
  cloneDirectoryProductsForState,
  loadPersistedDirectory,
} from "./productDirectoryPersistence";

/**
 * Single resolver for “current catalog” used by the directory page and cross-route mutations (e.g. chat).
 * Prefers localStorage; falls back to per-advisor mock seed when nothing is stored.
 */
export function resolveAdvisorCatalogFromStorage(
  advisorUid: string,
  advisorDisplayName: string
): {
  products: DirectoryProduct[];
  directoryCollections: DirectoryCollectionOption[];
  externalSearchMeta: Record<string, DirectoryExternalSearchMeta>;
} {
  const persisted = loadPersistedDirectory();
  const meta =
    persisted.externalSearchMeta && typeof persisted.externalSearchMeta === "object"
      ? { ...persisted.externalSearchMeta }
      : {};

  if (persisted.products?.length) {
    return {
      products: cloneDirectoryProductsForState(persisted.products),
      directoryCollections:
        persisted.directoryCollections && persisted.directoryCollections.length > 0
          ? cloneDirectoryCollectionsForState(persisted.directoryCollections)
          : cloneMockDirectoryCatalogForAdvisor(advisorUid, advisorDisplayName).collections,
      externalSearchMeta: meta,
    };
  }

  const seeded = cloneMockDirectoryCatalogForAdvisor(advisorUid, advisorDisplayName);
  return {
    products: seeded.products,
    directoryCollections: seeded.collections,
    externalSearchMeta: meta,
  };
}
