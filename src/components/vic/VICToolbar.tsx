"use client";

import { useMemo, useState } from "react";
import type { AcuityStatus, RelationshipStatus } from "@/types/vic";

type VicViewMode = "list" | "cards";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  FilterBar,
  FilterBarPrimaryStack,
  FilterBarToolbarRow,
  FilterBarActionsCluster,
} from "@/components/ui/filter-bar";
import { PageSearchField } from "@/components/ui/page-search-field";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  LayoutGrid,
  List,
  ListFilter,
  MoreHorizontal,
} from "lucide-react";

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Belgium",
  "Ireland",
  "New Zealand",
  "Singapore",
  "South Korea",
  "South Africa",
  "Argentina",
  "Chile",
  "Colombia",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Greece",
  "Portugal",
  "Turkey",
  "Israel",
  "United Arab Emirates",
  "Saudi Arabia",
  "Egypt",
  "Nigeria",
  "Kenya",
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Taiwan",
  "Hong Kong",
  "Russia",
  "Ukraine",
];

interface VICToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCountry: string | null;
  onCountryChange: (country: string | null) => void;
  relationshipStatus: RelationshipStatus | null;
  onRelationshipStatusChange: (status: RelationshipStatus | null) => void;
  acuityStatus: AcuityStatus | null;
  onAcuityStatusChange: (status: AcuityStatus | null) => void;
  viewMode: VicViewMode;
  onViewModeChange: (mode: VicViewMode) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  totalCount: number;
  page: number;
  pageSize: number;
  onClearFilters: () => void;
  onClearFacetFilters: () => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onBulkAcuity?: () => void;
  onBulkShare?: () => void;
  canBulkDelete?: boolean;
  canBulkAcuity?: boolean;
  canBulkShare?: boolean;
}

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
  totalCount,
  page,
  pageSize,
  onClearFilters,
  onClearFacetFilters,
  selectedCount = 0,
  onBulkDelete,
  onBulkAcuity,
  onBulkShare,
  canBulkDelete = false,
  canBulkAcuity = false,
  canBulkShare = false,
}: VICToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const facetCount =
    (selectedCountry ? 1 : 0) +
    (relationshipStatus ? 1 : 0) +
    (acuityStatus ? 1 : 0);

  const hasFacetFilters = facetCount > 0;

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (selectedCountry) {
      chips.push({
        key: "country",
        label: `Country: ${selectedCountry}`,
        onRemove: () => onCountryChange(null),
      });
    }
    if (relationshipStatus) {
      chips.push({
        key: "relationship",
        label: `Relationship: ${relationshipStatus}`,
        onRemove: () => onRelationshipStatusChange(null),
      });
    }
    if (acuityStatus) {
      chips.push({
        key: "acuity",
        label: `Acuity: ${acuityStatus}`,
        onRemove: () => onAcuityStatusChange(null),
      });
    }
    return chips;
  }, [
    selectedCountry,
    relationshipStatus,
    acuityStatus,
    onCountryChange,
    onRelationshipStatusChange,
    onAcuityStatusChange,
  ]);

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  const sortLabel =
    sortBy === "full_name"
      ? "Name"
      : sortBy === "email"
        ? "Email"
        : sortBy === "created_at"
          ? "Created"
          : sortBy === "updated_at"
            ? "Updated"
            : sortBy === "acuity_status"
              ? "Acuity"
              : sortBy === "relationship_status"
                ? "Relationship"
                : "Sort";

  return (
    <FilterBar className="mb-3 border-b border-border/60 pb-3">
      <FilterBarPrimaryStack>
        <PageSearchField
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by name, email, or company…"
          aria-label="Search VICs"
        />
      </FilterBarPrimaryStack>

      {activeFilterChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted/60"
            >
              <span>{chip.label}</span>
              <span className="text-muted-foreground" aria-hidden>
                ×
              </span>
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearFilters}>
            Clear all
          </Button>
        </div>
      )}

      <FilterBarToolbarRow className="mt-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 px-2.5 text-xs">
                Sort: {sortLabel}
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3 text-muted-foreground" aria-hidden />
                ) : (
                  <ArrowDown className="h-3 w-3 text-muted-foreground" aria-hidden />
                )}
                <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {(
                [
                  ["full_name", "Name"],
                  ["email", "Email"],
                  ["created_at", "Created"],
                  ["updated_at", "Updated"],
                  ["relationship_status", "Relationship"],
                  ["acuity_status", "Acuity"],
                ] as const
              ).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() =>
                    onSortChange(
                      key,
                      sortBy === key ? (sortOrder === "asc" ? "desc" : "asc") : "asc"
                    )
                  }
                  className="flex items-center justify-between"
                >
                  {label}
                  {sortBy === key &&
                    (sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" aria-hidden />
                    ) : (
                      <ArrowDown className="h-3 w-3" aria-hidden />
                    ))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 shrink-0 gap-1.5 px-2.5 text-xs",
                  hasFacetFilters && "border-brand/40 bg-brand/5 text-foreground"
                )}
              >
                <ListFilter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                Filters
                {facetCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium tabular-nums text-foreground">
                    {facetCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(100vw-2rem,20rem)] p-4" sideOffset={6}>
              <p className="text-xs font-semibold text-foreground">Narrow results</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Country, relationship, and acuity</p>
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Select
                    value={selectedCountry ?? "all"}
                    onValueChange={(v) => onCountryChange(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="All countries" />
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
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Relationship</Label>
                  <Select
                    value={relationshipStatus ?? "all"}
                    onValueChange={(v) =>
                      onRelationshipStatusChange(v === "all" ? null : (v as RelationshipStatus))
                    }
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="All relationships" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All relationships</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                      <SelectItem value="do_not_contact">Do not contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Acuity</Label>
                  <Select
                    value={acuityStatus ?? "all"}
                    onValueChange={(v) => onAcuityStatusChange(v === "all" ? null : (v as AcuityStatus))}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="All acuity states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All acuity states</SelectItem>
                      <SelectItem value="not_run">Not run</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!hasFacetFilters}
                  onClick={() => {
                    onClearFacetFilters();
                  }}
                >
                  Reset filters
                </Button>
                <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={() => setFiltersOpen(false)}>
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <FilterBarActionsCluster>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {totalCount === 0 ? "No results" : `${startIndex}–${endIndex} of ${totalCount}`}
          </span>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => onViewModeChange("list")}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => onViewModeChange("cards")}
              aria-label="Card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                disabled={selectedCount === 0}
              >
                <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                Bulk
                {selectedCount > 0 ? (
                  <span className="ml-0.5 rounded bg-muted px-1 text-[10px] font-medium tabular-nums">
                    {selectedCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled={!canBulkAcuity || selectedCount === 0} onClick={onBulkAcuity}>
                Run Acuity
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canBulkShare || selectedCount === 0} onClick={onBulkShare}>
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canBulkDelete || selectedCount === 0}
                className="text-destructive focus:text-destructive"
                onClick={onBulkDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FilterBarActionsCluster>
      </FilterBarToolbarRow>

      <div className="mt-1 sm:hidden">
        <p className="text-xs text-muted-foreground">
          {totalCount === 0 ? "No results" : `${startIndex}–${endIndex} of ${totalCount}`}
        </p>
      </div>
    </FilterBar>
  );
}
