"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import { useUser } from "@/contexts/UserContext";
import { applyAddProductToExternalSearch } from "./productDirectoryExternalSearch";
import { mergeDirectoryProductPatchInCatalog } from "@/lib/directoryProductMerge";
import {
  cloneDirectoryCollectionsForState,
  clearPersistedDirectory,
  DIRECTORY_CATALOG_LOCAL_STORAGE_KEY,
  persistDirectorySnapshot,
} from "./productDirectoryPersistence";
import { resolveAdvisorCatalogFromStorage } from "./productDirectoryCatalogResolve";

type ProductDirectoryCatalogContextValue = {
  /** Incremented after a successful cross-surface catalog write so the directory UI can resync from storage. */
  catalogRevision: number;
  /** Clears `enable-product-directory-v1` and bumps revision so the directory reloads from mock seed. */
  clearPersistedCatalogSnapshot: () => void;
  /**
   * Adds a directory product to the signed-in advisor’s External Search system collection and persists.
   * Returns whether the update was applied (false if product missing, collection not owned, etc.).
   */
  addProductToExternalSearch: (
    productId: string,
    options?: { searchQuery?: string; sourceConversationId?: number }
  ) => boolean;
  /**
   * Merges a patch into one product in the persisted catalog (same snapshot as the directory browse page).
   * Use `replaceCollections` when collection membership rows change so `productIds` stay in sync.
   */
  patchPersistedDirectory: (
    productId: string,
    patch: Partial<DirectoryProduct>,
    options?: { replaceCollections?: DirectoryCollectionOption[] }
  ) => boolean;
};

const ProductDirectoryCatalogContext = createContext<ProductDirectoryCatalogContextValue | null>(null);

export function ProductDirectoryCatalogProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const [catalogRevision, setCatalogRevision] = useState(0);

  /** Another tab wrote the same localStorage key — resync browse/detail from storage. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DIRECTORY_CATALOG_LOCAL_STORAGE_KEY || e.newValue == null) return;
      setCatalogRevision((r) => r + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addProductToExternalSearch = useCallback(
    (productId: string, options?: { searchQuery?: string; sourceConversationId?: number }) => {
      if (userLoading || !user) return false;
      const advisorUid = String(user.id);
      const advisorName = user.username?.trim() || user.email?.split("@")[0] || "You";
      const { products, directoryCollections, externalSearchMeta } = resolveAdvisorCatalogFromStorage(
        advisorUid,
        advisorName
      );
      const result = applyAddProductToExternalSearch({
        productId,
        advisorUserId: advisorUid,
        products,
        directoryCollections,
      });
      if (!result) return false;
      const savedBy = user.username?.trim() || user.email?.split("@")[0] || "You";
      const nextMeta = {
        ...externalSearchMeta,
        [productId]: {
          savedAt: new Date().toISOString(),
          savedBy,
          searchQuery: options?.searchQuery,
          sourceConversation: options?.sourceConversationId,
        },
      };
      persistDirectorySnapshot(result.nextProducts, result.nextCollections, nextMeta);
      setCatalogRevision((r) => r + 1);
      return true;
    },
    [user, userLoading]
  );

  const clearPersistedCatalogSnapshot = useCallback(() => {
    clearPersistedDirectory();
    setCatalogRevision((r) => r + 1);
  }, []);

  const patchPersistedDirectory = useCallback(
    (productId: string, patch: Partial<DirectoryProduct>, options?: { replaceCollections?: DirectoryCollectionOption[] }) => {
      if (userLoading || !user) return false;
      const advisorUid = String(user.id);
      const advisorName = user.username?.trim() || user.email?.split("@")[0] || "You";
      const { products, directoryCollections, externalSearchMeta } = resolveAdvisorCatalogFromStorage(
        advisorUid,
        advisorName
      );
      const nextProducts = mergeDirectoryProductPatchInCatalog(products, productId, patch);
      if (!nextProducts) return false;
      const cols = options?.replaceCollections
        ? cloneDirectoryCollectionsForState(options.replaceCollections)
        : directoryCollections;
      persistDirectorySnapshot(nextProducts, cols, externalSearchMeta);
      setCatalogRevision((r) => r + 1);
      return true;
    },
    [user, userLoading]
  );

  const value = useMemo(
    () => ({
      catalogRevision,
      clearPersistedCatalogSnapshot,
      addProductToExternalSearch,
      patchPersistedDirectory,
    }),
    [catalogRevision, clearPersistedCatalogSnapshot, addProductToExternalSearch, patchPersistedDirectory]
  );

  return (
    <ProductDirectoryCatalogContext.Provider value={value}>{children}</ProductDirectoryCatalogContext.Provider>
  );
}

export function useProductDirectoryCatalog(): ProductDirectoryCatalogContextValue {
  const ctx = useContext(ProductDirectoryCatalogContext);
  if (!ctx) {
    throw new Error("useProductDirectoryCatalog must be used within ProductDirectoryCatalogProvider");
  }
  return ctx;
}

export function useProductDirectoryCatalogOptional(): ProductDirectoryCatalogContextValue | null {
  return useContext(ProductDirectoryCatalogContext);
}
