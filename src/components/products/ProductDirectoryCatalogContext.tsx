"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useUser } from "@/contexts/UserContext";
import { applyAddProductToExternalSearch } from "./productDirectoryExternalSearch";
import { persistDirectorySnapshot } from "./productDirectoryPersistence";
import { resolveAdvisorCatalogFromStorage } from "./productDirectoryCatalogResolve";

type ProductDirectoryCatalogContextValue = {
  /** Incremented after a successful cross-surface catalog write so the directory UI can resync from storage. */
  catalogRevision: number;
  /**
   * Adds a directory product to the signed-in advisor’s External Search system collection and persists.
   * Returns whether the update was applied (false if product missing, collection not owned, etc.).
   */
  addProductToExternalSearch: (
    productId: string,
    options?: { searchQuery?: string; sourceConversationId?: number }
  ) => boolean;
};

const ProductDirectoryCatalogContext = createContext<ProductDirectoryCatalogContextValue | null>(null);

export function ProductDirectoryCatalogProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const [catalogRevision, setCatalogRevision] = useState(0);

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

  const value = useMemo(
    () => ({ catalogRevision, addProductToExternalSearch }),
    [catalogRevision, addProductToExternalSearch]
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
