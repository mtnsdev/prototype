"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Check,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { DirectoryAmenityTag, DirectoryCollectionOption, DirectoryProductCategory } from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { cn } from "@/lib/utils";
import ProductDirectoryLocationDropdown from "./ProductDirectoryLocationDropdown";
import ProductDirectoryAmenitiesDropdown from "./ProductDirectoryAmenitiesDropdown";
import ProductDirectoryProgramSearchDropdown from "./ProductDirectoryProgramSearchDropdown";
import ProductDirectoryRepFirmFilterDropdown from "./ProductDirectoryRepFirmFilterDropdown";
import type { RepFirmFilterOption } from "./ProductDirectoryRepFirmFilterDropdown";
import ProductDirectoryCollectionSearchDropdown from "./ProductDirectoryCollectionSearchDropdown";
import ProductDirectoryCommissionRangeDropdown from "./ProductDirectoryCommissionRangeDropdown";
import ProductDirectoryTierDropdown from "./ProductDirectoryTierDropdown";
import ProductDirectoryPriceFilterDropdown from "./ProductDirectoryPriceFilterDropdown";
import { FilterPill } from "@/components/products/toolbar/FilterPill";
import { ResultsToolbar } from "@/components/products/toolbar/ResultsToolbar";
import {
  DEFAULT_DIRECTORY_PRODUCT_SORT,
  DIRECTORY_PRODUCT_SORT_OPTIONS,
  type DirectoryProductSortOption,
} from "./productDirectoryFilterConfig";

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  activeTypeFilters: DirectoryProductCategory[];
  onToggleTypeFilter: (id: DirectoryProductCategory) => void;
  onClearTypeFilters: () => void;
  locationCountries: string[];
  onLocationCountriesChange: (v: string[]) => void;
  collectionFilter: string[];
  onCollectionFilterChange: (v: string[]) => void;
  onAddProduct: () => void;
  collections: DirectoryCollectionOption[];
  selectedProgramIds: string[];
  onSelectedProgramIdsChange: (v: string[]) => void;
  repFirmFilterOptions: RepFirmFilterOption[];
  selectedRepFirmIds: string[];
  onSelectedRepFirmIdsChange: (v: string[]) => void;
  selectedAmenities: DirectoryAmenityTag[];
  onSelectedAmenitiesChange: (v: DirectoryAmenityTag[]) => void;
  commissionRange: [number, number];
  onCommissionRangeChange: (r: [number, number]) => void;
  commissionFilterActive: boolean;
  onCommissionFilterActiveChange: (v: boolean) => void;
  hasActiveIncentive: boolean;
  onHasActiveIncentiveChange: (v: boolean) => void;
  hasPlannedOpening: boolean;
  onHasPlannedOpeningChange: (v: boolean) => void;
  sortByCommission: boolean;
  onSortByCommissionChange: (v: boolean) => void;
  selectedTiers: DirectoryTierLevel[];
  onSelectedTiersChange: (v: DirectoryTierLevel[]) => void;
  selectedPriceTiers: DirectoryPriceTier[];
  onSelectedPriceTiersChange: (v: DirectoryPriceTier[]) => void;
  sortBy: DirectoryProductSortOption;
  onSortByChange: (v: DirectoryProductSortOption) => void;
  canViewCommissions: boolean;
  resultCount: number;
  viewMode: "grid" | "list" | "map";
  onViewModeChange: (v: "grid" | "list" | "map") => void;
  bulkMode: boolean;
  bulkSelectedCount: number;
  onBulkModeToggle: () => void;
  onClearFacetFilters: () => void;
  onClearAllFilters: () => void;
};

/** Thin 0.5px vertical divider, matching the design-system reference. */
function PillDivider() {
  return (
    <span
      aria-hidden
      className="mx-1 h-5 shrink-0 self-center bg-[color:var(--border-subtle)]"
      style={{ width: "0.5px" }}
    />
  );
}

