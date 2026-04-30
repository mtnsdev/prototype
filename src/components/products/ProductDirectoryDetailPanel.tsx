/**
 * ProductDirectoryDetailPanel — Directory product preview: centered dialog (narrow screens)
 * or split-pane chrome (lg+ beside the catalog). Full detail: /dashboard/products/[id]
 */

"use client";

import { useRef, useState } from "react";
import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import type { RepFirm } from "@/types/rep-firm";
import type { Team } from "@/types/teams";
import Link from "next/link";
import { Bookmark, CalendarPlus, ExternalLink, Pencil, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ProductDirectoryDetailBody,
  type ProductDirectoryDetailBodyRef,
} from "./ProductDirectoryDetailBody";
import { cn } from "@/lib/utils";

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
  /** `split` = inline pane beside the catalog (desktop); `dialog` = overlay modal */
  variant?: "dialog" | "split";
};

function DetailFooterLink({
  productId,
  onNavigate,
}: {
  productId: string;
  onNavigate: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-card p-3">
      <Link
        href={`/dashboard/products/${productId}`}
        onClick={onNavigate}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Open full page
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

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
  variant = "dialog",
}: Props) {
  const split = variant === "split";
  const bodyRef = useRef<ProductDirectoryDetailBodyRef>(null);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);

  const body = (
    <ProductDirectoryDetailBody
      ref={bodyRef}
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
      panelLayout={split}
      onPanelCollectionPickerOpenChange={split ? setCollectionPickerOpen : undefined}
    />
  );

  if (split) {
    return (
      <div
        className="flex h-full min-h-0 w-full flex-col bg-muted/30"
        role="region"
        aria-label={`Product: ${product.name}`}
      >
        <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-card px-3 py-2.5 shadow-[0_1px_0_0_rgba(28,26,22,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Catalog preview
          </p>
          <div className="flex items-start gap-2">
            <h2 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground">
              {product.name}
            </h2>
            <div className="flex shrink-0 items-center gap-0.5">
              {isAdmin ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Edit product details"
                  onClick={() => bodyRef.current?.openDirectoryRecordEditor()}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Add to itinerary"
                onClick={onAddToItinerary}
              >
                <CalendarPlus className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                  collectionPickerOpen && "bg-muted text-foreground"
                )}
                aria-label="Add to collection"
                onClick={() => bodyRef.current?.toggleCollectionPicker()}
              >
                <Bookmark className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" asChild>
                <Link href={`/dashboard/products/${product.id}`} onClick={onClose} aria-label="Open full page">
                  <ExternalLink className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close product panel"
                onClick={onClose}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto overscroll-x-contain bg-background">
          {body}
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,920px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto overscroll-x-contain">{body}</div>
        <DetailFooterLink productId={product.id} onNavigate={onClose} />
      </DialogContent>
    </Dialog>
  );
}
