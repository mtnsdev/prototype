"use client";

import { useCallback, useMemo, useRef } from "react";
import { Check, Clock, Flame, Plus, Search, Sparkles, Users } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import {
  dmcOperationalDataPresent,
  getPrimaryDirectoryType,
  isDMCProduct,
} from "@/components/products/directoryProductTypeHelpers";
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
import { productListingMetaLineClass, productListingTitleClass } from "@/lib/productListingPrimitives";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";
import { FAKE_VICS } from "@/components/vic/fakeData";
import { getVicsForProduct } from "@/lib/entityCrossLinks";
import { formatProductOpeningLine } from "@/lib/productDirectoryOpening";

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
  /** Product is in the External Search system collection. */
  showSavedFromSearch?: boolean;
  /** Native tooltip for “Saved from search” (e.g. saved-by + query). */
  savedFromSearchTitle?: string;
  vicProductCounts?: Map<string, number>;
  /** Smaller image + padding for dense lists (e.g. rep firm linked properties). */
  compact?: boolean;
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
  showSavedFromSearch = false,
  savedFromSearchTitle,
  vicProductCounts,
  compact = false,
}: Props) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextClickRef = useRef(false);
  const activePrograms = product.partnerPrograms.filter(isProgramBookable);
  const topForCommission = getTopBookableProgramByCommission(product);
  const topRate = topForCommission ? programDisplayCommissionRate(topForCommission) : null;
  const primaryType = getPrimaryDirectoryType(product);
  const cat = directoryCategoryColors(primaryType);
  const typePillLabel =
    directoryCategoryLabel(primaryType) + (product.types.length > 1 ? ` +${product.types.length - 1}` : "");
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : product.location;
  const tierUi = DIRECTORY_TIER_FILTER_UI.find((t) => t.id === (product.tier ?? "unrated"));
  const tierStarCount = tierUi?.stars ?? 0;
  const tierStarColor = tierUi?.color ?? "#4A4540";
  const showVariedTerms = productHasDistinctPartnerTerms(product);
  const vicCount = useMemo(() => {
    const cached = vicProductCounts?.get(product.id);
    if (cached != null) return cached;
    return getVicsForProduct(product.id, FAKE_VICS ?? [], FAKE_ITINERARIES ?? []).length;
  }, [product.id, vicProductCounts]);

  const openingLine = useMemo(() => formatProductOpeningLine(product), [product]);

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
      data-directory-product-id={product.id}
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
        compact && "rounded-lg",
        bulkSelected
          ? "border-[rgba(201,169,110,0.30)] ring-1 ring-[rgba(201,169,110,0.15)] bg-white/[0.02]"
          : "border-white/[0.04] bg-white/[0.02] hover:border-border hover:bg-white/[0.04]"
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
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden",
          compact ? "h-[88px]" : "h-[140px]"
        )}
      >
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
                ? "border-brand-cta bg-brand-cta"
                : "border-white/20 bg-black/30 backdrop-blur-sm hover:border-white/40"
            )}
            aria-label={bulkSelected ? "Deselect" : "Select"}
          >
            {bulkSelected ? <Check className="h-3 w-3 text-[#08080c]" strokeWidth={3} /> : null}
          </button>
        )}

        <span
          className={cn(
            "absolute left-2 rounded-full border backdrop-blur-sm",
            compact ? "bottom-1.5 px-1.5 py-px text-[8px]" : "bottom-2 px-2 py-0.5 text-[9px]"
          )}
          style={{
            background: cat.bg,
            color: cat.color,
            borderColor: cat.border,
          }}
        >
          {typePillLabel}
        </span>

        <div className={cn("absolute right-2 flex items-center gap-1", compact ? "top-1" : "top-2")}>
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
          {product.activeAdvisoryCount != null &&
          product.activeAdvisoryCount > 0 &&
          canViewCommissions ? (
            <div
              className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-400"
              title={`${product.activeAdvisoryCount} active incentive${product.activeAdvisoryCount !== 1 ? "s" : ""}`}
            >
              <Flame className="h-2.5 w-2.5" aria-hidden />
              {product.activeAdvisoryCount > 1 ? product.activeAdvisoryCount : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          title="Add to collection"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCollectionClick(e);
          }}
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-black/40 text-white/50 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40",
            compact ? "bottom-1 right-1 h-5 w-5" : "bottom-2 right-2 h-6 w-6",
            bookmarked ? "text-brand-cta opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Plus className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3")} strokeWidth={2.5} />
        </button>
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "p-2" : "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3
                className={cn(
                  productListingTitleClass,
                  compact && "text-xs leading-tight"
                )}
              >
                {product.name}
              </h3>
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
            <p className={productListingMetaLineClass}>
              {placeLine}
              {product.priceTier ? (
                <span className="ml-1.5 text-2xs text-muted-foreground">{product.priceTier}</span>
              ) : null}
            </p>
            {openingLine ? (
              <p className="mt-0.5 text-[9px] font-medium text-[#C9A96E]/90">{openingLine}</p>
            ) : null}
          </div>
          {showRemoveFromCollection && onRemoveFromCollection && (
            <button
              type="button"
              className="shrink-0 text-[9px] text-muted-foreground transition-colors hover:text-brand-cta"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromCollection();
              }}
            >
              Remove
            </button>
          )}
        </div>

        {activePrograms.length > 0 && !compact && (
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
              <span className="self-center text-[8px] text-muted-foreground">+{activePrograms.length - 3}</span>
            )}
            {showVariedTerms ? (
              <span className="text-[8px] font-medium text-[#A38F6E]">· custom terms</span>
            ) : null}
          </div>
        )}

        {product.repFirmCount > 0 ? (
          <div className={cn("flex items-center gap-1", compact ? "mt-0.5" : "mt-1")}>
            <Users
              className={cn("shrink-0 text-[#B07A5B]/60", compact ? "h-2 w-2" : "h-2.5 w-2.5")}
              aria-hidden
            />
            <span className={cn("text-[#B07A5B]/60", compact ? "text-[7px]" : "text-[8px]")}>
              {product.repFirmCount} rep firm{product.repFirmCount !== 1 ? "s" : ""}
            </span>
          </div>
        ) : null}

        {isDMCProduct(product) && dmcOperationalDataPresent(product) && !compact ? (
          <span className="mt-1.5 inline-flex w-fit rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-0.5 text-[11px] text-[rgba(212,165,116,0.85)]">
            Operations on file
          </span>
        ) : null}

        {product.updatedAt && !compact ? (
          <div className="mt-1 flex items-center justify-end gap-1">
            <Clock className="h-2.5 w-2.5 text-muted-foreground/65" aria-hidden />
            <span className="text-[8px] text-muted-foreground/65">Updated {relativeTime(product.updatedAt)}</span>
          </div>
        ) : null}

        {product.activePromotion && !compact && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.10)] bg-[rgba(201,169,110,0.06)] px-2 py-1.5">
            <Sparkles className="h-3 w-3 shrink-0 text-brand-cta" aria-hidden />
            {canViewCommissions ? (
              <span className="text-2xs text-brand-cta">
                {(() => {
                  const fmt = topForCommission?.commissionType === "flat" ? (v: number) => `$${v}` : (v: number) => `${v}%`;
                  return product.baseCommissionRate != null ? (
                    <>
                      <del className="opacity-50">{fmt(product.baseCommissionRate)}</del> {fmt(product.effectiveCommissionRate!)}
                    </>
                  ) : (
                    <>{fmt(product.effectiveCommissionRate!)}</>
                  );
                })()}
              </span>
            ) : (
              <span className="text-2xs text-brand-cta">Active promotion</span>
            )}
            <span className="rounded-full bg-[rgba(201,169,110,0.15)] px-1.5 py-0.5 text-[8px] font-medium text-brand-cta">
              promo
            </span>
          </div>
        )}

        <div
          className={cn(
            "mt-auto overflow-hidden border-t border-white/[0.04] text-brand-cta/80",
            compact
              ? "max-h-[2.25rem] border-white/[0.03] pt-1.5 text-[10px]"
              : "h-6 pt-2 text-xs"
          )}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
          {canViewCommissions && topForCommission != null && topRate != null ? (
            <span className="flex min-w-0 items-center gap-1">
              <span className="text-2xs text-[#B8976E]">
                {topForCommission.commissionType === "flat" ? `$${topRate}` : `${topRate}%`}
              </span>
              <span className="truncate text-[9px] text-muted-foreground">via {programDisplayName(topForCommission)}</span>
            </span>
          ) : null}
          {vicCount > 0 ? (
            <span className="ml-auto flex shrink-0 items-center gap-1 text-[9px] text-[#5C5852]/70">
              <Users className="h-2.5 w-2.5" aria-hidden />
              {vicCount} VIC{vicCount !== 1 ? "s" : ""}
            </span>
          ) : null}
          {showSavedFromSearch ? (
            <span
              className="group relative ml-auto flex shrink-0 items-center gap-1 text-[9px] text-muted-foreground"
              title={
                savedFromSearchTitle ??
                "Saved from chat or external search to your External Search collection."
              }
            >
              <Search className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span>Saved from search</span>
            </span>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
