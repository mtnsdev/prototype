"use client";

import { useState, useEffect, useRef } from "react";
import { Search, List, LayoutGrid, Plus } from "lucide-react";
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
import type { ItineraryStatus } from "@/types/itinerary";

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

type Props = {
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
  viewMode: "list" | "cards";
  onViewModeChange: (v: "list" | "cards") => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
  onCreateItinerary: () => void;
  onClearFilters: () => void;
};

export default function ItineraryToolbar({
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
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onCreateItinerary,
  onClearFilters,
}: Props) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(localSearch), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, onSearchChange]);

  const sortValue = SORT_OPTIONS.find((o) => o.by === sortBy && o.order === sortOrder)?.value ?? "updated_desc";

  const handleSortValue = (value: string) => {
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (opt) onSortChange(opt.by, opt.order);
  };

  const hasFilters =
    localSearch !== "" ||
    statusFilter != null ||
    destinationFilter != null ||
    vicFilter != null ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]">
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,245,245,0.4)]" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search itineraries…"
          className="pl-8 bg-white/5 border-white/10 text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] h-9"
        />
      </div>
      <Select value={statusFilter ?? "all"} onValueChange={(v) => onStatusChange(v === "all" ? null : (v as ItineraryStatus))}>
        <SelectTrigger className="w-[130px] h-9 bg-white/5 border-white/10 text-[#F5F5F5]">
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
      <Input
        value={destinationFilter ?? ""}
        onChange={(e) => onDestinationChange(e.target.value || null)}
        placeholder="Destination"
        className="w-[140px] h-9 bg-white/5 border-white/10 text-[#F5F5F5]"
      />
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="w-[140px] h-9 bg-white/5 border-white/10 text-[#F5F5F5]"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="w-[140px] h-9 bg-white/5 border-white/10 text-[#F5F5F5]"
      />
      <Select value={sortValue} onValueChange={handleSortValue}>
        <SelectTrigger className="w-[160px] h-9 bg-white/5 border-white/10 text-[#F5F5F5]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-0.5 rounded-lg border border-white/10 p-0.5 bg-white/5">
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={cn(
            "p-1.5 rounded",
            viewMode === "list" ? "bg-white/10 text-[#F5F5F5]" : "text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]"
          )}
          title="List view"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("cards")}
          className={cn(
            "p-1.5 rounded",
            viewMode === "cards" ? "bg-white/10 text-[#F5F5F5]" : "text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]"
          )}
          title="Card view"
        >
          <LayoutGrid size={16} />
        </button>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-[rgba(245,245,245,0.7)]">
          Clear filters
        </Button>
      )}
      <Button onClick={onCreateItinerary} className="gap-2 ml-auto">
        <Plus size={16} />
        Create Itinerary
      </Button>
    </div>
  );
}
