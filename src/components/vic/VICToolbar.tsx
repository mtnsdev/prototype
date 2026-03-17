"use client";

import { useState, useEffect, useRef } from "react";
import { Search, List, LayoutGrid, Plus, Upload, Download, X, SlidersHorizontal, ChevronDown } from "lucide-react";
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

const DEBOUNCE_MS = 300;
const COUNTRIES = ["France", "United Kingdom", "United States", "Switzerland", "Monaco"];
const RELATIONSHIP_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
  { value: "past", label: "Past" },
  { value: "do_not_contact", label: "Do not contact" },
];
const ACUITY_OPTIONS = [
  { value: "not_run", label: "Not run" },
  { value: "running", label: "Running" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Failed" },
];
type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedCountry: string | null;
  onCountryChange: (v: string | null) => void;
  relationshipStatus: string | null;
  onRelationshipStatusChange: (v: string | null) => void;
  acuityStatus: string | null;
  onAcuityStatusChange: (v: string | null) => void;
  viewMode: "list" | "cards";
  onViewModeChange: (v: "list" | "cards") => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
  onAddVIC?: () => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
  onClearFilters: () => void;
  bulkSelectedCount?: number;
  onBulkRunAcuity?: () => void;
  onBulkDelete?: () => void;
};

const SORT_OPTIONS: { value: string; label: string; by: string; order: "asc" | "desc" }[] = [
  { value: "name_asc", label: "Name (A-Z)", by: "full_name", order: "asc" },
  { value: "name_desc", label: "Name (Z-A)", by: "full_name", order: "desc" },
  { value: "updated_desc", label: "Recently updated", by: "updated_at", order: "desc" },
  { value: "created_desc", label: "Recently created", by: "created_at", order: "desc" },
  { value: "status_asc", label: "Relationship status", by: "relationship_status", order: "asc" },
  { value: "acuity_asc", label: "Acuity status", by: "acuity_status", order: "asc" },
];

export default function VICToolbar({
  searchQuery,
  onSearchChange,
  selectedCountry,
  onCountryChange,
  relationshipStatus,
  onRelationshipStatusChange,
  acuityStatus,
  onAcuityStatusChange,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onAddVIC,
  onImportCSV,
  onExportCSV,
  onClearFilters,
  bulkSelectedCount = 0,
  onBulkRunAcuity,
  onBulkDelete,
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
    const t = setTimeout(() => {
      onSearchChange(localSearch);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setBulkMenuOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const filterCount = [selectedCountry, relationshipStatus, acuityStatus].filter(Boolean).length;
  const hasFilterActive = filterCount > 0;
  const hasActiveFilters = localSearch !== "" || hasFilterActive;

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]">
      {/* Search only on first row - primary action */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,245,0.4)] pointer-events-none" />
          <Input
            placeholder="Search by name, company, role, city, country..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 h-9 w-full"
          />
        </div>
        <div className="relative shrink-0" ref={filtersRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 border-[rgba(255,255,255,0.12)] bg-transparent text-[rgba(245,245,245,0.8)]",
              hasFilterActive && "border-white/20"
            )}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasFilterActive && (
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium">
                {filterCount}
              </span>
            )}
          </Button>
          {filtersOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[#141414] p-3 shadow-xl space-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Country</p>
                <Select value={selectedCountry ?? "all"} onValueChange={(v) => onCountryChange(v === "all" ? null : v)}>
                  <SelectTrigger className="h-8 w-full border-white/10 bg-white/5">
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Relationship status</p>
                <Select value={relationshipStatus ?? "all"} onValueChange={(v) => onRelationshipStatusChange(v === "all" ? null : v)}>
                  <SelectTrigger className="h-8 w-full border-white/10 bg-white/5">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {RELATIONSHIP_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Acuity status</p>
                <Select value={acuityStatus ?? "all"} onValueChange={(v) => onAcuityStatusChange(v === "all" ? null : v)}>
                  <SelectTrigger className="h-8 w-full border-white/10 bg-white/5">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {ACUITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {localSearch && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-[rgba(245,245,245,0.9)]">
              &quot;{localSearch}&quot;
              <button type="button" onClick={() => setLocalSearch("")} className="hover:opacity-80 rounded-full p-0.5" aria-label="Clear search">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCountry && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-[rgba(245,245,245,0.9)]">
              Country: {selectedCountry}
              <button type="button" onClick={() => onCountryChange(null)} className="hover:opacity-80 rounded-full p-0.5" aria-label="Clear country">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {relationshipStatus && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-[rgba(245,245,245,0.9)]">
              Status: {RELATIONSHIP_OPTIONS.find((o) => o.value === relationshipStatus)?.label ?? relationshipStatus}
              <button type="button" onClick={() => onRelationshipStatusChange(null)} className="hover:opacity-80 rounded-full p-0.5" aria-label="Clear status">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {acuityStatus && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-[rgba(245,245,245,0.9)]">
              Acuity: {ACUITY_OPTIONS.find((o) => o.value === acuityStatus)?.label ?? acuityStatus}
              <button type="button" onClick={() => onAcuityStatusChange(null)} className="hover:opacity-80 rounded-full p-0.5" aria-label="Clear acuity">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs text-[rgba(245,245,245,0.6)] hover:text-[#F5F5F5]" onClick={onClearFilters}>
            Clear all
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
            <Button variant="ghost" size="sm" onClick={() => onViewModeChange("list")} className={cn("gap-1.5 h-8", viewMode === "list" && "bg-white/10 text-[#F5F5F5]")}>
              <List size={16} />
              List
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onViewModeChange("cards")} className={cn("gap-1.5 h-8", viewMode === "cards" && "bg-white/10 text-[#F5F5F5]")}>
              <LayoutGrid size={16} />
              Cards
            </Button>
          </div>
          <Select value={sortValue} onValueChange={handleSortValue}>
            <SelectTrigger className="h-9 w-[180px] border-[rgba(255,255,255,0.12)] bg-transparent text-[rgba(245,245,245,0.9)]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {bulkSelectedCount > 0 && (onBulkRunAcuity != null || onBulkDelete != null) && (
            <div className="relative" ref={bulkMenuRef}>
              <Button variant="outline" size="sm" className="gap-1.5 border-[var(--muted-amber-border)] text-[var(--muted-amber-text)]" onClick={() => setBulkMenuOpen((o) => !o)}>
                {bulkSelectedCount} selected
                <ChevronDown size={14} />
              </Button>
              {bulkMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[#141414] py-1 shadow-xl">
                  {onBulkRunAcuity && (
                    <button type="button" className="w-full px-3 py-2 text-left text-sm text-[rgba(245,245,245,0.9)] hover:bg-white/10" onClick={() => { onBulkRunAcuity(); setBulkMenuOpen(false); }}>
                      Run Acuity
                    </button>
                  )}
                  {onBulkDelete && (
                    <button type="button" className="w-full px-3 py-2 text-left text-sm text-[var(--muted-error-text)] hover:bg-[var(--muted-error-bg)]" onClick={() => { onBulkDelete(); setBulkMenuOpen(false); }}>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {onAddVIC != null && (
            <Button onClick={onAddVIC} className="gap-2">
              <Plus size={16} />
              Add VIC
            </Button>
          )}
          <Button variant="outline" onClick={onImportCSV} className="gap-2">
            <Upload size={16} />
            Import
          </Button>
          <Button variant="outline" onClick={onExportCSV} className="gap-2">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
