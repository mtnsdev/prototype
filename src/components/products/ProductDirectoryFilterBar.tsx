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
  Search,
} from "lucide-react";
import type { DirectoryAmenityTag, DirectoryCollectionOption, DirectoryProductCategory } from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { cn } from "@/lib/utils";
import ProductDirectoryLocationDropdown from "./ProductDirectoryLocationDropdown";
import ProductDirectoryAmenitiesDropdown from "./ProductDirectoryAmenitiesDropdown";
import ProductDirectoryProgramSearchDropdown from "./ProductDirectoryProgramSearchDropdown";
import ProductDirectoryCollectionSearchDropdown from "./ProductDirectoryCollectionSearchDropdown";
import ProductDirectoryCommissionRangeDropdown from "./ProductDirectoryCommissionRangeDropdown";
import ProductDirectoryTierDropdown from "./ProductDirectoryTierDropdown";
import ProductDirectoryPriceFilterDropdown from "./ProductDirectoryPriceFilterDropdown";
import ProductDirectoryMoreFiltersDropdown from "./ProductDirectoryMoreFiltersDropdown";
import {
  DIRECTORY_PRODUCT_SORT_OPTIONS,
  type DirectoryProductSortOption,
} from "./productDirectoryFilterConfig";
import { DIRECTORY_PRODUCT_TYPE_CONFIG } from "./productDirectoryProductTypes";
import type { Team } from "@/types/teams";

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
  onRequestNewCollection: () => void;
  collections: DirectoryCollectionOption[];
  teams: Team[];
  selectedProgramIds: string[];
  onSelectedProgramIdsChange: (v: string[]) => void;
  selectedAmenities: DirectoryAmenityTag[];
  onSelectedAmenitiesChange: (v: DirectoryAmenityTag[]) => void;
  commissionRange: [number, number];
  onCommissionRangeChange: (r: [number, number]) => void;
  commissionFilterActive: boolean;
  onCommissionFilterActiveChange: (v: boolean) => void;
  sortByCommission: boolean;
  onSortByCommissionChange: (v: boolean) => void;
  selectedTiers: DirectoryTierLevel[];
  onSelectedTiersChange: (v: DirectoryTierLevel[]) => void;
  selectedPriceTiers: DirectoryPriceTier[];
  onSelectedPriceTiersChange: (v: DirectoryPriceTier[]) => void;
  showExpiringOnly: boolean;
  onShowExpiringOnlyChange: (v: boolean) => void;
  showMyEnrichedOnly: boolean;
  onShowMyEnrichedOnlyChange: (v: boolean) => void;
  enrichFilterTeam: boolean;
  onEnrichFilterTeamChange: (v: boolean) => void;
  enrichFilterPersonal: boolean;
  onEnrichFilterPersonalChange: (v: boolean) => void;
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
  onRequestNewCollection,
  collections,
  teams,
  selectedProgramIds,
  onSelectedProgramIdsChange,
  selectedAmenities,
  onSelectedAmenitiesChange,
  commissionRange,
  onCommissionRangeChange,
  commissionFilterActive,
  onCommissionFilterActiveChange,
  sortByCommission,
  onSortByCommissionChange,
  selectedTiers,
  onSelectedTiersChange,
  selectedPriceTiers,
  onSelectedPriceTiersChange,
  showExpiringOnly,
  onShowExpiringOnlyChange,
  showMyEnrichedOnly,
  onShowMyEnrichedOnlyChange,
  enrichFilterTeam,
  onEnrichFilterTeamChange,
  enrichFilterPersonal,
  onEnrichFilterPersonalChange,
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
    <div className="mb-4 space-y-2 border-b border-[rgba(255,255,255,0.03)] pb-4">
      {/* Row 1 — Search full width, type pills below */}
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#4A4540]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search products..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#F5F0EB] placeholder-[#4A4540] outline-none"
            aria-label="Search products"
          />
        </div>
        <div className="-mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={onClearTypeFilters}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] whitespace-nowrap transition-colors",
              activeTypeFilters.length === 0
                ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "border-transparent text-[#6B6560] hover:text-[#9B9590]"
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
                  "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] whitespace-nowrap transition-colors",
                  active ? "border-solid" : "border-transparent text-[#6B6560] hover:text-[#9B9590]"
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
      </div>

      {/* Row 2 — Dropdowns | count + bulk + views */}
      <div className="flex flex-col gap-2 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <ProductDirectoryLocationDropdown
          selectedCountries={locationCountries}
          onChange={onLocationCountriesChange}
        />
        <ProductDirectoryCollectionSearchDropdown
          collections={collections}
          teams={teams}
          selectedIds={collectionFilter}
          onChange={onCollectionFilterChange}
          onRequestNewCollection={onRequestNewCollection}
        />
        <ProductDirectoryProgramSearchDropdown
          selectedProgramIds={selectedProgramIds}
          onChange={onSelectedProgramIdsChange}
        />
        <ProductDirectoryAmenitiesDropdown selected={selectedAmenities} onChange={onSelectedAmenitiesChange} />
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
        <ProductDirectoryMoreFiltersDropdown
          showExpiringOnly={showExpiringOnly}
          onShowExpiringOnlyChange={onShowExpiringOnlyChange}
          showMyEnrichedOnly={showMyEnrichedOnly}
          onShowMyEnrichedOnlyChange={onShowMyEnrichedOnlyChange}
          enrichFilterTeam={enrichFilterTeam}
          onEnrichFilterTeamChange={onEnrichFilterTeamChange}
          enrichFilterPersonal={enrichFilterPersonal}
          onEnrichFilterPersonalChange={onEnrichFilterPersonalChange}
        />

        <div ref={sortWrapRef} className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.03)] bg-[#0c0c12] px-2.5 py-1.5 text-[11px] text-[#9B9590] transition-colors hover:border-[rgba(255,255,255,0.06)]"
          >
            <ArrowUpDown className="h-3 w-3 text-[#4A4540]" />
            <span>{DIRECTORY_PRODUCT_SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Sort"}</span>
            <ChevronDown className="h-3 w-3 text-[#4A4540]" />
          </button>
          {sortOpen && (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e0e14] py-1 shadow-2xl"
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
                    "flex w-full items-center justify-between px-3 py-2 text-left text-[11px] transition-colors hover:bg-white/[0.04]",
                    sortBy === option.id ? "text-[#C9A96E]" : "text-[#9B9590]"
                  )}
                >
                  {option.label}
                  {sortBy === option.id ? <Check className="h-3 w-3 text-[#C9A96E]" /> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-[rgba(255,255,255,0.03)] min-[1100px]:border-l min-[1100px]:pl-3">
          <span className="text-[10px] text-[#6B6560]">
            {resultCount} product{resultCount !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onBulkModeToggle}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors",
              bulkMode
                ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#6B6560] hover:text-[#9B9590]"
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
                ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "text-[#4A4540] hover:text-[#9B9590]"
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
                ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "text-[#4A4540] hover:text-[#9B9590]"
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
                ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "text-[#4A4540] hover:text-[#9B9590]"
            )}
            onClick={() => onViewModeChange("map")}
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
