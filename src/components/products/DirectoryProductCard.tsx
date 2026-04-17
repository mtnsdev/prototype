"use client";

import { useCallback, useMemo, useRef } from "react";
import { Check, Flame, Plus, Search, Users } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { getPrimaryDirectoryType } from "@/components/products/directoryProductTypeHelpers";
import {
  directoryCategoryColors,
  directoryCategoryLabel,
  directoryProductPriceDisplay,
} from "./productDirectoryVisual";
import {
  getActiveIncentiveOfferCount,
  getDirectoryProductRegistryCommission,
  getTopBookableProgramByCommission,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";
import { DIRECTORY_TIER_FILTER_UI } from "./productDirectoryFilterConfig";
import { productListingMetaLineClass, productListingTitleClass } from "@/lib/productListingPrimitives";
import { formatProductOpeningLine } from "@/lib/productDirectoryOpening";

function repFirmLinksTitle(product: DirectoryProduct): string | undefined {
  const links = product.repFirmLinks ?? [];
  if (links.length <= 1) return undefined;
  return links.map((l) => l.repFirmName?.trim() || l.repFirmId).join(" · ");
}

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
  /** Smaller image + padding for dense lists (e.g. rep firm linked properties). */
  compact?: boolean;
  /** When false, rep firm chips are hidden (e.g. main Products browse — detail tab still has full info). */
  showRepFirmLinks?: boolean;
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
  compact = false,
  showRepFirmLinks = true,
}: Props) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextClickRef = useRef(false);
  const topForCommission = getTopBookableProgramByCommission(product);
  const rateFromTopProgram = topForCommission ? programDisplayCommissionRate(topForCommission) : null;
  /** Prefer program rate; else registry max from bookable programs; else product-level listing (helps DMCs / sparse program data). */
  const cardCommission =
    rateFromTopProgram ??
    getDirectoryProductRegistryCommission(product) ??
    product.commissionRate ??
    product.baseCommissionRate;
  const commissionIsFlat =
    rateFromTopProgram != null && topForCommission?.commissionType === "flat";
  const primaryType = getPrimaryDirectoryType(product);
  const cat = directoryCategoryColors(primaryType);
  const typePillLabel =
    directoryCategoryLabel(primaryType) + (product.types.length > 1 ? ` +${product.types.length - 1}` : "");
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : product.location;
  const tierUi = DIRECTORY_TIER_FILTER_UI.find((t) => t.id === (product.tier ?? "unrated"));
  const tierStarCount = tierUi?.stars ?? 0;
  const tierStarColor = tierUi?.color ?? "#4A4540";
  const activeIncentiveOfferCount = getActiveIncentiveOfferCount(product);

  const openingLine = useMemo(() => formatProductOpeningLine(product), [product]);
  const priceDisplayLine = useMemo(() => directoryProductPriceDisplay(product), [product]);

  const repFirmLinks = product.repFirmLinks ?? [];
  const repFirmTitle = useMemo(() => repFirmLinksTitle(product), [product]);

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
              {priceDisplayLine ? (
                <span className="ml-1.5 text-2xs text-muted-foreground">{priceDisplayLine}</span>
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

        <div className="mt-auto flex min-h-0 flex-col">
          {showRepFirmLinks && repFirmLinks.length > 0 ? (
            <div
              className={cn("flex min-w-0 flex-wrap gap-1", compact ? "mb-1" : "mb-1.5")}
              title={repFirmTitle}
            >
              {repFirmLinks.map((link) => {
                const label = link.repFirmName?.trim() || link.repFirmId;
                return (
                  <span
                    key={link.id}
                    className={cn(
                      "inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-full border",
                      compact ? "px-1.5 py-px text-[7px]" : "px-1.5 py-0.5 text-[8px]"
                    )}
                    style={{
                      background: "rgba(176, 122, 91, 0.08)",
                      borderColor: "rgba(176, 122, 91, 0.18)",
                      color: "#B07A5B",
                    }}
                  >
                    <Users className="h-2 w-2 shrink-0 opacity-90" aria-hidden />
                    <span className="min-w-0 truncate">{label}</span>
                  </span>
                );
              })}
            </div>
          ) : null}

          <div
            className={cn(
              "overflow-hidden border-t border-white/[0.04] text-brand-cta/80",
              compact
                ? "max-h-[2.25rem] border-white/[0.03] pt-1.5 text-[10px]"
                : "min-h-6 pt-2 text-xs"
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              {canViewCommissions && cardCommission != null ? (
                <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
                  <span
                    className="inline-flex items-center gap-0.5 text-2xs text-[#B8976E]"
                    title={
                      activeIncentiveOfferCount > 0
                        ? `${activeIncentiveOfferCount} active temporary incentive${activeIncentiveOfferCount !== 1 ? "s" : ""}`
                        : undefined
                    }
                  >
                    {activeIncentiveOfferCount > 0 ? (
                      <Flame className="h-2.5 w-2.5 shrink-0 text-[#c9a96e]/90" aria-hidden />
                    ) : null}
                    {commissionIsFlat ? `$${cardCommission}` : `${cardCommission}%`}{" "}
                    <span className="font-normal text-muted-foreground">base</span>
                  </span>
                  {rateFromTopProgram != null && topForCommission ? (
                    <span className="truncate text-[9px] text-muted-foreground">
                      via {programDisplayName(topForCommission)}
                    </span>
                  ) : (
                    <span className="truncate text-[9px] text-muted-foreground">Listed rate</span>
                  )}
                  {activeIncentiveOfferCount > 0 ? (
                    <span
                      className="text-[8px] text-muted-foreground"
                      title="Time-bound incentives apply separately; see product detail."
                    >
                      · {activeIncentiveOfferCount} temporary incentive
                      {activeIncentiveOfferCount !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </span>
              ) : null}
              {showSavedFromSearch ? (
                <span
                  className="group relative flex shrink-0 items-center gap-1 text-[9px] text-muted-foreground"
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
    </div>
  );
}
