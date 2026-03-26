"use client";

import { useState, useEffect, useRef } from "react";
import { List, LayoutGrid, Plus, Upload, Download, ChevronDown } from "lucide-react";
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
  directoryFilterSelectContentClass,
  directoryFilterSelectItemClass,
  directoryFilterSelectTriggerActiveClass,
  directoryFilterSelectTriggerClass,
  PageSearchField,
} from "@/components/ui/page-search-field";

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

const chipBtn =
  "flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-[#9B9590] transition-colors hover:bg-white/[0.06]";

const outlineToolbarBtnClass =
  "h-8 gap-1.5 border-white/10 px-2.5 text-[11px] text-[#F5F5F5] hover:bg-white/[0.04]";

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
  totalCount: number;
  page: number;
  pageSize: number;
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
  totalCount,
  page,
  pageSize,
}: Props) {
  const sortValue = SORT_OPTIONS.find((o) => o.by === sortBy && o.order === sortOrder)?.value ?? "name_asc";
  const handleSortValue = (value: string) => {
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (opt) onSortChange(opt.by, opt.order);
  };
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
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
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setBulkMenuOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const hasFilterActive = selectedCountry != null || relationshipStatus != null || acuityStatus != null;
  const hasActiveFilters = localSearch !== "" || hasFilterActive;

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="mb-4 space-y-2 border-b border-[rgba(255,255,255,0.03)] pb-4">
      <div className="flex flex-col gap-3">
        <PageSearchField
          placeholder="Search by name, company, role, city, country…"
          aria-label="Search VIC contacts"
          value={localSearch}
          onChange={setLocalSearch}
        />
      </div>

      {hasActiveFilters ? (
        <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
          {localSearch ? (
            <button type="button" className={chipBtn} onClick={() => setLocalSearch("")} aria-label="Clear search">
              &quot;{localSearch.slice(0, 24)}
              {localSearch.length > 24 ? "…" : ""}&quot;
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {selectedCountry ? (
            <button type="button" className={chipBtn} onClick={() => onCountryChange(null)} aria-label="Clear country">
              Country: {selectedCountry}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {relationshipStatus ? (
            <button
              type="button"
              className={chipBtn}
              onClick={() => onRelationshipStatusChange(null)}
              aria-label="Clear status"
            >
              Status: {RELATIONSHIP_OPTIONS.find((o) => o.value === relationshipStatus)?.label ?? relationshipStatus}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {acuityStatus ? (
            <button type="button" className={chipBtn} onClick={() => onAcuityStatusChange(null)} aria-label="Clear acuity">
              Acuity: {ACUITY_OPTIONS.find((o) => o.value === acuityStatus)?.label ?? acuityStatus}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] text-[#6B6560] hover:text-[#9B9590]"
            onClick={onClearFilters}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Select value={selectedCountry ?? "all"} onValueChange={(v) => onCountryChange(v === "all" ? null : v)}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,140px)] max-w-[180px]",
                selectedCountry != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Country" />
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
            value={relationshipStatus ?? "all"}
            onValueChange={(v) => onRelationshipStatusChange(v === "all" ? null : v)}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,150px)] max-w-[200px]",
                relationshipStatus != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Relationship" />
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All statuses
              </SelectItem>
              {RELATIONSHIP_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={acuityStatus ?? "all"} onValueChange={(v) => onAcuityStatusChange(v === "all" ? null : v)}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[160px]",
                acuityStatus != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Acuity" />
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All
              </SelectItem>
              {ACUITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortValue} onValueChange={handleSortValue}>
            <SelectTrigger className={cn(directoryFilterSelectTriggerClass, "w-[min(100%,180px)] max-w-[220px]")}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} className={directoryFilterSelectItemClass} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-[1100px]:border-l min-[1100px]:border-[rgba(255,255,255,0.03)] min-[1100px]:pl-3">
          <span className="text-[10px] text-[#6B6560]">
            {totalCount === 0
              ? "0 VICs"
              : `${totalCount} VIC${totalCount !== 1 ? "s" : ""} · ${rangeStart}–${rangeEnd}`}
          </span>
          <button
            type="button"
            title="List view"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "list" ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]" : "text-[#4A4540] hover:text-[#9B9590]"
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
              viewMode === "cards" ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]" : "text-[#4A4540] hover:text-[#9B9590]"
            )}
            onClick={() => onViewModeChange("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          {bulkSelectedCount > 0 && (onBulkRunAcuity != null || onBulkDelete != null) ? (
            <div className="relative" ref={bulkMenuRef}>
              <button
                type="button"
                onClick={() => setBulkMenuOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors",
                  "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                )}
              >
                {bulkSelectedCount} selected
                <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
              </button>
              {bulkMenuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e0e14] py-1 shadow-2xl">
                  {onBulkRunAcuity ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-white/[0.04] hover:text-[#F5F0EB]"
                      onClick={() => {
                        onBulkRunAcuity();
                        setBulkMenuOpen(false);
                      }}
                    >
                      Run Acuity
                    </button>
                  ) : null}
                  {onBulkDelete ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-[11px] text-[var(--muted-error-text)] hover:bg-[var(--muted-error-bg)]"
                      onClick={() => {
                        onBulkDelete();
                        setBulkMenuOpen(false);
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {onAddVIC != null ? (
            <Button onClick={onAddVIC} size="sm" className="h-8 gap-1.5 text-[11px]">
              <Plus className="h-3.5 w-3.5" />
              Add VIC
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onImportCSV} className={outlineToolbarBtnClass}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCSV} className={outlineToolbarBtnClass}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
