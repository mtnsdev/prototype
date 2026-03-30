"use client";

import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import type { Team } from "@/types/teams";
import { ProductDirectoryDetailBody } from "./ProductDirectoryDetailBody";

type Props = {
  product: DirectoryProduct;
  canViewCommissions: boolean;
  isAdmin: boolean;
  teams: Team[];
  onClose: () => void;
  onOpenCollectionPicker: () => void;
  onPatchProduct: (productId: string, patch: Partial<DirectoryProduct>) => void;
  onAddToItinerary: () => void;
  canRemoveFromCollection?: (collectionId: string) => boolean;
  availableCollections?: DirectoryCollectionOption[];
  onQuickAddToCollection?: (collectionId: string) => void;
  onRequestCreateCollection?: () => void;
  partnerProgramCustomKeys?: string[];
};

export default function ProductDirectoryDetailPanel({
  product,
  canViewCommissions,
  isAdmin,
  teams,
  onClose,
  onOpenCollectionPicker,
  onPatchProduct,
  onAddToItinerary,
  canRemoveFromCollection,
  availableCollections,
  onQuickAddToCollection,
  onRequestCreateCollection,
  partnerProgramCustomKeys,
}: Props) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 cursor-default bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[420px] flex-col overflow-hidden border-l border-border bg-inset shadow-2xl animate-in slide-in-from-right duration-200 ease-out"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <ProductDirectoryDetailBody
            product={product}
            canViewCommissions={canViewCommissions}
            isAdmin={isAdmin}
            teams={teams}
            showClose
            onClose={onClose}
            onOpenCollectionPicker={onOpenCollectionPicker}
            onPatchProduct={onPatchProduct}
            onAddToItinerary={onAddToItinerary}
            canRemoveFromCollection={canRemoveFromCollection}
            availableCollections={availableCollections}
            onQuickAddToCollection={onQuickAddToCollection}
            onRequestCreateCollection={onRequestCreateCollection}
            partnerProgramCustomKeys={partnerProgramCustomKeys}
          />
        </div>
      </aside>
    </>
  );
}
