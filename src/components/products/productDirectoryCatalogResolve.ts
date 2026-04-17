import type {
  DirectoryCollectionOption,
  DirectoryExternalSearchMeta,
  DirectoryProduct,
} from "@/types/product-directory";
import { DESTINATION_CATALOG_OVERLAY_PRODUCTS } from "@/data/destinationCatalogOverlay";
import { cloneMockDirectoryCatalogForAdvisor } from "./productDirectoryMock";
import {
  cloneDirectoryCollectionsForState,
  cloneDirectoryProductsForState,
  loadPersistedDirectory,
} from "./productDirectoryPersistence";

function withDestinationCatalogOverlay(products: DirectoryProduct[]): DirectoryProduct[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const out = [...products];
  for (const p of DESTINATION_CATALOG_OVERLAY_PRODUCTS) {
    if (!byId.has(p.id)) {
      out.push(p);
      byId.set(p.id, p);
    }
  }
  return out;
}

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

  const seeded = cloneMockDirectoryCatalogForAdvisor(advisorUid, advisorDisplayName);

  if (persisted.products?.length) {
    try {
      const products = cloneDirectoryProductsForState(persisted.products);
      /** Corrupt / partial saves can yield an empty list; never strand the UI with no catalog. */
      if (products.length === 0) {
        return {
          products: withDestinationCatalogOverlay(seeded.products),
          directoryCollections:
            persisted.directoryCollections && persisted.directoryCollections.length > 0
              ? cloneDirectoryCollectionsForState(persisted.directoryCollections)
              : seeded.collections,
          externalSearchMeta: meta,
        };
      }
      return {
        products: withDestinationCatalogOverlay(products),
        directoryCollections:
          persisted.directoryCollections && persisted.directoryCollections.length > 0
            ? cloneDirectoryCollectionsForState(persisted.directoryCollections)
            : seeded.collections,
        externalSearchMeta: meta,
      };
    } catch {
      return {
        products: withDestinationCatalogOverlay(seeded.products),
        directoryCollections: seeded.collections,
        externalSearchMeta: meta,
      };
    }
  }

  return {
    products: withDestinationCatalogOverlay(seeded.products),
    directoryCollections: seeded.collections,
    externalSearchMeta: meta,
  };
}
