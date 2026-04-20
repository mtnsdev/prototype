/**
 * ProductDirectoryDetailPanel — Summary view of a DirectoryProduct in a centered modal.
 *
 * This is a PREVIEW/SUMMARY view, intentionally simpler than the full detail page.
 *
 * For the full detail view, users should use the "View full detail →" link in the footer,
 * which navigates to /dashboard/products/[id]
 */

"use client";

import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import type { RepFirm } from "@/types/rep-firm";
import type { Team } from "@/types/teams";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  repFirmsRegistry?: RepFirm[] | null;
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
  repFirmsRegistry,
}: Props) {
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,920px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto overscroll-x-contain">
          <ProductDirectoryDetailBody
            product={product}
            canViewCommissions={canViewCommissions}
            isAdmin={isAdmin}
            teams={teams}
            showClose={false}
            onClose={onClose}
            onOpenCollectionPicker={onOpenCollectionPicker}
            onPatchProduct={onPatchProduct}
            onAddToItinerary={onAddToItinerary}
            canRemoveFromCollection={canRemoveFromCollection}
            availableCollections={availableCollections}
            onQuickAddToCollection={onQuickAddToCollection}
            onRequestCreateCollection={onRequestCreateCollection}
            partnerProgramCustomKeys={partnerProgramCustomKeys}
            repFirmsRegistry={repFirmsRegistry}
          />
        </div>
        <div className="shrink-0 border-t border-border bg-background/50 p-3">
          <Link
            href={`/dashboard/products/${product.id}`}
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
          >
            View full detail
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
