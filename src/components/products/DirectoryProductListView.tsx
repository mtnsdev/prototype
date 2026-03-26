"use client";

import { useCallback, useRef } from "react";
import { Check, Clock, Plus, Sparkles } from "lucide-react";
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
import { relativeTime } from "./productDirectoryRelativeTime";

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
};

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
}: Props) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickProductIdRef = useRef<string | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  return (
    <div className="space-y-2">
      {products.map((product) => {
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
              "group flex cursor-pointer gap-3 rounded-xl border p-3 transition-all",
              bulkOn
                ? "border-[rgba(201,169,110,0.30)] ring-1 ring-[rgba(201,169,110,0.15)] bg-[rgba(255,255,255,0.02)]"
                : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] hover:border-[rgba(255,255,255,0.06)]"
            )}
          >
            <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg">
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
                    "absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all",
                    bulkOn
                      ? "border-[#C9A96E] bg-[#C9A96E]"
                      : "border-white/20 bg-black/30 backdrop-blur-sm hover:border-white/40"
                  )}
                  aria-label={bulkOn ? "Deselect" : "Select"}
                >
                  {bulkOn ? <Check className="h-3 w-3 text-[#08080c]" strokeWidth={3} /> : null}
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
                  "absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/50 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white",
                  bm ? "text-[#C9A96E] opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h3 className="truncate text-[13px] font-medium text-[#F5F0EB]">{product.name}</h3>
                    {tierStarCount > 0 ? (
                      <div className="flex shrink-0 gap-0.5">
                        {Array.from({ length: tierStarCount }, (_, i) => (
                          <span key={i} className="text-[7px]" style={{ color: tierStarColor }}>
                            ★
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[#9B9590]">
                    {directoryProductPlaceLabel(product)}
                    {product.priceTier ? (
                      <span className="ml-1.5 text-[10px] text-[#6B6560]">{product.priceTier}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {product.hasTeamData && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "rgba(140,160,180,0.60)" }}
                      title="Team data available"
                    />
                  )}
                  {product.hasAdvisorNotes && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "rgba(160,140,180,0.60)" }}
                      title="You have personal notes"
                    />
                  )}
                  {showRemoveFromCollection && onRemoveFromFilteredCollection && (
                    <button
                      type="button"
                      className="mr-1 text-[9px] text-[#6B6560] transition-colors hover:text-[#C9A96E]"
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
              <div className="mb-1.5">
                <ProductDirectoryCategoryBadge type={product.type} />
              </div>
              <p className="mb-2 line-clamp-1 text-[11px] text-[#4A4540]">{product.description}</p>
              {product.updatedAt ? (
                <div className="mb-2 flex items-center justify-end gap-1">
                  <Clock className="h-2.5 w-2.5 text-[#4A4540]" aria-hidden />
                  <span className="text-[8px] text-[#4A4540]">Updated {relativeTime(product.updatedAt)}</span>
                </div>
              ) : null}
              {product.activePromotion && (
                <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.10)] bg-[rgba(201,169,110,0.06)] px-2 py-1.5">
                  <Sparkles className="h-3 w-3 text-[#C9A96E]" />
                  {canViewCommissions ? (
                    <span className="text-[10px] text-[#C9A96E]">
                      {product.baseCommissionRate != null ? (
                        <>
                          <del className="opacity-50">{product.baseCommissionRate}%</del> {product.effectiveCommissionRate}%
                        </>
                      ) : (
                        <>{product.effectiveCommissionRate}%</>
                      )}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#C9A96E]">Active promotion</span>
                  )}
                  <span className="rounded-full bg-[rgba(201,169,110,0.15)] px-1.5 py-0.5 text-[8px] font-medium text-[#C9A96E]">
                    promo
                  </span>
                </div>
              )}
              {canViewCommissions && topProg != null && topRate != null && (
                <div className="flex flex-wrap items-center gap-1 border-t border-white/[0.03] pt-2 text-[10px]">
                  <span className="text-[#B8976E]">{topRate}%</span>
                  <span className="text-[9px] text-[#6B6560]">via {programDisplayName(topProg)}</span>
                </div>
              )}
              {!canViewCommissions && topProg != null && topRate != null && (
                <div className="border-t border-white/[0.03] pt-2 text-[9px] text-[#6B6560]">Partner rate on file</div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[#6B6560]">
                {canViewCommissions && topRate == null && <span>Unrated</span>}
                <span>{product.partnerProgramCount} programs</span>
                <span>{product.collectionCount} collections</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
