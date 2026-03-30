"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  List,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FilterBar,
  FilterBarActionsCluster,
  FilterBarPrimaryStack,
  FilterBarToolbarRow,
} from "@/components/ui/filter-bar";
import {
  directoryFilterSelectContentClass,
  directoryFilterSelectItemClass,
  directoryFilterSelectTriggerActiveClass,
  directoryFilterSelectTriggerClass,
  PageSearchField,
} from "@/components/ui/page-search-field";
import type { ProductCategory, ProductStatus, VerificationStatus, PartnershipTier, PriceRange } from "@/types/product";
import { CATEGORY_LABELS } from "@/config/productCategoryConfig";

const DEBOUNCE_MS = 300;
const DEFAULT_PRODUCT_SORT_BY = "name";
const DEFAULT_PRODUCT_SORT_ORDER = "asc" as const;

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending_review", label: "Pending review" },
  { value: "archived", label: "Archived" },
];

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const PARTNERSHIP_OPTIONS: { value: PartnershipTier; label: string }[] = [
  { value: "preferred", label: "Preferred" },
  { value: "partner", label: "Partner" },
  { value: "standard", label: "Standard" },
  { value: "none", label: "None" },
];

const PRICE_RANGE_OPTIONS: { value: PriceRange; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
  { value: "ultra_luxury", label: "Ultra Luxury" },
];

const SORT_OPTIONS: { value: string; label: string; by: string; order: "asc" | "desc" }[] = [
  { value: "name_asc", label: "Name (A-Z)", by: "name", order: "asc" },
  { value: "name_desc", label: "Name (Z-A)", by: "name", order: "desc" },
  { value: "updated_desc", label: "Recently updated", by: "updated_at", order: "desc" },
  { value: "created_desc", label: "Recently created", by: "created_at", order: "desc" },
  { value: "category_asc", label: "Category", by: "category", order: "asc" },
  { value: "status_asc", label: "Status", by: "status", order: "asc" },
];

const COUNTRIES = ["France", "United Kingdom", "United States", "Switzerland", "Italy", "Spain"];

const outlineToolbarBtnClass =
  "h-8 gap-1.5 border-input px-2.5 text-xs text-foreground hover:bg-white/[0.04]";

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  categoryFilter: ProductCategory | null;
  onCategoryChange: (v: ProductCategory | null) => void;
  statusFilter: ProductStatus | null;
  onStatusChange: (v: ProductStatus | null) => void;
  countryFilter: string | null;
  onCountryChange: (v: string | null) => void;
  partnershipTierFilter: PartnershipTier | null;
  onPartnershipTierChange: (v: PartnershipTier | null) => void;
  priceRangeFilter: PriceRange | null;
  onPriceRangeChange: (v: PriceRange | null) => void;
  verificationFilter: VerificationStatus | null;
  onVerificationChange: (v: VerificationStatus | null) => void;
  viewMode: "list" | "cards" | "compact";
  onViewModeChange: (v: "list" | "cards" | "compact") => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
  onAddProduct?: () => void;
  onImportCSV: () => void;
  onClearFilters: () => void;
  bulkSelectedCount?: number;
  onBulkDelete?: () => void;
  onBulkEnrich?: () => void;
  onBulkExport?: () => void;
  isEnableTab?: boolean;
  /** Shown in the actions cluster (e.g. current page total). */
  resultTotal?: number;
};

