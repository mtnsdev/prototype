/**
 * ProductDirectoryDetailPanel — Summary view shown as sidebar in product directory
 *
 * This is a PREVIEW/SUMMARY view of a DirectoryProduct, shown as a right sidebar.
 * It is intentionally simpler than the full detail page.
 *
 * For the full detail view, users should:
 * - Click the "View full detail →" link at the bottom of this panel
 * - Which navigates to /dashboard/products/[id]
 *
 * Architecture pattern:
 * - This sidebar = preview of product
 * - ProductDetailPage (at /dashboard/products/[id]) = full canonical view
 * - The sidebar footer includes explicit navigation to the full view
 */

"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import type { RepFirm } from "@/types/rep-firm";
import type { Team } from "@/types/teams";
import Link from "next/link";
import { ProductDirectoryDetailBody } from "./ProductDirectoryDetailBody";

type Props = {
  /** Distance from viewport top to start the dim + sidebar (below catalog chrome). */
  backdropTopPx?: number;
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
  /** When true, inline partner-program editing is disabled (registry is source of truth). */
  partnerProgramsManagedInRegistry?: boolean;
};

export default function ProductDirectoryDetailPanel({
  backdropTopPx = 0,
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
  partnerProgramsManagedInRegistry,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => setMounted(true), []);

  const top = Math.max(0, backdropTopPx);

  /** Portal to body so no dashboard `overflow` / stacking context can sit above catalog tabs. */
  const node = (
    <>
      <button
        type="button"
        className="fixed right-0 bottom-0 left-0 z-[80] cursor-default bg-black/40"
        style={{ top }}
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 bottom-0 z-[90] flex w-full max-w-[420px] flex-col overflow-hidden border-l border-border bg-inset shadow-2xl animate-in slide-in-from-right duration-200 ease-out"
        style={{ top }}
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
            repFirmsRegistry={repFirmsRegistry}
            partnerProgramsManagedInRegistry={partnerProgramsManagedInRegistry}
          />
        </div>
        {/* Footer: Link to full detail view */}
        <div className="border-t border-border bg-background/50 p-3">
          <Link
            href={`/dashboard/products/${product.id}`}
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors"
          >
            View full detail
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>
    </>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
