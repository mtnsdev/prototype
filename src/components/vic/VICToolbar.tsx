"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Check, List, LayoutGrid, Plus, ChevronDown } from "lucide-react";
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

const DEBOUNCE_MS = 300;
const DEFAULT_VIC_SORT_BY = "full_name";
const DEFAULT_VIC_SORT_ORDER = "asc" as const;

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
  "flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-white/[0.06]";

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
  onClearFilters,
  bulkSelectedCount = 0,
  onBulkRunAcuity,
  onBulkDelete,
  totalCount,
  page,
  pageSize,
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

  const sortIsDefault = sortBy === DEFAULT_VIC_SORT_BY && sortOrder === DEFAULT_VIC_SORT_ORDER;

  const applySortOption = (opt: (typeof SORT_OPTIONS)[number]) => {
    onSortChange(opt.by, opt.order);
    setSortOpen(false);
  };

  const hasFilterActive = selectedCountry != null || relationshipStatus != null || acuityStatus != null;
  const hasActiveFilters = localSearch !== "" || hasFilterActive;

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  const relationshipLabel =
    relationshipStatus != null
      ? RELATIONSHIP_OPTIONS.find((o) => o.value === relationshipStatus)?.label ?? relationshipStatus
      : null;

  const acuityLabel =
    acuityStatus != null ? ACUITY_OPTIONS.find((o) => o.value === acuityStatus)?.label ?? acuityStatus : null;

  return (
    <FilterBar>
      <FilterBarPrimaryStack>
        <div className="flex w-full min-w-0 items-center gap-2 md:gap-3">
          <PageSearchField
            className="min-w-0 w-auto flex-1"
            placeholder="Search by name, company, role, city, country…"
            aria-label="Search VIC contacts"
            value={localSearch}
            onChange={setLocalSearch}
          />
          <Button
            type="button"
            variant="toolbarAccent"
            size="sm"
            onClick={() => onAddVIC?.()}
            disabled={onAddVIC == null}
            className="shrink-0"
            title={onAddVIC == null ? "Only available in My VICs" : undefined}
          >
            <Plus className="h-3.5 w-3.5" />
            Add VIC
          </Button>
        </div>

        {hasActiveFilters ? (
          <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
            {localSearch ? (
              <button type="button" className={chipBtn} onClick={() => setLocalSearch("")} aria-label="Clear search">
                &quot;{localSearch.slice(0, 24)}
                {localSearch.length > 24 ? "…" : ""}&quot;
                <span className="text-muted-foreground">✕</span>
              </button>
            ) : null}
            {selectedCountry ? (
              <button type="button" className={chipBtn} onClick={() => onCountryChange(null)} aria-label="Clear country">
                Country: {selectedCountry}
                <span className="text-muted-foreground">✕</span>
              </button>
            ) : null}
            {relationshipStatus ? (
              <button
                type="button"
                className={chipBtn}
                onClick={() => onRelationshipStatusChange(null)}
                aria-label="Clear status"
              >
                Status: {relationshipLabel ?? relationshipStatus}
                <span className="text-muted-foreground">✕</span>
              </button>
            ) : null}
            {acuityStatus ? (
              <button type="button" className={chipBtn} onClick={() => onAcuityStatusChange(null)} aria-label="Clear acuity">
                Acuity: {acuityLabel ?? acuityStatus}
                <span className="text-muted-foreground">✕</span>
              </button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-muted-foreground"
              onClick={onClearFilters}
            >
              Clear all
            </Button>
          </div>
        ) : null}
      </FilterBarPrimaryStack>

      <FilterBarToolbarRow>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div ref={sortWrapRef} className="relative">
            <button
              type="button"
              aria-label={`Sort VICs. Current: ${sortOption.label}`}
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
                className="absolute left-0 top-full z-50 mt-1 w-[220px] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-2xl"
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

          <Select value={selectedCountry ?? "all"} onValueChange={(v) => onCountryChange(v === "all" ? null : v)}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,140px)] max-w-[180px]",
                selectedCountry != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Country">
                {selectedCountry != null ? selectedCountry : "Country"}
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
              <SelectValue placeholder="Relationship">
                {relationshipLabel != null ? relationshipLabel : "Relationship"}
              </SelectValue>
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
              <SelectValue placeholder="Acuity">
                {acuityLabel != null ? acuityLabel : "Acuity"}
              </SelectValue>
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
        </div>

        <FilterBarActionsCluster>
          <span className="text-2xs text-muted-foreground">
            {totalCount === 0
              ? "0 VICs"
              : `${totalCount} VIC${totalCount !== 1 ? "s" : ""} · ${rangeStart}–${rangeEnd}`}
          </span>
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
          {bulkSelectedCount > 0 && (onBulkRunAcuity != null || onBulkDelete != null) ? (
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
              {bulkMenuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-2xl">
                  {onBulkRunAcuity ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
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
              ) : null}
            </div>
          ) : null}
        </FilterBarActionsCluster>
      </FilterBarToolbarRow>
    </FilterBar>
  );
}
