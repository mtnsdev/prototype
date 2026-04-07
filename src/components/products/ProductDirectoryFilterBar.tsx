"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  CheckSquare,
  ChevronDown,
  LayoutGrid,
  List,
  Map as MapIcon,
  Plus,
} from "lucide-react";
import type { DirectoryAmenityTag, DirectoryCollectionOption, DirectoryProductCategory } from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { cn } from "@/lib/utils";
import {
  FilterBar,
  FilterBarActionsCluster,
  FilterBarPrimaryStack,
  FilterBarToolbarRow,
  FilterChipScrollRow,
} from "@/components/ui/filter-bar";
import { PageSearchField } from "@/components/ui/page-search-field";
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
  DEFAULT_DIRECTORY_PRODUCT_SORT,
  DIRECTORY_PRODUCT_SORT_OPTIONS,
  type DirectoryProductSortOption,
} from "./productDirectoryFilterConfig";
import { DIRECTORY_PRODUCT_TYPE_CONFIG } from "./productDirectoryProductTypes";

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
};

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
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

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

  return (
    <FilterBar>
      <FilterBarPrimaryStack>
        <div className="flex w-full min-w-0 items-center gap-2 md:gap-3">
          <PageSearchField
            className="min-w-0 w-auto flex-1"
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Search products…"
            aria-label="Search products"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onAddProduct}
            title="Prefer saving from chat / external search. Manual add is for edge cases only."
          >
            <Plus className="h-3.5 w-3.5" />
            Add manually
          </Button>
        </div>
        <FilterChipScrollRow>
          <button
            type="button"
            onClick={onClearTypeFilters}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-2xs whitespace-nowrap transition-colors",
              activeTypeFilters.length === 0
                ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                : "border-transparent text-muted-foreground hover:text-muted-foreground"
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
                  active ? "border-solid" : "border-transparent text-muted-foreground hover:text-muted-foreground"
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
        </FilterChipScrollRow>
      </FilterBarPrimaryStack>

      <FilterBarToolbarRow>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div ref={sortWrapRef} className="relative">
          <button
            type="button"
            aria-label={`Sort products. Current: ${DIRECTORY_PRODUCT_SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Name A → Z"}`}
            onClick={() => setSortOpen((o) => !o)}
            className={cn(
              "flex max-w-[220px] min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
              sortBy !== DEFAULT_DIRECTORY_PRODUCT_SORT
                ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                : "border-border bg-popover text-muted-foreground hover:border-border"
            )}
          >
            <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/65" aria-hidden />
            {sortBy !== DEFAULT_DIRECTORY_PRODUCT_SORT ? (
              <span className="min-w-0 flex-1 truncate">
                {DIRECTORY_PRODUCT_SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Sort by"}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Sort by</span>
            )}
            <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" aria-hidden />
          </button>
          {sortOpen && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-2xl"
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
                    "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]",
                    sortBy === option.id ? "text-brand-cta" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                  {sortBy === option.id ? <Check className="h-3 w-3 text-brand-cta" /> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <ProductDirectoryLocationDropdown
          selectedCountries={locationCountries}
          onChange={onLocationCountriesChange}
        />
        <ProductDirectoryCollectionSearchDropdown
          collections={collections}
          selectedIds={collectionFilter}
          onChange={onCollectionFilterChange}
        />
        <ProductDirectoryProgramSearchDropdown
          selectedProgramIds={selectedProgramIds}
          onChange={onSelectedProgramIdsChange}
        />
        <ProductDirectoryRepFirmFilterDropdown
          repFirms={repFirmFilterOptions}
          selectedRepFirmIds={selectedRepFirmIds}
          onChange={onSelectedRepFirmIdsChange}
        />
        <ProductDirectoryAmenitiesDropdown selected={selectedAmenities} onChange={onSelectedAmenitiesChange} />
        {canViewCommissions ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-popover px-2.5 py-1.5">
            <span className="text-xs text-muted-foreground">Active incentives</span>
            <ProductDirectoryFilterSwitch
              checked={hasActiveIncentive}
              onCheckedChange={onHasActiveIncentiveChange}
            />
          </div>
        ) : null}
        {canViewCommissions && (
          <ProductDirectoryCommissionRangeDropdown
            commissionRange={commissionRange}
            onCommissionRangeChange={onCommissionRangeChange}
            commissionFilterActive={commissionFilterActive}
            onCommissionFilterActiveChange={onCommissionFilterActiveChange}
            sortByCommission={sortByCommission}
            onSortByCommissionChange={onSortByCommissionChange}
          />
        )}
        <ProductDirectoryTierDropdown selectedTiers={selectedTiers} onChange={onSelectedTiersChange} />
        <ProductDirectoryPriceFilterDropdown
          selectedPriceTiers={selectedPriceTiers}
          onChange={onSelectedPriceTiersChange}
        />
        </div>

        <FilterBarActionsCluster>
          <span className="text-2xs text-muted-foreground">
            {resultCount} product{resultCount !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onBulkModeToggle}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
              bulkMode
                ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                : "border-border bg-popover text-muted-foreground hover:text-muted-foreground"
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {bulkMode ? `${bulkSelectedCount} selected` : "Select"}
          </button>
          <button
            type="button"
            title="Grid view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-[rgba(201,169,110,0.08)] text-brand-cta"
                : "text-muted-foreground/65 hover:text-muted-foreground"
            )}
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="List view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-[rgba(201,169,110,0.08)] text-brand-cta"
                : "text-muted-foreground/65 hover:text-muted-foreground"
            )}
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Map view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "map"
                ? "bg-[rgba(201,169,110,0.08)] text-brand-cta"
                : "text-muted-foreground/65 hover:text-muted-foreground"
            )}
            onClick={() => onViewModeChange("map")}
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </FilterBarActionsCluster>
      </FilterBarToolbarRow>
    </FilterBar>
  );
}
