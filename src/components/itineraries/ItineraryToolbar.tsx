"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowUpDown, Check, ChevronDown, List, LayoutGrid, Plus, Columns3 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  directoryFilterTextInputClass,
  PageSearchField,
} from "@/components/ui/page-search-field";
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

const SORT_OPTIONS: { value: string; label: string; by: string; order: "asc" | "desc" }[] = [
  { value: "date_desc", label: "Date (newest)", by: "trip_start_date", order: "desc" },
  { value: "date_asc", label: "Date (oldest)", by: "trip_start_date", order: "asc" },
  { value: "name_asc", label: "Name (A-Z)", by: "trip_name", order: "asc" },
  { value: "name_desc", label: "Name (Z-A)", by: "trip_name", order: "desc" },
  { value: "status_asc", label: "Status", by: "status", order: "asc" },
  { value: "updated_desc", label: "Recently updated", by: "updated_at", order: "desc" },
];

const pillBase =
  "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] whitespace-nowrap transition-colors";

type Props = {
  activeTab: "mine" | "agency";
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: ItineraryStatus | null;
  onStatusChange: (v: ItineraryStatus | null) => void;
  destinationFilter: string | null;
  onDestinationChange: (v: string | null) => void;
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
  destinationFilter,
  onDestinationChange,
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
      const tab = activeTab === "agency" ? "agency" : "mine";
      const res = await fetchVICList({ tab, limit: 400, page: 1 });
      setVicOptions(res.vics ?? []);
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

  const applySortOption = (opt: (typeof SORT_OPTIONS)[number]) => {
    onSortChange(opt.by, opt.order);
    setSortOpen(false);
  };

  const vicLabel =
    vicOptions.find((v) => getVICId(v) === vicFilter)?.full_name ??
    vicOptions.find((v) => getVICId(v) === vicFilter)?.preferred_name ??
    null;

  const stages = PIPELINE_STAGES.filter((s) => s.key !== "archived");

  return (
    <div className="mb-4 space-y-2 border-b border-[rgba(255,255,255,0.03)] pb-4">
      <div className="flex flex-col gap-3">
        <PageSearchField
          placeholder="Search itineraries…"
          aria-label="Search itineraries"
          value={localSearch}
          onChange={setLocalSearch}
        />
        <div className="-mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              onPipelineFilterChange(null);
              onUpcomingTripsChange(false);
            }}
            className={cn(
              pillBase,
              !pipelineFilter && !upcomingTrips
                ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "border-transparent text-[#6B6560] hover:text-[#9B9590]"
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
            className={cn(
              pillBase,
              upcomingTrips
                ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                : "border-transparent text-[#6B6560] hover:text-[#9B9590]"
            )}
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
                className={cn(
                  pillBase,
                  active
                    ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
                    : "border-transparent text-[#6B6560] hover:text-[#9B9590]"
                )}
              >
                {stage.label}
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-[#A08F72]" : "text-[#4A4540]"
                  )}
                >
                  {stageCounts[stage.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Select value={statusFilter ?? "all"} onValueChange={(v) => onStatusChange(v === "all" ? null : (v as ItineraryStatus))}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "w-[min(100%,130px)] max-w-[160px]",
                statusFilter != null && directoryFilterSelectTriggerActiveClass
              )}
            >
              <SelectValue placeholder="Status" />
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
              <SelectValue placeholder="All clients">{vicFilter ? vicLabel ?? vicFilter : undefined}</SelectValue>
            </SelectTrigger>
            <SelectContent className={cn(directoryFilterSelectContentClass, "max-h-64")}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All clients
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
          <Input
            value={destinationFilter ?? ""}
            onChange={(e) => onDestinationChange(e.target.value || null)}
            placeholder="Destination"
            className={cn(
              directoryFilterTextInputClass,
              "w-[min(100%,140px)] max-w-[180px]",
              Boolean(destinationFilter?.trim()) && directoryFilterSelectTriggerActiveClass
            )}
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={cn(directoryFilterTextInputClass, "w-[140px]", dateFrom !== "" && directoryFilterSelectTriggerActiveClass)}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={cn(directoryFilterTextInputClass, "w-[140px]", dateTo !== "" && directoryFilterSelectTriggerActiveClass)}
          />
          <div ref={sortWrapRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.03)] bg-[#0c0c12] px-2.5 py-1.5 text-[11px] text-[#9B9590] transition-colors hover:border-[rgba(255,255,255,0.06)]"
            >
              <ArrowUpDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
              <span className="min-w-0 truncate !text-[#F5F0EB]">{sortOption.label}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
            </button>
            {sortOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1 w-[200px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e0e14] py-1 shadow-2xl"
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
                        "flex w-full items-center justify-between px-3 py-2 text-left text-[11px] transition-colors hover:bg-white/[0.04]",
                        selected ? "text-[#C9A96E]" : "text-[#9B9590]"
                      )}
                    >
                      {o.label}
                      {selected ? <Check className="h-3 w-3 text-[#C9A96E]" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-[rgba(255,255,255,0.03)] min-[1100px]:border-l min-[1100px]:pl-3">
          <span className="text-[10px] text-[#6B6560]">
            {resultTotal} {resultTotal === 1 ? "itinerary" : "itineraries"}
          </span>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "list" ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]" : "text-[#4A4540] hover:text-[#9B9590]"
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
              viewMode === "cards" ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]" : "text-[#4A4540] hover:text-[#9B9590]"
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
              viewMode === "board" ? "bg-[rgba(201,169,110,0.08)] text-[#C9A96E]" : "text-[#4A4540] hover:text-[#9B9590]"
            )}
            title="Board (Kanban)"
          >
            <Columns3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCreateItinerary}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] px-2.5 py-1.5 text-[11px] text-[#C9A96E] transition-colors hover:border-[rgba(201,169,110,0.28)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}
