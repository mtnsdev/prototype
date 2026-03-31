"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowUpDown, Check, ChevronDown, List, LayoutGrid, Plus, Columns3 } from "lucide-react";
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
  FilterChipScrollRow,
} from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import {
  directoryFilterSelectContentClass,
  directoryFilterSelectItemClass,
  directoryFilterSelectTriggerActiveClass,
  directoryFilterSelectTriggerClass,
  PageSearchField,
} from "@/components/ui/page-search-field";
import ProductDirectoryLocationDropdown from "@/components/products/ProductDirectoryLocationDropdown";
import ItineraryDateRangeDropdown from "./ItineraryDateRangeDropdown";
import type { ItineraryStatus } from "@/types/itinerary";
import type { PipelineStage } from "@/types/itinerary";
import { PIPELINE_STAGES } from "@/config/pipelineStages";
import { fetchVICList, getVICId } from "@/lib/vic-api";
import type { VIC } from "@/types/vic";

const DEBOUNCE_MS = 300;

const STATUS_OPTIONS: { value: ItineraryStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "proposed", label: "Proposed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DEFAULT_ITINERARY_SORT_BY = "updated_at";
const DEFAULT_ITINERARY_SORT_ORDER = "desc" as const;

const SORT_OPTIONS: { value: string; label: string; by: string; order: "asc" | "desc" }[] = [
  { value: "date_desc", label: "Date (newest)", by: "trip_start_date", order: "desc" },
  { value: "date_asc", label: "Date (oldest)", by: "trip_start_date", order: "asc" },
  { value: "name_asc", label: "Name (A-Z)", by: "trip_name", order: "asc" },
  { value: "name_desc", label: "Name (Z-A)", by: "trip_name", order: "desc" },
  { value: "status_asc", label: "Status", by: "status", order: "asc" },
  { value: "updated_desc", label: "Recently updated", by: "updated_at", order: "desc" },
];

const pillBase =
  "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-2xs whitespace-nowrap transition-colors";

const filterChipActive =
  "border-brand-cta/25 bg-brand-cta/10 text-brand-cta";
const filterChipInactive =
  "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground";

type Props = {
  activeTab: "mine" | "agency";
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: ItineraryStatus | null;
  onStatusChange: (v: ItineraryStatus | null) => void;
  destinationCountries: string[];
  onDestinationCountriesChange: (v: string[]) => void;
  vicFilter: string | null;
  onVicChange: (v: string | null) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  pipelineFilter: PipelineStage | null;
  onPipelineFilterChange: (v: PipelineStage | null) => void;
  upcomingTrips: boolean;
  onUpcomingTripsChange: (v: boolean) => void;
  stageCounts: Partial<Record<PipelineStage, number>>;
  viewMode: "list" | "cards" | "board";
  onViewModeChange: (v: "list" | "cards" | "board") => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
  onCreateItinerary: () => void;
  resultTotal: number;
};

export default function ItineraryToolbar({
  activeTab,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  destinationCountries,
  onDestinationCountriesChange,
  vicFilter,
  onVicChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  pipelineFilter,
  onPipelineFilterChange,
  upcomingTrips,
  onUpcomingTripsChange,
  stageCounts,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onCreateItinerary,
  resultTotal,
}: Props) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [vicOptions, setVicOptions] = useState<VIC[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  const loadVics = useCallback(async () => {
    try {
      if (activeTab === "agency") {
        const [mineRes, sharedRes] = await Promise.all([
          fetchVICList({ tab: "mine", limit: 400, page: 1 }),
          fetchVICList({ tab: "shared", limit: 400, page: 1 }),
        ]);
        const byId = new Map<string, VIC>();
        for (const v of [...(mineRes.vics ?? []), ...(sharedRes.vics ?? [])]) {
          byId.set(getVICId(v), v);
        }
        setVicOptions([...byId.values()]);
      } else {
        const res = await fetchVICList({ tab: "mine", limit: 400, page: 1 });
        setVicOptions(res.vics ?? []);
      }
    } catch {
      setVicOptions([]);
    }
  }, [activeTab]);

  useEffect(() => {
    loadVics();
  }, [loadVics]);

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
    SORT_OPTIONS.find((o) => o.value === "updated_desc")!;

  const sortIsDefault =
    sortBy === DEFAULT_ITINERARY_SORT_BY && sortOrder === DEFAULT_ITINERARY_SORT_ORDER;

  const applySortOption = (opt: (typeof SORT_OPTIONS)[number]) => {
    onSortChange(opt.by, opt.order);
    setSortOpen(false);
  };

  const vicLabel =
    vicOptions.find((v) => getVICId(v) === vicFilter)?.full_name ??
    vicOptions.find((v) => getVICId(v) === vicFilter)?.preferred_name ??
    null;

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? null;

  const stages = PIPELINE_STAGES.filter((s) => s.key !== "archived");

  return (
    <FilterBar>
      <FilterBarPrimaryStack>
        <div className="flex w-full min-w-0 items-center gap-2 md:gap-3">
          <PageSearchField
            className="min-w-0 w-auto flex-1"
            placeholder="Search itineraries…"
            aria-label="Search itineraries"
            value={localSearch}
            onChange={setLocalSearch}
          />
          <Button type="button" variant="toolbarAccent" size="sm" className="shrink-0" onClick={onCreateItinerary}>
            <Plus className="h-3.5 w-3.5" />
            Create Itinerary
          </Button>
        </div>
        <FilterChipScrollRow>
          <button
            type="button"
            onClick={() => {
              onPipelineFilterChange(null);
              onUpcomingTripsChange(false);
            }}
            className={cn(
              pillBase,
              !pipelineFilter && !upcomingTrips ? filterChipActive : filterChipInactive
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              onPipelineFilterChange(null);
              onUpcomingTripsChange(true);
            }}
            className={cn(pillBase, upcomingTrips ? filterChipActive : filterChipInactive)}
          >
            Upcoming trips
          </button>
          {stages.map((stage) => {
            const active = !upcomingTrips && pipelineFilter === stage.key;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => {
                  onUpcomingTripsChange(false);
                  onPipelineFilterChange(stage.key);
                }}
                className={cn(pillBase, active ? filterChipActive : filterChipInactive)}
              >
                {stage.label}
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-brand-cta/75" : "text-muted-foreground/65"
                  )}
                >
                  {stageCounts[stage.key] ?? 0}
                </span>
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
              aria-label={`Sort itineraries. Current: ${sortOption.label}`}
              onClick={() => setSortOpen((o) => !o)}
              className={cn(
                "flex max-w-[220px] min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                sortIsDefault
                  ? "border-border bg-popover text-muted-foreground hover:border-border"
                  : "border-brand-cta/20 bg-brand-cta/10 text-brand-cta"
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
                        "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40",
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
          <Select value={statusFilter ?? "all"} onValueChange={(v) => onStatusChange(v === "all" ? null : (v as ItineraryStatus))}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[160px]",
                statusFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Status">
                {statusFilter != null && statusLabel != null ? statusLabel : "Status"}
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
          <Select value={vicFilter ?? "all"} onValueChange={(v) => onVicChange(v === "all" ? null : v)}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "min-w-[120px] max-w-[200px]",
                vicFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="VIC">
                {vicFilter != null ? vicLabel ?? vicFilter : "VIC"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={cn(directoryFilterSelectContentClass, "max-h-64")}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All VICs
              </SelectItem>
              {vicOptions.map((v) => {
                const id = getVICId(v);
                return (
                  <SelectItem key={id} className={directoryFilterSelectItemClass} value={id}>
                    {v.full_name || v.preferred_name || id}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <ProductDirectoryLocationDropdown
            selectedCountries={destinationCountries}
            onChange={onDestinationCountriesChange}
          />
          <ItineraryDateRangeDropdown
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={onDateFromChange}
            onDateToChange={onDateToChange}
          />
        </div>
        <FilterBarActionsCluster>
          <span className="text-2xs text-muted-foreground">
            {resultTotal} {resultTotal === 1 ? "itinerary" : "itineraries"}
          </span>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "list" ? "bg-brand-cta/10 text-brand-cta" : "text-muted-foreground/65 hover:text-muted-foreground hover:bg-muted/30"
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "cards" ? "bg-brand-cta/10 text-brand-cta" : "text-muted-foreground/65 hover:text-muted-foreground hover:bg-muted/30"
            )}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("board")}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "board" ? "bg-brand-cta/10 text-brand-cta" : "text-muted-foreground/65 hover:text-muted-foreground hover:bg-muted/30"
            )}
            title="Board (Kanban)"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </FilterBarActionsCluster>
      </FilterBarToolbarRow>
    </FilterBar>
  );
}