export default function ProductToolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  countryFilter,
  onCountryChange,
  partnershipTierFilter,
  onPartnershipTierChange,
  priceRangeFilter,
  onPriceRangeChange,
  verificationFilter,
  onVerificationChange,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onAddProduct,
  onImportCSV,
  onClearFilters,
  bulkSelectedCount = 0,
  onBulkDelete,
  onBulkEnrich,
  onBulkExport,
  isEnableTab = false,
  resultTotal,
}: Props) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setBulkMenuOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

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

  const sortOption =
    SORT_OPTIONS.find((o) => o.by === sortBy && o.order === sortOrder) ??
    SORT_OPTIONS.find((o) => o.value === "name_asc")!;

  const sortIsDefault = sortBy === DEFAULT_PRODUCT_SORT_BY && sortOrder === DEFAULT_PRODUCT_SORT_ORDER;

  const applySortOption = (opt: (typeof SORT_OPTIONS)[number]) => {
    onSortChange(opt.by, opt.order);
    setSortOpen(false);
  };

  const hasFilters =
    categoryFilter != null ||
    statusFilter != null ||
    countryFilter != null ||
    partnershipTierFilter != null ||
    priceRangeFilter != null ||
    verificationFilter != null;

  const categoryLabel = categoryFilter != null ? CATEGORY_LABELS[categoryFilter] : null;
  const statusLabel = statusFilter != null ? STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? null : null;
  const partnershipLabel =
    partnershipTierFilter != null
      ? PARTNERSHIP_OPTIONS.find((o) => o.value === partnershipTierFilter)?.label ?? null
      : null;
  const priceLabel =
    priceRangeFilter != null ? PRICE_RANGE_OPTIONS.find((o) => o.value === priceRangeFilter)?.label ?? null : null;
  const verificationLabel =
    verificationFilter != null ? VERIFICATION_OPTIONS.find((o) => o.value === verificationFilter)?.label ?? null : null;

  return (
    <FilterBar>
      <FilterBarPrimaryStack>
        <PageSearchField
          placeholder="Search products…"
          aria-label="Search products"
          value={localSearch}
          onChange={setLocalSearch}
        />
      </FilterBarPrimaryStack>

      <FilterBarToolbarRow>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div ref={sortWrapRef} className="relative">
            <button
              type="button"
              aria-label={`Sort products. Current: ${sortOption.label}`}
              onClick={() => setSortOpen((o) => !o)}
              className={cn(
                "flex max-w-[220px] min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                sortIsDefault
                  ? "border-border bg-popover text-muted-foreground hover:border-border"
                  : "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
              )}
            >
              <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/65" aria-hidden />
              {sortIsDefault ? (
                <span className="text-xs text-muted-foreground">Sort by</span>
              ) : (
                <span className="min-w-0 flex-1 truncate">{sortOption.label}</span>
              )}
              <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" aria-hidden />
            </button>
            {sortOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {SORT_OPTIONS.map((o) => {
                  const selected = o.by === sortBy && o.order === sortOrder;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => applySortOption(o)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]",
                        selected ? "text-brand-cta" : "text-muted-foreground"
                      )}
                    >
                      {o.label}
                      {selected ? <Check className="h-3 w-3 text-brand-cta" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Select
            value={categoryFilter ?? "all"}
            onValueChange={(v) => onCategoryChange((v === "all" ? null : v) as ProductCategory | null)}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,160px)] max-w-[200px]",
                categoryFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Category">
                {categoryLabel != null ? categoryLabel : "Category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All categories
              </SelectItem>
              {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                <SelectItem key={cat} className={directoryFilterSelectItemClass} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter ?? "all"}
            onValueChange={(v) => onStatusChange((v === "all" ? null : v) as ProductStatus | null)}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[170px]",
                statusFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Status">
                {statusLabel != null ? statusLabel : "Status"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All statuses
              </SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={countryFilter ?? "all"} onValueChange={(v) => onCountryChange(v === "all" ? null : v)}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,140px)] max-w-[180px]",
                countryFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Country">
                {countryFilter != null ? countryFilter : "Country"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All countries
              </SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} className={directoryFilterSelectItemClass} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={partnershipTierFilter ?? "all"}
            onValueChange={(v) => onPartnershipTierChange((v === "all" ? null : v) as PartnershipTier | null)}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[180px]",
                partnershipTierFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Partnership">
                {partnershipLabel != null ? partnershipLabel : "Partnership"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All tiers
              </SelectItem>
              {PARTNERSHIP_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priceRangeFilter ?? "all"}
            onValueChange={(v) => onPriceRangeChange((v === "all" ? null : v) as PriceRange | null)}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[160px]",
                priceRangeFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Price">
                {priceLabel != null ? priceLabel : "Price"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All prices
              </SelectItem>
              {PRICE_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={verificationFilter ?? "all"}
            onValueChange={(v) => onVerificationChange((v === "all" ? null : v) as VerificationStatus | null)}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[180px]",
                verificationFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Verification">
                {verificationLabel != null ? verificationLabel : "Verification"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All
              </SelectItem>
              {VERIFICATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FilterBarActionsCluster>
          {resultTotal != null ? (
            <span className="text-2xs text-muted-foreground">
              {resultTotal} {resultTotal === 1 ? "product" : "products"}
            </span>
          ) : null}
          {hasFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 text-2xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3 shrink-0" aria-hidden />
              Clear filters
            </button>
          ) : null}
          <button
            type="button"
            title="List view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "list" ? "bg-[rgba(201,169,110,0.08)] text-brand-cta" : "text-muted-foreground/65 hover:text-muted-foreground"
            )}
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Card view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "cards" ? "bg-[rgba(201,169,110,0.08)] text-brand-cta" : "text-muted-foreground/65 hover:text-muted-foreground"
            )}
            onClick={() => onViewModeChange("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Compact view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "compact" ? "bg-[rgba(201,169,110,0.08)] text-brand-cta" : "text-muted-foreground/65 hover:text-muted-foreground"
            )}
            onClick={() => onViewModeChange("compact")}
          >
            <LayoutList className="h-4 w-4" />
          </button>

          {bulkSelectedCount > 0 && (
            <div className="relative" ref={bulkMenuRef}>
              <button
                type="button"
                onClick={() => setBulkMenuOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                )}
              >
                {bulkSelectedCount} selected
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/65" />
              </button>
              {bulkMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-2xl">
                  {onBulkEnrich ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                      onClick={() => {
                        onBulkEnrich();
                        setBulkMenuOpen(false);
                      }}
                    >
                      Enrich selected
                    </button>
                  ) : null}
                  {onBulkExport ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                      onClick={() => {
                        onBulkExport();
                        setBulkMenuOpen(false);
                      }}
                    >
                      Export
                    </button>
                  ) : null}
                  {onBulkDelete ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-[var(--muted-error-text)] hover:bg-[var(--muted-error-bg)]"
                      onClick={() => {
                        onBulkDelete();
                        setBulkMenuOpen(false);
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {!isEnableTab && onAddProduct != null ? (
            <button
              type="button"
              onClick={onAddProduct}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] px-2.5 py-1.5 text-xs text-brand-cta transition-colors hover:border-[rgba(201,169,110,0.28)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </button>
          ) : null}
          {!isEnableTab ? (
            <Button variant="outline" size="sm" onClick={onImportCSV} className={outlineToolbarBtnClass}>
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </Button>
          ) : null}
        </FilterBarActionsCluster>
      </FilterBarToolbarRow>
    </FilterBar>
  );
}
