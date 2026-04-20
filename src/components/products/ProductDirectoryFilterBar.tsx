"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  CheckSquare,
  ChevronDown,
  LayoutGrid,
  List,
  Map as MapIcon,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { DirectoryAmenityTag, DirectoryCollectionOption, DirectoryProductCategory } from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  catalogSearchFieldWrapperClass,
  catalogSearchInputClass,
} from "@/components/ui/page-search-field";
import ProductDirectoryLocationDropdown from "./ProductDirectoryLocationDropdown";
import ProductDirectoryAmenitiesDropdown from "./ProductDirectoryAmenitiesDropdown";
import ProductDirectoryProgramSearchDropdown from "./ProductDirectoryProgramSearchDropdown";
import ProductDirectoryRepFirmFilterDropdown from "./ProductDirectoryRepFirmFilterDropdown";
import type { RepFirmFilterOption } from "./ProductDirectoryRepFirmFilterDropdown";
import ProductDirectoryCollectionSearchDropdown from "./ProductDirectoryCollectionSearchDropdown";
import ProductDirectoryCommissionRangeDropdown from "./ProductDirectoryCommissionRangeDropdown";
import ProductDirectoryTierDropdown from "./ProductDirectoryTierDropdown";
import ProductDirectoryPriceFilterDropdown from "./ProductDirectoryPriceFilterDropdown";
import { ProductDirectoryFilterSwitch } from "./ProductDirectoryFilterSwitch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AGENCY_PROGRAM_OPTIONS,
  AMENITY_LABELS,
  DEFAULT_DIRECTORY_PRODUCT_SORT,
  DIRECTORY_PRODUCT_SORT_OPTIONS,
  DIRECTORY_TIER_FILTER_UI,
  type DirectoryProductSortOption,
} from "./productDirectoryFilterConfig";
import { DIRECTORY_PRODUCT_TYPE_CONFIG } from "./productDirectoryProductTypes";
import { directoryCategoryLabel } from "./productDirectoryVisual";

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

function filterSectionLabel(className?: string) {
  return cn(
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80",
    className
  );
}

/** Full-width triggers inside the filter sheet (dropdowns default to max-w-[220px] for the toolbar). */
const sheetDropdownStretch = "w-full min-w-0 [&_button]:max-w-none [&_button]:w-full";

