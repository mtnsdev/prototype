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

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DirectoryCollectionOption, DirectoryProduct } from "@/types/product-directory";
import type { RepFirm } from "@/types/rep-firm";
import type { Team } from "@/types/teams";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductDirectoryDetailBody } from "./ProductDirectoryDetailBody";

const PANEL_WIDTH_STORAGE_KEY = "enable-product-directory-detail-panel-width";
const DEFAULT_PANEL_WIDTH_PX = 420;
const MIN_PANEL_WIDTH_PX = 320;
const MAX_PANEL_WIDTH_PX = 720;

function clampPanelWidth(widthPx: number, viewportWidth: number): number {
  const cap = Math.min(MAX_PANEL_WIDTH_PX, Math.max(MIN_PANEL_WIDTH_PX, viewportWidth - 24));
  return Math.max(MIN_PANEL_WIDTH_PX, Math.min(cap, widthPx));
}

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
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [panelWidthPx, setPanelWidthPx] = useState(DEFAULT_PANEL_WIDTH_PX);
  const dragRef = useRef<{ startPointerX: number; startWidth: number } | null>(null);
  const latestWidthRef = useRef(panelWidthPx);
  latestWidthRef.current = panelWidthPx;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
      const n = raw ? Number.parseInt(raw, 10) : NaN;
      if (Number.isFinite(n)) {
        setPanelWidthPx(clampPanelWidth(n, window.innerWidth));
      }
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !mounted) return;
    const onResize = () => {
      setPanelWidthPx((w) => clampPanelWidth(w, window.innerWidth));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]);

  const persistWidth = useCallback((w: number) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(w));
    } catch {
      /* quota */
    }
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    if (typeof document !== "undefined") {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    }
  }, []);

  const onLostPointerCapture = useCallback(() => {
    if (dragRef.current) {
      persistWidth(latestWidthRef.current);
    }
    endDrag();
  }, [endDrag, persistWidth]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { startPointerX: e.clientX, startWidth: panelWidthPx };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [panelWidthPx],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { startPointerX, startWidth } = dragRef.current;
    const next = clampPanelWidth(startWidth + (startPointerX - e.clientX), window.innerWidth);
    latestWidthRef.current = next;
    setPanelWidthPx(next);
  }, []);

  const onResizePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current) {
        persistWidth(latestWidthRef.current);
      }
      endDrag();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [endDrag, persistWidth],
  );

  const onResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const delta = e.key === "ArrowLeft" ? 16 : -16;
      setPanelWidthPx((w) => {
        const next = clampPanelWidth(w + delta, window.innerWidth);
        latestWidthRef.current = next;
        persistWidth(next);
        return next;
      });
    },
    [persistWidth],
  );

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
        className={cn(
          "fixed right-0 bottom-0 z-[90] flex flex-col overflow-hidden border-l border-border bg-inset shadow-2xl animate-in slide-in-from-right duration-200 ease-out",
          "w-full max-w-none",
        )}
        style={{ top, width: `min(100vw, ${panelWidthPx}px)` }}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={MIN_PANEL_WIDTH_PX}
          aria-valuemax={MAX_PANEL_WIDTH_PX}
          aria-valuenow={Math.round(panelWidthPx)}
          aria-label="Resize product panel"
          tabIndex={0}
          className="absolute top-0 bottom-0 left-0 z-[95] w-3 -translate-x-1/2 cursor-ew-resize touch-none border-0 bg-transparent p-0 outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          onLostPointerCapture={onLostPointerCapture}
          onKeyDown={onResizeKeyDown}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto overscroll-x-contain">
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
