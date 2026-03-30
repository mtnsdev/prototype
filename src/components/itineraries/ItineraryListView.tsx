"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Itinerary } from "@/types/itinerary";
import { getItineraryId } from "@/lib/itineraries-api";
import { ITINERARY_STATUS_BADGES, formatDateRange } from "./statusConfig";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTheadRowClass,
  listThClass,
  listTbodyRowClass,
  listTdClass,
  listMutedCellClass,
} from "@/lib/list-ui";
import type { PipelineStage } from "@/types/itinerary";
import { PIPELINE_STAGE_LABEL_MAP, pipelineStageBadgeClass } from "@/config/pipelineStages";

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

const COLUMNS = [
  { key: "trip_name", label: "Trip Name", sortable: true },
  { key: "vic", label: "VIC", sortable: false },
  { key: "destinations", label: "Destinations", sortable: false },
  { key: "dates", label: "Dates", sortable: true },
  { key: "duration", label: "Duration", sortable: false },
  { key: "pipeline", label: "Pipeline", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "events", label: "Events", sortable: false },
  { key: "price", label: "Price", sortable: false },
  { key: "actions", label: "Actions", sortable: false },
];

export default function ItineraryListView({
  itineraries,
  isLoading,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit,
  canDelete,
  canViewFinancials,
}: Props) {
  const router = useRouter();
  if (isLoading && itineraries.length === 0) {
    return (
      <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden p-3")}>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
      <table className={listTableClass("min-w-[900px]")}>
        <thead>
          <tr className={cn(listTheadRowClass, "uppercase tracking-wider text-muted-foreground/80")}>
            {COLUMNS.map((col) => (
              <th key={col.key} className={listThClass}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itineraries.map((it) => {
            const id = getItineraryId(it);
            const statusBadge = ITINERARY_STATUS_BADGES[it.status];
            const ps = (it.pipeline_stage ?? "lead") as PipelineStage;
            const plLabel = PIPELINE_STAGE_LABEL_MAP[ps];
            const eventCount = it.days?.reduce((acc, d) => acc + (d.events?.length ?? 0), 0) ?? 0;
            const totalPrice = it.total_client_price ?? it.days?.reduce((sum, d) => sum + (d.events ?? []).reduce((s, e) => s + (e.client_price ?? 0), 0), 0) ?? 0;
            const currencySym = it.currency === "EUR" ? "€" : it.currency ?? "€";
            return (
              <tr
                key={id}
                className={cn(listTbodyRowClass, "cursor-pointer")}
                onClick={() => router.push(`/dashboard/itineraries/${id}`)}
              >
                <td className={listTdClass}>
                  <Link
                    href={`/dashboard/itineraries/${id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {it.trip_name || "—"}
                  </Link>
                </td>
                <td className={cn(listTdClass, listMutedCellClass)} onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/dashboard/vics/${it.primary_vic_id}`}
                    className="hover:underline text-foreground"
                  >
                    {it.primary_vic_name || it.primary_vic_id || "—"}
                  </Link>
                </td>
                <td className={cn(listTdClass, listMutedCellClass, "max-w-[200px] truncate")}>
                  {(it.destinations ?? []).join(", ") || "—"}
                </td>
                <td className={cn(listTdClass, listMutedCellClass)}>
                  {formatDateRange(it.trip_start_date, it.trip_end_date)}
                </td>
                <td className={cn(listTdClass, listMutedCellClass)}>
                  {it.days?.length ?? 0} days
                </td>
                <td className={listTdClass}>
                  <span className={cn("text-2xs px-2 py-0.5 rounded-full font-medium", pipelineStageBadgeClass(ps))}>
                    {plLabel}
                  </span>
                </td>
                <td className={listTdClass}>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded border",
                      statusBadge?.className ?? "bg-white/10 border-white/20"
                    )}
                  >
                    {statusBadge?.label ?? it.status}
                  </span>
                </td>
                <td className={cn(listTdClass, listMutedCellClass)}>
                  {eventCount}
                </td>
                <td className={cn(listTdClass, listMutedCellClass)}>
                  {totalPrice > 0 ? `${currencySym}${totalPrice.toLocaleString()}` : "—"}
                </td>
                <td className={listTdClass} onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
