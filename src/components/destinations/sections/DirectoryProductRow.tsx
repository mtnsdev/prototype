"use client";

import { Plus, Search, Sparkles, Users } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { ProductDirectoryCategoryBadge } from "@/components/products/ProductDirectoryCategoryBadge";
import {
  dmcOperationalDataPresent,
  isDMCProduct,
} from "@/components/products/directoryProductTypeHelpers";
import {
  directoryHeroOrFallbackImageUrl,
  directoryProductPlaceLabel,
  directoryProductPriceDisplay,
} from "@/components/products/productDirectoryVisual";
import {
  getTopBookableProgramByCommission,
  programDisplayCommissionRate,
  programDisplayName,
} from "@/components/products/productDirectoryCommission";
import { DIRECTORY_TIER_FILTER_UI } from "@/components/products/productDirectoryFilterConfig";
import { listCardRowBaseClass } from "@/lib/list-ui";
import { formatProductOpeningLine } from "@/lib/productDirectoryOpening";

type Props = {
  product: DirectoryProduct;
  canViewCommissions?: boolean;
  onClick: () => void;
  /** Show the bookmark/add-to-collection button on the thumbnail. */
  bookmarked?: boolean;
  onAddToCollectionClick?: (e: React.MouseEvent) => void;
  /** Show the "Saved from search" badge when the product is in the External Search collection. */
  showSavedFromSearch?: boolean;
  savedFromSearchTitle?: string;
};

/**
 * Single non-virtualized directory-style product row.
 * Mirrors the Product Catalog row in {@link DirectoryProductListView} so destination
 * guides surface the same level of detail (team/notes dots, prog·lists summary, saved-from-search).
 */
export function DirectoryProductRow({
  product,
  canViewCommissions = true,
  onClick,
  bookmarked = false,
  onAddToCollectionClick,
  showSavedFromSearch = false,
  savedFromSearchTitle,
}: Props) {
  const topProg = getTopBookableProgramByCommission(product);
  const topRate = topProg != null ? programDisplayCommissionRate(topProg) : null;
  const tierUi = DIRECTORY_TIER_FILTER_UI.find((t) => t.id === (product.tier ?? "unrated"));
  const tierStarCount = tierUi?.stars ?? 0;
  const tierStarColor = tierUi?.color ?? "#4A4540";
  const openingLine = formatProductOpeningLine(product);
  const priceDisplayLine = directoryProductPriceDisplay(product);

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      className={cn(listCardRowBaseClass)}
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={directoryHeroOrFallbackImageUrl(product.id, product.imageUrl)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {onAddToCollectionClick ? (
          <button
            type="button"
            title="Add to collection"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCollectionClick(e);
            }}
            className={cn(
              "absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white/50 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white",
              bookmarked ? "text-brand-cta opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1">
              <h3 className="truncate text-sm font-medium leading-tight text-foreground">
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
            <p className="truncate text-2xs leading-tight text-muted-foreground">
              {directoryProductPlaceLabel(product)}
              {priceDisplayLine ? (
                <span className="ml-1 text-[9px] text-muted-foreground">{priceDisplayLine}</span>
              ) : null}
            </p>
            {openingLine ? (
              <p className="truncate text-[9px] font-medium text-[#C9A96E]/90">{openingLine}</p>
            ) : null}
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
          </div>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <ProductDirectoryCategoryBadge types={product.types} compact />
          {product.activeIncentive && (
            <span className="inline-flex items-center gap-0.5 rounded border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.06)] px-1 py-px text-[8px] text-brand-cta">
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
              {topRate}% <span className="text-muted-foreground">· {programDisplayName(topProg)}</span>
            </span>
          )}
          {canViewCommissions && topRate == null && (
            <span className="text-[8px] text-muted-foreground">Unrated</span>
          )}
          <span className="text-[8px] text-muted-foreground">
            {product.partnerProgramCount} prog · {product.collectionCount} lists
          </span>
          {product.repFirmCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[8px] text-[#B07A5B]/70">
              <Users className="h-2 w-2 shrink-0" aria-hidden />
              {product.repFirmCount} rep firm{product.repFirmCount !== 1 ? "s" : ""}
            </span>
          ) : null}
          {showSavedFromSearch ? (
            <span
              className="inline-flex items-center gap-0.5 text-[8px] text-muted-foreground"
              title={
                savedFromSearchTitle ??
                "Saved from chat or external search to your External Search collection."
              }
            >
              <Search className="h-2 w-2 shrink-0" aria-hidden />
              Search
            </span>
          ) : null}
          {isDMCProduct(product) && dmcOperationalDataPresent(product) ? (
            <span className="inline-flex rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-px text-[9px] text-[rgba(212,165,116,0.85)]">
              Operations on file
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
