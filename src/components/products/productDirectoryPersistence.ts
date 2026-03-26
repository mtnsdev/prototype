import type {
  DirectoryCollectionOption,
  DirectoryExternalSearchMeta,
  DirectoryProduct,
} from "@/types/product-directory";

const STORAGE_KEY = "enable-product-directory-v1";
const SCHEMA_VERSION = 2;

export type PersistedDirectoryPayload = {
  v: number;
  products: DirectoryProduct[];
  directoryCollections: DirectoryCollectionOption[];
  /** Optional overlay for “saved from search” tooltips (chat / external search). */
  externalSearchMeta?: Record<string, DirectoryExternalSearchMeta>;
  savedAt: string;
};

export function loadPersistedDirectory(): {
  products: DirectoryProduct[] | null;
  directoryCollections: DirectoryCollectionOption[] | null;
  externalSearchMeta: Record<string, DirectoryExternalSearchMeta> | null;
} {
  if (typeof window === "undefined") {
    return { products: null, directoryCollections: null, externalSearchMeta: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: null, directoryCollections: null, externalSearchMeta: null };
    const data = JSON.parse(raw) as Partial<PersistedDirectoryPayload>;
    const v = data.v;
    if ((v !== SCHEMA_VERSION && v !== 1) || !Array.isArray(data.products)) {
      return { products: null, directoryCollections: null, externalSearchMeta: null };
    }
    const meta =
      v === 2 && data.externalSearchMeta && typeof data.externalSearchMeta === "object"
        ? (data.externalSearchMeta as Record<string, DirectoryExternalSearchMeta>)
        : {};
    return {
      products: data.products as DirectoryProduct[],
      directoryCollections: Array.isArray(data.directoryCollections)
        ? (data.directoryCollections as DirectoryCollectionOption[])
        : null,
      externalSearchMeta: meta,
    };
  } catch {
    return { products: null, directoryCollections: null, externalSearchMeta: null };
  }
}

export function persistDirectorySnapshot(
  products: DirectoryProduct[],
  directoryCollections: DirectoryCollectionOption[],
  externalSearchMeta?: Record<string, DirectoryExternalSearchMeta>
): void {
  try {
    const payload: PersistedDirectoryPayload = {
      v: SCHEMA_VERSION,
      products,
      directoryCollections,
      externalSearchMeta: externalSearchMeta && Object.keys(externalSearchMeta).length > 0 ? externalSearchMeta : undefined,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedDirectory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function cloneDirectoryProductsForState(products: DirectoryProduct[]): DirectoryProduct[] {
  return products.map((p) => ({
    ...p,
    collectionIds: [...p.collectionIds],
    collections: [...p.collections],
    partnerPrograms: p.partnerPrograms.map((pp) => ({
      ...pp,
      activePromotions: (pp.activePromotions ?? []).map((x) => ({ ...x })),
      amenityTags: pp.amenityTags ? [...pp.amenityTags] : [],
    })),
  }));
}

export function cloneDirectoryCollectionsForState(collections: DirectoryCollectionOption[]): DirectoryCollectionOption[] {
  return collections.map((c) => ({
    ...c,
    productIds: c.productIds ? [...c.productIds] : undefined,
  }));
}
