"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  List,
  LayoutGrid,
  LayoutList,
  Plus,
  Upload,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ProductCategory, ProductStatus, VerificationStatus, PartnershipTier, PriceRange } from "@/types/product";
import { CATEGORY_LABELS } from "@/config/productCategoryConfig";

const DEBOUNCE_MS = 300;

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
}: Props) {
  const sortValue = SORT_OPTIONS.find((o) => o.by === sortBy && o.order === sortOrder)?.value ?? "name_asc";
  const handleSortValue = (value: string) => {
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (opt) onSortChange(opt.by, opt.order);
  };

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  const hasFilters =
    categoryFilter != null ||
    statusFilter != null ||
    countryFilter != null ||
    partnershipTierFilter != null ||
    priceRangeFilter != null ||
    verificationFilter != null;

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,245,245,0.4)]" />
          <Input
            placeholder="Search products…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)]"
          />
        </div>

        <div className="flex items-center gap-1 border border-white/10 rounded-md p-0.5 bg-white/5">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", viewMode === "list" && "bg-white/10 text-[#F5F5F5]")}
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <List size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", viewMode === "cards" && "bg-white/10 text-[#F5F5F5]")}
            onClick={() => onViewModeChange("cards")}
            aria-label="Card view"
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", viewMode === "compact" && "bg-white/10 text-[#F5F5F5]")}
            onClick={() => onViewModeChange("compact")}
            aria-label="Compact view"
          >
            <LayoutList size={16} />
          </Button>
        </div>

        <Select value={sortValue} onValueChange={handleSortValue}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isEnableTab && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/8 border-white/10 text-[#F5F5F5] hover:bg-white/12"
              onClick={onAddProduct}
            >
              <Plus size={16} className="mr-1.5" />
              Add Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/8 border-white/10 text-[#F5F5F5] hover:bg-white/12"
              onClick={onImportCSV}
            >
              <Upload size={16} className="mr-1.5" />
              Import CSV
            </Button>
          </>
        )}

        {bulkSelectedCount > 0 && (
          <div className="relative" ref={bulkMenuRef}>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/8 border-white/10 text-[#F5F5F5]"
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
            >
              {bulkSelectedCount} selected <ChevronDown size={14} className="ml-1" />
            </Button>
            {bulkMenuOpen && (
              <div className="absolute top-full right-0 mt-1 py-1 min-w-[160px] rounded-md border border-white/10 bg-[#1a1a1a] shadow-lg z-10">
                {onBulkEnrich && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#F5F5F5] hover:bg-white/10"
                    onClick={() => { onBulkEnrich(); setBulkMenuOpen(false); }}
                  >
                    Enrich selected
                  </button>
                )}
                {onBulkExport && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#F5F5F5] hover:bg-white/10"
                    onClick={() => { onBulkExport(); setBulkMenuOpen(false); }}
                  >
                    Export
                  </button>
                )}
                {onBulkDelete && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10"
                    onClick={() => { onBulkDelete(); setBulkMenuOpen(false); }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-[rgba(245,245,245,0.7)]">
            <X size={14} className="mr-1" /> Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" ref={filtersRef}>
        <Select
          value={categoryFilter ?? "all"}
          onValueChange={(v) => onCategoryChange((v === "all" ? null : v) as ProductCategory | null)}
        >
          <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => onStatusChange((v === "all" ? null : v) as ProductStatus | null)}
        >
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter ?? "all"} onValueChange={(v) => onCountryChange(v === "all" ? null : v)}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={partnershipTierFilter ?? "all"}
          onValueChange={(v) => onPartnershipTierChange((v === "all" ? null : v) as PartnershipTier | null)}
        >
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Partnership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {PARTNERSHIP_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priceRangeFilter ?? "all"}
          onValueChange={(v) => onPriceRangeChange((v === "all" ? null : v) as PriceRange | null)}
        >
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All prices</SelectItem>
            {PRICE_RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={verificationFilter ?? "all"}
          onValueChange={(v) => onVerificationChange((v === "all" ? null : v) as VerificationStatus | null)}
        >
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-[#F5F5F5]">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {VERIFICATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