export default function ProductDirectoryFilterBar(props: Props) {
  const {
    searchQuery,
    onSearchQueryChange,
    locationCountries,
    onLocationCountriesChange,
    collectionFilter,
    onCollectionFilterChange,
    collections,
    selectedProgramIds,
    onSelectedProgramIdsChange,
    repFirmFilterOptions,
    selectedRepFirmIds,
    onSelectedRepFirmIdsChange,
    selectedAmenities,
    onSelectedAmenitiesChange,
    commissionRange,
    onCommissionRangeChange,
    commissionFilterActive,
    onCommissionFilterActiveChange,
    hasActiveIncentive,
    onHasActiveIncentiveChange,
    sortByCommission,
    onSortByCommissionChange,
    selectedTiers,
    onSelectedTiersChange,
    selectedPriceTiers,
    onSelectedPriceTiersChange,
    sortBy,
    onSortByChange,
    canViewCommissions,
    resultCount,
    viewMode,
    onViewModeChange,
    bulkMode,
    onBulkModeToggle,
  } = props;

  // The following props live on row 1 (CategoryStrip — rendered at the page
  // level) or are no-ops in this layout. They are kept on `Props` so the
  // ProductDirectoryPage call site does not need to change.
  void props.activeTypeFilters;
  void props.onToggleTypeFilter;
  void props.onClearTypeFilters;
  void props.onAddProduct;
  void props.hasPlannedOpening;
  void props.onHasPlannedOpeningChange;
  void props.bulkSelectedCount;
  void props.onClearFacetFilters;
  void props.onClearAllFilters;

  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  // Outside-click + Escape close for the inline Sort menu.
  useEffect(() => {
    if (!sortOpen) return;
    const onClick = (e: MouseEvent) => {
      const el = sortWrapRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortOpen]);

  // Count of secondary filters that are currently active — drives the
  // More-filters pill's badge.
  const moreFiltersActiveCount = useMemo(() => {
    let n = 0;
    if (selectedRepFirmIds.length > 0) n++;
    if (selectedAmenities.length > 0) n++;
    if (canViewCommissions && commissionFilterActive) n++;
    if (selectedPriceTiers.length > 0) n++;
    if (sortByCommission) n++;
    return n;
  }, [
    selectedRepFirmIds.length,
    selectedAmenities.length,
    canViewCommissions,
    commissionFilterActive,
    selectedPriceTiers.length,
    sortByCommission,
  ]);

  const sortLabel =
    DIRECTORY_PRODUCT_SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Name A → Z";
  const sortIsCustom = sortBy !== DEFAULT_DIRECTORY_PRODUCT_SORT;

  return (
    <div className="mb-4 space-y-3 border-b border-[color:var(--border-subtle)] pb-4">
      {/* Row 2 — search + primary filter pills + More-filters trigger. */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search input — 240px, pill-shaped, moss focus ring. */}
        <div className="relative w-[240px] shrink-0">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--chrome-icon-muted)]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className={cn(
              "h-8 w-full rounded-full border border-[color:var(--border-default)] bg-[color:var(--surface-card)]",
              "pl-9 pr-9 text-[12px] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)]",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-cta)] focus:border-transparent"
            )}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--chrome-icon-muted)] transition-colors hover:bg-[color:var(--surface-interactive)] hover:text-[color:var(--text-secondary)]"
            >
              <X size={12} aria-hidden />
            </button>
          ) : null}
        </div>

        <PillDivider />

        {/* Sort — uses FilterPill + custom dropdown (no existing dropdown for sort). */}
        <div ref={sortWrapRef} className="relative">
          <FilterPill
            label="Sort"
            value={sortLabel}
            icon={ArrowDownUp}
            active={sortIsCustom}
            open={sortOpen}
            onClick={() => setSortOpen((o) => !o)}
          />
          {sortOpen ? (
            <div
              className="absolute left-0 top-full z-[80] mt-1 w-[min(100vw-2rem,240px)] overflow-hidden rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface-card)] py-1 text-[color:var(--text-primary)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {DIRECTORY_PRODUCT_SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSortByChange(option.id);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-[12px] transition-colors hover:bg-[color:var(--surface-interactive)]",
                    sortBy === option.id
                      ? "text-[color:var(--brand-primary)]"
                      : "text-[color:var(--text-secondary)]"
                  )}
                >
                  {option.label}
                  {sortBy === option.id ? (
                    <Check size={12} className="text-[color:var(--brand-primary)]" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Location — existing dropdown; renders its own pill-shaped trigger w/ value summary. */}
        <ProductDirectoryLocationDropdown
          selectedCountries={locationCountries}
          onChange={onLocationCountriesChange}
        />

        {/* Collection */}
        <ProductDirectoryCollectionSearchDropdown
          collections={collections}
          selectedIds={collectionFilter}
          onChange={onCollectionFilterChange}
        />

        {/* Program */}
        <ProductDirectoryProgramSearchDropdown
          selectedProgramIds={selectedProgramIds}
          onChange={onSelectedProgramIdsChange}
        />

        {/* Tier */}
        <ProductDirectoryTierDropdown
          selectedTiers={selectedTiers}
          onChange={onSelectedTiersChange}
        />

        {/* Active incentives — boolean toggle pill. */}
        <FilterPill
          label="Active incentives"
          toggle
          toggleOn={hasActiveIncentive}
          onToggle={onHasActiveIncentiveChange}
        />

        {/* More filters — far right; opens row 2.5. */}
        <div className="ml-auto flex items-center gap-2">
          <PillDivider />
          <FilterPill
            label="More filters"
            icon={SlidersHorizontal}
            value={moreFiltersActiveCount > 0 ? String(moreFiltersActiveCount) : undefined}
            active={moreFiltersActiveCount > 0}
            open={moreOpen}
            onClick={() => setMoreOpen((o) => !o)}
          />
        </div>
      </div>

      {/* Row 2.5 — secondary filters (only when "More filters" is expanded). */}
      {moreOpen ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(58,89,56,0.15)] bg-[rgba(58,89,56,0.04)] px-3 py-2">
          <ProductDirectoryRepFirmFilterDropdown
            repFirms={repFirmFilterOptions}
            selectedRepFirmIds={selectedRepFirmIds}
            onChange={onSelectedRepFirmIdsChange}
          />

          <ProductDirectoryAmenitiesDropdown
            selected={selectedAmenities}
            onChange={onSelectedAmenitiesChange}
          />

          {canViewCommissions ? (
            <ProductDirectoryCommissionRangeDropdown
              commissionRange={commissionRange}
              onCommissionRangeChange={onCommissionRangeChange}
              commissionFilterActive={commissionFilterActive}
              onCommissionFilterActiveChange={onCommissionFilterActiveChange}
              sortByCommission={sortByCommission}
              onSortByCommissionChange={onSortByCommissionChange}
            />
          ) : null}

          <ProductDirectoryPriceFilterDropdown
            selectedPriceTiers={selectedPriceTiers}
            onChange={onSelectedPriceTiersChange}
          />

          {canViewCommissions ? (
            <FilterPill
              label="Sort by commission"
              toggle
              toggleOn={sortByCommission}
              onToggle={onSortByCommissionChange}
            />
          ) : null}
        </div>
      ) : null}

      {/* Row 3 — count + Select toggle + Grid/List/Map. */}
      <ResultsToolbar
        count={resultCount}
        view={viewMode}
        onViewChange={onViewModeChange}
        selectMode={bulkMode}
        onSelectModeToggle={onBulkModeToggle}
      />
    </div>
  );
}