export default function ProductDirectoryFilterBar({
  searchQuery,
  onSearchQueryChange,
  activeTypeFilters,
  onToggleTypeFilter,
  onClearTypeFilters,
  locationCountries,
  onLocationCountriesChange,
  collectionFilter,
  onCollectionFilterChange,
  onAddProduct,
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
  hasPlannedOpening,
  onHasPlannedOpeningChange,
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
  bulkSelectedCount,
  onBulkModeToggle,
  onClearFacetFilters,
  onClearAllFilters,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  const activeFacetCount = useMemo(() => {
    let n = 0;
    if (activeTypeFilters.length > 0) n += activeTypeFilters.length;
    if (locationCountries.length > 0) n++;
    if (collectionFilter.length > 0) n++;
    if (selectedProgramIds.length > 0) n++;
    if (selectedRepFirmIds.length > 0) n++;
    if (selectedAmenities.length > 0) n++;
    if (commissionFilterActive) n++;
    if (hasActiveIncentive) n++;
    if (hasPlannedOpening) n++;
    if (selectedTiers.length > 0) n++;
    if (selectedPriceTiers.length > 0) n++;
    if (sortByCommission) n++;
    return n;
  }, [
    activeTypeFilters.length,
    locationCountries.length,
    collectionFilter.length,
    selectedProgramIds.length,
    selectedRepFirmIds.length,
    selectedAmenities.length,
    commissionFilterActive,
    hasActiveIncentive,
    hasPlannedOpening,
    selectedTiers.length,
    selectedPriceTiers.length,
    sortByCommission,
  ]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!sortOpen) return;
      const el = sortWrapRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sortOpen]);

  useEffect(() => {
    if (!sortOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sortOpen]);

  const handleResetFiltersInSheet = () => {
    onClearFacetFilters();
  };

  const hasInlineFilterPills =
    searchQuery.trim().length > 0 ||
    activeTypeFilters.length > 0 ||
    locationCountries.length > 0 ||
    collectionFilter.length > 0 ||
    selectedProgramIds.length > 0 ||
    selectedRepFirmIds.length > 0 ||
    selectedAmenities.length > 0 ||
    (canViewCommissions && commissionFilterActive) ||
    hasActiveIncentive ||
    hasPlannedOpening ||
    selectedTiers.length > 0 ||
    selectedPriceTiers.length > 0 ||
    sortByCommission;

  const pillBtn =
    "flex max-w-[min(100%,280px)] shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] transition-colors";

  return (
    <>
      <FilterBar className="mb-0 border-0 pb-0">
        <div className="flex flex-col gap-3 min-[900px]:flex-row min-[900px]:flex-wrap min-[900px]:items-center min-[900px]:justify-between">
          <div className="min-w-0 flex-1 basis-[min(100%,18rem)]">
            <div
              className={cn(
                catalogSearchFieldWrapperClass,
                "min-h-8 h-auto flex-wrap content-center gap-x-2 gap-y-1.5 py-1.5"
              )}
            >
              <Search className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground/65" aria-hidden />
              {hasInlineFilterPills ? (
                <div className="flex max-w-full flex-wrap items-center gap-1.5">
                  {searchQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => onSearchQueryChange("")}
                      className={cn(pillBtn, "bg-white/[0.04] text-muted-foreground hover:bg-foreground/[0.06]")}
                    >
                      &quot;{searchQuery.trim().slice(0, 24)}
                      {searchQuery.trim().length > 24 ? "…" : ""}&quot;
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {activeTypeFilters.length > 0 ? (
                    <button
                      type="button"
                      onClick={onClearTypeFilters}
                      className={cn(pillBtn, "bg-white/[0.04] text-muted-foreground hover:bg-foreground/[0.06]")}
                    >
                      {activeTypeFilters.map((id) => directoryCategoryLabel(id)).join(", ")}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {locationCountries.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onLocationCountriesChange([])}
                      className={cn(pillBtn, "bg-white/[0.04] text-muted-foreground hover:bg-foreground/[0.06]")}
                    >
                      {locationCountries.slice(0, 2).join(", ")}
                      {locationCountries.length > 2 ? ` +${locationCountries.length - 2}` : ""}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {collectionFilter.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onCollectionFilterChange([])}
                      className={cn(
                        pillBtn,
                        "bg-[rgba(201,169,110,0.06)] text-[#B8976E] hover:bg-[rgba(201,169,110,0.10)]"
                      )}
                    >
                      {collectionFilter.length === 1
                        ? collections.find((c) => c.id === collectionFilter[0])?.name ?? "Collection"
                        : `${collectionFilter.length} collections`}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {selectedProgramIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectedProgramIdsChange([])}
                      className={cn(
                        pillBtn,
                        "bg-[rgba(201,169,110,0.06)] text-[#B8976E] hover:bg-[rgba(201,169,110,0.10)]"
                      )}
                    >
                      {AGENCY_PROGRAM_OPTIONS.filter((p) => selectedProgramIds.includes(p.id))
                        .map((p) => p.name)
                        .join(", ")}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {selectedAmenities.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectedAmenitiesChange([])}
                      className={cn(
                        pillBtn,
                        "bg-[rgba(91,138,110,0.06)] text-[#5B8A6E] hover:bg-[rgba(91,138,110,0.10)]"
                      )}
                    >
                      {selectedAmenities.map((b) => AMENITY_LABELS[b]).join(", ")}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {canViewCommissions && commissionFilterActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        onCommissionFilterActiveChange(false);
                        onCommissionRangeChange([0, 25]);
                      }}
                      className={cn(
                        pillBtn,
                        "bg-[rgba(184,151,110,0.06)] text-[#B8976E] hover:bg-[rgba(184,151,110,0.10)]"
                      )}
                    >
                      {commissionRange[0]}%–{commissionRange[1]}%
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {hasActiveIncentive ? (
                    <button
                      type="button"
                      onClick={() => onHasActiveIncentiveChange(false)}
                      className={cn(pillBtn, "bg-amber-500/15 text-amber-400 hover:bg-amber-500/20")}
                    >
                      Active incentives
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {hasPlannedOpening ? (
                    <button
                      type="button"
                      onClick={() => onHasPlannedOpeningChange(false)}
                      className={cn(
                        pillBtn,
                        "bg-[rgba(201,169,110,0.10)] text-brand-cta hover:bg-[rgba(201,169,110,0.14)]"
                      )}
                    >
                      Planned opening
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {selectedRepFirmIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectedRepFirmIdsChange([])}
                      className={cn(
                        pillBtn,
                        "truncate bg-[rgba(176,122,91,0.12)] text-[#B07A5B] hover:bg-[rgba(176,122,91,0.18)]"
                      )}
                    >
                      <span className="min-w-0 truncate">
                        {selectedRepFirmIds
                          .map((id) => repFirmFilterOptions.find((f) => f.id === id)?.name ?? id)
                          .slice(0, 3)
                          .join(", ")}
                        {selectedRepFirmIds.length > 3 ? ` +${selectedRepFirmIds.length - 3}` : ""}
                      </span>
                      <span className="shrink-0 text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {selectedTiers.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectedTiersChange([])}
                      className={cn(pillBtn, "bg-white/[0.04] text-muted-foreground hover:bg-foreground/[0.06]")}
                    >
                      {selectedTiers.map((t) => DIRECTORY_TIER_FILTER_UI.find((x) => x.id === t)?.label ?? t).join(", ")}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {selectedPriceTiers.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectedPriceTiersChange([])}
                      className={cn(
                        pillBtn,
                        "bg-[rgba(201,169,110,0.06)] text-brand-cta hover:bg-[rgba(201,169,110,0.10)]"
                      )}
                    >
                      {selectedPriceTiers.join(" ")}
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  {sortByCommission ? (
                    <button
                      type="button"
                      onClick={() => onSortByCommissionChange(false)}
                      className={cn(pillBtn, "bg-white/[0.04] text-muted-foreground hover:bg-foreground/[0.06]")}
                    >
                      Sort by commission
                      <span className="text-muted-foreground">✕</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClearAllFilters}
                    className="shrink-0 px-1 text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search products…"
                className={cn(catalogSearchInputClass, "min-h-7 min-w-[10rem] flex-1 basis-[min(100%,12rem)] self-center")}
                aria-label="Search products"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div ref={sortWrapRef} className="relative">
              <button
                type="button"
                aria-label={`Sort products. Current: ${DIRECTORY_PRODUCT_SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Name A → Z"}`}
                onClick={() => setSortOpen((o) => !o)}
                className={cn(
                  "flex h-9 max-w-[220px] min-w-0 items-center gap-2 rounded-lg border px-3 text-left text-xs transition-colors",
                  sortBy !== DEFAULT_DIRECTORY_PRODUCT_SORT
                    ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                    : "border-border bg-popover text-muted-foreground hover:border-border"
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/65" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  {DIRECTORY_PRODUCT_SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Sort"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/65" aria-hidden />
              </button>
              {sortOpen && (
                <div
                  className="absolute left-0 top-full z-[80] mt-1 w-[min(100vw-2rem,220px)] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-2xl"
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
                        "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/40",
                        sortBy === option.id ? "text-brand-cta" : "text-muted-foreground"
                      )}
                    >
                      {option.label}
                      {sortBy === option.id ? <Check className="h-3.5 w-3.5 text-brand-cta" /> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="flex shrink-0 items-center rounded-lg border border-border bg-muted/25 p-0.5"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                title="Grid view"
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-[rgba(201,169,110,0.12)] text-brand-cta"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="List view"
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-[rgba(201,169,110,0.12)] text-brand-cta"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onViewModeChange("list")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Map view"
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "map"
                    ? "bg-[rgba(201,169,110,0.12)] text-brand-cta"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onViewModeChange("map")}
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2 border-border",
                activeFacetCount > 0 && "border-[rgba(201,169,110,0.28)] bg-[rgba(201,169,110,0.06)] text-foreground"
              )}
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Filters
              {activeFacetCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-cta/20 px-1.5 text-[10px] font-semibold tabular-nums text-brand-cta">
                  {activeFacetCount > 99 ? "99+" : activeFacetCount}
                </span>
              ) : null}
            </Button>

            <Button
              type="button"
              variant="toolbarAccent"
              size="sm"
              className="h-9 shrink-0"
              onClick={onAddProduct}
              title="Add a product. You can also save from chat or external search."
            >
              <Plus className="h-3.5 w-3.5" />
              Add product
            </Button>

            <button
              type="button"
              onClick={onBulkModeToggle}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors",
                bulkMode
                  ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                  : "border-border bg-popover text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {bulkMode ? `${bulkSelectedCount} selected` : "Select"}
            </button>

            <span className="text-2xs text-muted-foreground tabular-nums min-[900px]:border-l min-[900px]:border-border min-[900px]:pl-3">
              {resultCount} product{resultCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </FilterBar>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(92dvh,880px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
            <DialogTitle>Filters</DialogTitle>
            <DialogDescription>
              Refine by type, location, collections, and more. Search and sort stay on the toolbar.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="space-y-8">
              <section className="space-y-3" aria-labelledby="pd-filter-type">
                <h3 id="pd-filter-type" className={filterSectionLabel()}>
                  Product type
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={onClearTypeFilters}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-2xs whitespace-nowrap transition-colors",
                      activeTypeFilters.length === 0
                        ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  {DIRECTORY_PRODUCT_TYPE_CONFIG.map((type) => {
                    const Icon = type.icon;
                    const active = activeTypeFilters.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => onToggleTypeFilter(type.id)}
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-2xs whitespace-nowrap transition-colors",
                          active ? "border-solid" : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                        style={
                          active
                            ? {
                                background: type.bg,
                                color: type.color,
                                borderColor: type.border,
                              }
                            : undefined
                        }
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-2" aria-labelledby="pd-filter-location">
                <h3 id="pd-filter-location" className={filterSectionLabel()}>
                  Location
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryLocationDropdown
                    selectedCountries={locationCountries}
                    onChange={onLocationCountriesChange}
                  />
                </div>
              </section>

              <section className="space-y-2" aria-labelledby="pd-filter-collections">
                <h3 id="pd-filter-collections" className={filterSectionLabel()}>
                  Collections
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryCollectionSearchDropdown
                    collections={collections}
                    selectedIds={collectionFilter}
                    onChange={onCollectionFilterChange}
                  />
                </div>
              </section>

              <section className="space-y-2" aria-labelledby="pd-filter-programs">
                <h3 id="pd-filter-programs" className={filterSectionLabel()}>
                  Partner programs
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryProgramSearchDropdown
                    selectedProgramIds={selectedProgramIds}
                    onChange={onSelectedProgramIdsChange}
                  />
                </div>
              </section>

              <section className="space-y-2" aria-labelledby="pd-filter-rep">
                <h3 id="pd-filter-rep" className={filterSectionLabel()}>
                  Rep firms
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryRepFirmFilterDropdown
                    repFirms={repFirmFilterOptions}
                    selectedRepFirmIds={selectedRepFirmIds}
                    onChange={onSelectedRepFirmIdsChange}
                  />
                </div>
              </section>

              <section className="space-y-2" aria-labelledby="pd-filter-amenities">
                <h3 id="pd-filter-amenities" className={filterSectionLabel()}>
                  Amenities
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryAmenitiesDropdown
                    selected={selectedAmenities}
                    onChange={onSelectedAmenitiesChange}
                  />
                </div>
              </section>

              <section className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/40 px-3 py-3">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Planned opening</span>
                  <ProductDirectoryFilterSwitch checked={hasPlannedOpening} onCheckedChange={onHasPlannedOpeningChange} />
                </div>
                {canViewCommissions ? (
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-border min-[400px]:border-l min-[400px]:pl-4">
                    <span className="text-xs text-muted-foreground">Active incentives</span>
                    <ProductDirectoryFilterSwitch
                      checked={hasActiveIncentive}
                      onCheckedChange={onHasActiveIncentiveChange}
                    />
                  </div>
                ) : null}
              </section>

              {canViewCommissions ? (
                <section className="space-y-2" aria-labelledby="pd-filter-commission">
                  <h3 id="pd-filter-commission" className={filterSectionLabel()}>
                    Commission
                  </h3>
                  <div className={sheetDropdownStretch}>
                    <ProductDirectoryCommissionRangeDropdown
                      commissionRange={commissionRange}
                      onCommissionRangeChange={onCommissionRangeChange}
                      commissionFilterActive={commissionFilterActive}
                      onCommissionFilterActiveChange={onCommissionFilterActiveChange}
                      sortByCommission={sortByCommission}
                      onSortByCommissionChange={onSortByCommissionChange}
                    />
                  </div>
                </section>
              ) : null}

              <section className="space-y-2" aria-labelledby="pd-filter-tiers">
                <h3 id="pd-filter-tiers" className={filterSectionLabel()}>
                  Partner tiers
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryTierDropdown selectedTiers={selectedTiers} onChange={onSelectedTiersChange} />
                </div>
              </section>

              <section className="space-y-2" aria-labelledby="pd-filter-price">
                <h3 id="pd-filter-price" className={filterSectionLabel()}>
                  Price band
                </h3>
                <div className={sheetDropdownStretch}>
                  <ProductDirectoryPriceFilterDropdown
                    selectedPriceTiers={selectedPriceTiers}
                    onChange={onSelectedPriceTiersChange}
                  />
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleResetFiltersInSheet}>
              Reset filters
            </Button>
            <Button type="button" size="sm" variant="toolbarAccent" onClick={() => setFiltersOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
