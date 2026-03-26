"use client";

import { useCallback, useRef } from "react";
import { Check, Clock, Plus, Sparkles } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { directoryCategoryColors, directoryCategoryLabel } from "./productDirectoryVisual";
import {
  getTopBookableProgramByCommission,
  isProgramBookable,
  productHasDistinctPartnerTerms,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";
import { DIRECTORY_TIER_FILTER_UI } from "./productDirectoryFilterConfig";
import { relativeTime } from "./productDirectoryRelativeTime";

type Props = {
  product: DirectoryProduct;
  canViewCommissions: boolean;
  bookmarked: boolean;
  onProductClick: () => void;
  onAddToCollectionClick: (e: React.MouseEvent) => void;
  showRemoveFromCollection?: boolean;
  onRemoveFromCollection?: () => void;
  bulkMode?: boolean;
  bulkSelected?: boolean;
  onToggleBulkSelect?: () => void;
  onEnterBulkMode?: (productId: string) => void;
};

export default function DirectoryProductCard({
  product,
  canViewCommissions,
  bookmarked,
  onProductClick,
  onAddToCollectionClick,
  showRemoveFromCollection,
  onRemoveFromCollection,
  bulkMode = false,
  bulkSelected = false,
  onToggleBulkSelect,
  onEnterBulkMode,
}: Props) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextClickRef = useRef(false);
  const activePrograms = product.partnerPrograms.filter(isProgramBookable);
  const topForCommission = getTopBookableProgramByCommission(product);
  const topRate = topForCommission ? programDisplayCommissionRate(topForCommission) : null;
  const cat = directoryCategoryColors(product.type);
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : product.location;
  const tierUi = DIRECTORY_TIER_FILTER_UI.find((t) => t.id === (product.tier ?? "unrated"));
  const tierStarCount = tierUi?.stars ?? 0;
  const tierStarColor = tierUi?.color ?? "#4A4540";
  const showVariedTerms = productHasDistinctPartnerTerms(product);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = () => {
    if (!onEnterBulkMode || bulkMode) return;
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      ignoreNextClickRef.current = true;
      onEnterBulkMode(product.id);
    }, 550);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onProductClick();
        }
      }}
      onContextMenu={(e) => {
        if (!onEnterBulkMode || bulkMode) return;
        e.preventDefault();
        ignoreNextClickRef.current = true;
        onEnterBulkMode(product.id);
      }}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border transition-all",
        bulkSelected
          ? "border-[rgba(201,169,110,0.30)] ring-1 ring-[rgba(201,169,110,0.15)] bg-white/[0.02]"
          : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]"
      )}
      onClick={() => {
        if (ignoreNextClickRef.current) {
          ignoreNextClickRef.current = false;
          return;
        }
        onProductClick();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
    >
      <div className="relative h-[140px] w-full shrink-0 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c]/60 via-transparent to-transparent" />

        {bulkMode && onToggleBulkSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBulkSelect();
            }}
            className={cn(
              "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all",
              bulkSelected
                ? "border-[#C9A96E] bg-[#C9A96E]"
                : "border-white/20 bg-black/30 backdrop-blur-sm hover:border-white/40"
            )}
            aria-label={bulkSelected ? "Deselect" : "Select"}
          >
            {bulkSelected ? <Check className="h-3 w-3 text-[#08080c]" strokeWidth={3} /> : null}
          </button>
        )}

        <span
          className="absolute bottom-2 left-2 rounded-full border px-2 py-0.5 text-[9px] backdrop-blur-sm"
          style={{
            background: cat.bg,
            color: cat.color,
            borderColor: cat.border,
          }}
        >
          {directoryCategoryLabel(product.type)}
        </span>

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {product.hasTeamData && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "rgba(140,160,180,0.70)" }}
              title="Team data available"
            />
          )}
          {product.hasAdvisorNotes && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "rgba(160,140,180,0.70)" }}
              title="You have personal notes"
            />
          )}
        </div>

        <button
          type="button"
          title="Add to collection"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCollectionClick(e);
          }}
          className={cn(
            "absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/50 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40",
            bookmarked ? "text-[#C9A96E] opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
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
            <p className="mt-0.5 text-[11px] text-[#9B9590]">
              {placeLine}
              {product.priceTier ? (
                <span className="ml-1.5 text-[10px] text-[#6B6560]">{product.priceTier}</span>
              ) : null}
            </p>
          </div>
          {showRemoveFromCollection && onRemoveFromCollection && (
            <button
              type="button"
              className="shrink-0 text-[9px] text-[#6B6560] transition-colors hover:text-[#C9A96E]"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCollection();
              }}
            >
              Remove
            </button>
          )}
        </div>

        {activePrograms.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {activePrograms.slice(0, 3).map((pp) => (
              <span
                key={pp.id}
                className="rounded-full border px-1.5 py-0.5 text-[8px]"
                style={{
                  background: "rgba(201,169,110,0.06)",
                  borderColor: "rgba(201,169,110,0.12)",
                  color: "#B8976E",
                }}
              >
                {programDisplayName(pp)}
              </span>
            ))}
            {activePrograms.length > 3 && (
              <span className="self-center text-[8px] text-[#6B6560]">+{activePrograms.length - 3}</span>
            )}
            {showVariedTerms ? (
              <span className="text-[8px] font-medium text-[#A38F6E]">· custom terms</span>
            ) : null}
          </div>
        )}

        {product.updatedAt ? (
          <div className="mt-1 flex items-center justify-end gap-1">
            <Clock className="h-2.5 w-2.5 text-[#4A4540]" aria-hidden />
            <span className="text-[8px] text-[#4A4540]">Updated {relativeTime(product.updatedAt)}</span>
          </div>
        ) : null}

        {product.activePromotion && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.10)] bg-[rgba(201,169,110,0.06)] px-2 py-1.5">
            <Sparkles className="h-3 w-3 shrink-0 text-[#C9A96E]" aria-hidden />
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

        <div className="mt-auto min-h-[24px] border-t border-white/[0.04] pt-2 text-xs text-[#C9A96E]/80">
          {canViewCommissions && topForCommission != null && topRate != null ? (
            <span className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-[#B8976E]">{topRate}%</span>
              <span className="text-[9px] text-[#6B6560]">via {programDisplayName(topForCommission)}</span>
            </span>
          ) : !canViewCommissions && topForCommission != null && topRate != null ? (
            <span className="text-[9px] text-[#6B6560]">Partner rate on file</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
