"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useRef } from "react";
import { Check, Plus, Search, Sparkles } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { ProductDirectoryCategoryBadge } from "./ProductDirectoryCategoryBadge";
import { directoryProductPlaceLabel } from "./productDirectoryVisual";
import {
  getTopBookableProgramByCommission,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";
import { DIRECTORY_TIER_FILTER_UI } from "./productDirectoryFilterConfig";

type Props = {
  products: DirectoryProduct[];
  canViewCommissions: boolean;
  isBookmarked: (p: DirectoryProduct) => boolean;
  onRowClick: (p: DirectoryProduct) => void;
  onAddToCollectionClick: (p: DirectoryProduct, e: React.MouseEvent) => void;
  showRemoveFromCollection?: boolean;
  onRemoveFromFilteredCollection?: (productId: string) => void;
  bulkMode?: boolean;
  bulkSelectedIds?: Set<string>;
  onToggleBulkSelect?: (productId: string) => void;
  onEnterBulkMode?: (productId: string) => void;
  externalSearchCollectionId?: string;
  externalSearchTooltip?: (productId: string) => string | undefined;
  scrollToProductId?: string | null;
  /** Scroll container for virtualization (Product Directory browse column). */
  scrollParentRef: React.RefObject<HTMLDivElement | null>;
};

const ROW_ESTIMATE_PX = 68;

export default function DirectoryProductListView({
  products,
  canViewCommissions,
  isBookmarked,
  onRowClick,
  onAddToCollectionClick,
  showRemoveFromCollection,
  onRemoveFromFilteredCollection,
  bulkMode = false,
  bulkSelectedIds,
  onToggleBulkSelect,
  onEnterBulkMode,
  externalSearchCollectionId,
  externalSearchTooltip,
  scrollToProductId,
  scrollParentRef,
}: Props) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickProductIdRef = useRef<string | null>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ROW_ESTIMATE_PX,
    overscan: 12,
    measureElement: (el) => el.getBoundingClientRect().height,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useLayoutEffect(() => {
    if (!scrollToProductId) return;
    const idx = products.findIndex((p) => p.id === scrollToProductId);
    if (idx < 0) return;
    virtualizerRef.current.scrollToIndex(idx, { align: "auto" });
  }, [scrollToProductId, products]);

  const clearLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  return (
    <div
      className="w-full"
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const product = products[virtualRow.index]!;
        const bm = isBookmarked(product);
        const topProg = getTopBookableProgramByCommission(product);
        const topRate = topProg != null ? programDisplayCommissionRate(topProg) : null;
        const bulkOn = bulkSelectedIds?.has(product.id) ?? false;
        const tierUi = DIRECTORY_TIER_FILTER_UI.find((t) => t.id === (product.tier ?? "unrated"));
        const tierStarCount = tierUi?.stars ?? 0;
        const tierStarColor = tierUi?.color ?? "#4A4540";

        const onPointerDown = () => {
          if (!onEnterBulkMode || bulkMode) return;
          longPressRef.current = setTimeout(() => {
            longPressRef.current = null;
            ignoreClickProductIdRef.current = product.id;
            onEnterBulkMode(product.id);
          }, 550);
        };

        return (
          <div
            key={product.id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="pb-1"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              data-directory-product-id={product.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(product);
                }
              }}
              onClick={() => {
                if (ignoreClickProductIdRef.current === product.id) {
                  ignoreClickProductIdRef.current = null;
                  return;
                }
                onRowClick(product);
              }}
              onContextMenu={(e) => {
                if (!onEnterBulkMode || bulkMode) return;
                e.preventDefault();
                ignoreClickProductIdRef.current = product.id;
                onEnterBulkMode(product.id);
              }}
              onPointerDown={onPointerDown}
              onPointerUp={clearLongPress}
              onPointerLeave={clearLongPress}
              onPointerCancel={clearLongPress}
              className={cn(
                "group flex cursor-pointer gap-2 rounded-lg border px-2 py-1.5 transition-all",
                bulkOn
                  ? "border-[rgba(201,169,110,0.30)] ring-1 ring-[rgba(201,169,110,0.15)] bg-[rgba(255,255,255,0.02)]"
                  : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] hover:border-[rgba(255,255,255,0.06)]"
              )}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {bulkMode && onToggleBulkSelect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBulkSelect(product.id);
                    }}
                    className={cn(
                      "absolute left-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded border transition-all",
                      bulkOn
                        ? "border-[#C9A96E] bg-[#C9A96E]"
                        : "border-white/20 bg-black/40 backdrop-blur-sm hover:border-white/40"
                    )}
                    aria-label={bulkOn ? "Deselect" : "Select"}
                  >
                    {bulkOn ? <Check className="h-2.5 w-2.5 text-[#08080c]" strokeWidth={3} /> : null}
                  </button>
                )}
                <button
                  type="button"
                  title="Add to collection"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCollectionClick(product, e);
                  }}
                  className={cn(
                    "absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white/50 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white",
                    bm ? "text-[#C9A96E] opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1">
                      <h3 className="truncate text-[12px] font-medium leading-tight text-[#F5F0EB]">
                        {product.name}
                      </h3>
                      {tierStarCount > 0 ? (
                        <div className="flex shrink-0 gap-px">
                          {Array.from({ length: tierStarCount }, (_, i) => (
                            <span key={i} className="text-[6px] leading-none" style={{ color: tierStarColor }}>
                              ★
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] leading-tight text-[#9B9590]">
                      {directoryProductPlaceLabel(product)}
                      {product.priceTier ? (
                        <span className="ml-1 text-[9px] text-[#6B6560]">{product.priceTier}</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {product.hasTeamData && (
                      <span
                        className="h-1 w-1 shrink-0 rounded-full"
                        style={{ background: "rgba(140,160,180,0.60)" }}
                        title="Team data available"
                      />
                    )}
                    {product.hasAdvisorNotes && (
                      <span
                        className="h-1 w-1 shrink-0 rounded-full"
                        style={{ background: "rgba(160,140,180,0.60)" }}
                        title="You have personal notes"
                      />
                    )}
                    {showRemoveFromCollection && onRemoveFromFilteredCollection && (
                      <button
                        type="button"
                        className="text-[8px] text-[#6B6560] transition-colors hover:text-[#C9A96E]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromFilteredCollection(product.id);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <ProductDirectoryCategoryBadge type={product.type} compact />
                  {product.activePromotion && (
                    <span className="inline-flex items-center gap-0.5 rounded border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.06)] px-1 py-px text-[8px] text-[#C9A96E]">
                      <Sparkles className="h-2 w-2 shrink-0" />
                      {canViewCommissions ? (
                        <>
                          {product.baseCommissionRate != null ? (
                            <span>
                              <span className="opacity-50 line-through">{product.baseCommissionRate}%</span>{" "}
                              {product.effectiveCommissionRate}%
                            </span>
                          ) : (
                            <span>{product.effectiveCommissionRate}%</span>
                          )}
                        </>
                      ) : (
                        <span>Promo</span>
                      )}
                    </span>
                  )}
                  {canViewCommissions && topProg != null && topRate != null && (
                    <span className="text-[9px] text-[#B8976E]">
                      {topRate}% <span className="text-[#6B6560]">· {programDisplayName(topProg)}</span>
                    </span>
                  )}
                  {!canViewCommissions && topProg != null && topRate != null && (
                    <span className="text-[8px] text-[#6B6560]">Rate on file</span>
                  )}
                  {canViewCommissions && topRate == null && (
                    <span className="text-[8px] text-[#6B6560]">Unrated</span>
                  )}
                  <span className="text-[8px] text-[#6B6560]">
                    {product.partnerProgramCount} prog · {product.collectionCount} lists
                  </span>
                  {externalSearchCollectionId &&
                  product.collectionIds.includes(externalSearchCollectionId) ? (
                    <span
                      className="inline-flex items-center gap-0.5 text-[8px] text-[#6B6560]"
                      title={
                        externalSearchTooltip?.(product.id) ??
                        "Saved from chat or external search to your External Search collection."
                      }
                    >
                      <Search className="h-2 w-2 shrink-0" aria-hidden />
                      Search
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
