"use client";

import Link from "next/link";
import { User } from "lucide-react";
import type { Itinerary } from "@/types/itinerary";
import { getItineraryId } from "@/lib/itineraries-api";
import { ITINERARY_STATUS_BADGES, formatDateRange } from "./statusConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/types/itinerary";
import { PIPELINE_STAGE_LABEL_MAP, pipelineStageBadgeClass } from "@/config/pipelineStages";
import { DemoBadge } from "@/components/ui/DemoBadge";

type Props = {
  itineraries: Itinerary[];
  isLoading: boolean;
  onEdit: (it: Itinerary) => void;
  onDelete: (it: Itinerary) => void;
  onDuplicate: (it: Itinerary) => void;
  canEdit: (it: Itinerary) => boolean;
  canDelete: (it: Itinerary) => boolean;
  canViewFinancials: boolean;
};

export default function ItineraryCardView({
  itineraries,
  isLoading,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit,
  canDelete,
  canViewFinancials,
}: Props) {
  if (isLoading && itineraries.length === 0) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {itineraries.map((it) => {
        const id = getItineraryId(it);
        const statusBadge = ITINERARY_STATUS_BADGES[it.status];
        const ps = (it.pipeline_stage ?? "lead") as PipelineStage;
        const eventCount = it.days?.reduce((acc, d) => acc + (d.events?.length ?? 0), 0) ?? 0;
        return (
          <div
            key={id}
            className="relative rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden flex flex-col min-h-[220px] hover:border-[rgba(255,255,255,0.12)] transition-colors"
          >
            <DemoBadge />
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/itineraries/${id}`}
                    className="font-semibold text-[#F5F5F5] hover:underline line-clamp-2 block"
                  >
                    {it.trip_name || "Untitled"}
                  </Link>
                  <span
                    className={cn(
                      "inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                      pipelineStageBadgeClass(ps)
                    )}
                  >
                    {PIPELINE_STAGE_LABEL_MAP[ps]}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[rgba(245,245,245,0.6)]">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/itineraries/${id}`}>View</Link>
                    </DropdownMenuItem>
                    {canEdit(it) && (
                      <DropdownMenuItem onClick={() => onEdit(it)}>
                        <Pencil size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDuplicate(it)}>
                      <Copy size={14} className="mr-2" /> Duplicate
                    </DropdownMenuItem>
                    {canDelete(it) && (
                      <DropdownMenuItem onClick={() => onDelete(it)} className="text-red-400">
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 text-sm text-[rgba(245,245,245,0.7)]">
                <span className="inline-flex items-center gap-1">
                  <User size={14} />
                  <Link href={`/dashboard/vics/${it.primary_vic_id}`} className="hover:underline text-[#F5F5F5]">
                    {it.primary_vic_name || it.primary_vic_id || "—"}
                  </Link>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(it.destinations ?? []).slice(0, 3).map((d) => (
                  <span
                    key={d}
                    className="text-xs px-2 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[rgba(245,245,245,0.5)]">
                {formatDateRange(it.trip_start_date, it.trip_end_date)} · {it.days?.length ?? 0} days · {eventCount} events
              </p>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded border",
                    statusBadge?.className ?? "bg-white/10 border-white/20"
                  )}
                >
                  {statusBadge?.label ?? it.status}
                </span>
                {(it.tags ?? []).slice(0, 2).map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-[rgba(245,245,245,0.6)]">
                    {t}
                  </span>
                ))}
                {canViewFinancials && it.total_client_price != null && (
                  <span className="text-xs text-[rgba(245,245,245,0.8)] ml-auto">
                    {it.currency === "EUR" ? "€" : it.currency} {it.total_client_price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
