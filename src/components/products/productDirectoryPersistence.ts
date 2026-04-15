import type {
  DirectoryCollectionOption,
  DirectoryExternalSearchMeta,
  DirectoryProduct,
} from "@/types/product-directory";
import type { RepFirm } from "@/types/rep-firm";
import { migrateDirectoryProductJson } from "@/components/products/directoryProductTypeHelpers";

/** localStorage key for the advisor directory snapshot — used for cross-tab `storage` sync. */
export const DIRECTORY_CATALOG_LOCAL_STORAGE_KEY = "enable-product-directory-v1";
const SCHEMA_VERSION = 3;

const REP_FIRMS_KEY = "enable-rep-firms-registry-v1";
const REP_FIRMS_SCHEMA = 1;
/** Same-tab sync when registry is saved from Settings or Products. */
export const REP_FIRMS_REGISTRY_UPDATED = "enable-rep-firms-registry-updated";

export type PersistedRepFirmsPayload = { v: number; repFirms: RepFirm[] };

export function cloneRepFirmsForState(repFirms: RepFirm[]): RepFirm[] {
  return repFirms.map((f) => ({
    ...f,
    regions: [...f.regions],
    productTypes: [...f.productTypes],
  }));
}

function normalizeRepFirmsJson(repFirms: RepFirm[]): string {
  const sorted = [...repFirms].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(sorted);
}

export function repFirmsEqual(a: RepFirm[], b: RepFirm[]): boolean {
  return normalizeRepFirmsJson(a) === normalizeRepFirmsJson(b);
}

export function loadRepFirmsFromStorage(): RepFirm[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REP_FIRMS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedRepFirmsPayload>;
    if (data.v !== REP_FIRMS_SCHEMA || !Array.isArray(data.repFirms)) return null;
    return data.repFirms as RepFirm[];
  } catch {
    return null;
  }
}

export function persistRepFirmsSnapshot(repFirms: RepFirm[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedRepFirmsPayload = { v: REP_FIRMS_SCHEMA, repFirms };
    localStorage.setItem(REP_FIRMS_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(REP_FIRMS_REGISTRY_UPDATED));
  } catch {
    /* quota */
  }
}

export function subscribeRepFirmsRegistry(onUpdate: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onUpdate();
  window.addEventListener(REP_FIRMS_REGISTRY_UPDATED, handler);
  return () => window.removeEventListener(REP_FIRMS_REGISTRY_UPDATED, handler);
}

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
    const raw = localStorage.getItem(DIRECTORY_CATALOG_LOCAL_STORAGE_KEY);
    if (!raw) return { products: null, directoryCollections: null, externalSearchMeta: null };
    const data = JSON.parse(raw) as Partial<PersistedDirectoryPayload>;
    const v = data.v;
    if ((v !== SCHEMA_VERSION && v !== 1 && v !== 2) || !Array.isArray(data.products)) {
      return { products: null, directoryCollections: null, externalSearchMeta: null };
    }
    const meta =
      (v === 2 || v === SCHEMA_VERSION) && data.externalSearchMeta && typeof data.externalSearchMeta === "object"
        ? (data.externalSearchMeta as Record<string, DirectoryExternalSearchMeta>)
        : {};
    const productsRaw = data.products as unknown[];
    const products = productsRaw.map((row) => migrateDirectoryProductJson(row));
    return {
      products,
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
    localStorage.setItem(DIRECTORY_CATALOG_LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedDirectory(): void {
  try {
    localStorage.removeItem(DIRECTORY_CATALOG_LOCAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { mergeDirectoryProductPatchInCatalog } from "@/lib/directoryProductMerge";

export function cloneDirectoryProductsForState(products: DirectoryProduct[]): DirectoryProduct[] {
  return products.map((p) => ({
    ...p,
    types: [...p.types],
    collectionIds: [...p.collectionIds],
    collections: [...p.collections],
    partnerPrograms: p.partnerPrograms.map((pp) => ({
      ...pp,
      activePromotions: (pp.activePromotions ?? []).map((x) => ({ ...x })),
      amenityTags: pp.amenityTags ? [...pp.amenityTags] : [],
    })),
    repFirmLinks: (p.repFirmLinks ?? []).map((l) => ({ ...l })),
    commissionAdvisories: p.commissionAdvisories?.map((a) => ({ ...a })),
  }));
}

export function cloneDirectoryCollectionsForState(collections: DirectoryCollectionOption[]): DirectoryCollectionOption[] {
  return collections.map((c) => ({
    ...c,
    productIds: c.productIds ? [...c.productIds] : undefined,
  }));
}
