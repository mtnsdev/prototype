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
  listSurfaceWithState,
  listScrollClass,
  listTableClass,
  listTheadRowClass,
  listThClass,
  listTbodyRowClass,
  listTdClass,
  listMutedCellClass,
  listPrimaryTextClass,
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

function columnsForList(canViewFinancials: boolean) {
  const base = [
    { key: "trip_name", label: "Trip name" },
    { key: "vic", label: "VIC" },
    { key: "destinations", label: "Destinations" },
    { key: "dates", label: "Dates" },
    { key: "duration", label: "Duration" },
    { key: "pipeline", label: "Pipeline" },
    { key: "status", label: "Status" },
    { key: "events", label: "Events" },
  ] as const;
  const price = { key: "price", label: "Price" } as const;
  const actions = { key: "actions", label: "Actions" } as const;
  return canViewFinancials ? [...base, price, actions] : [...base, actions];
}

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
  const columns = columnsForList(canViewFinancials);
  const colCount = columns.length;
  const isRefetching = isLoading && itineraries.length > 0;

  if (isLoading && itineraries.length === 0) {
    return (
      <div className={cn(listSurfaceWithState({ refetching: false }), listScrollClass, "overflow-hidden")}>
        <table className={listTableClass("min-w-[900px]")}>
          <thead>
            <tr className={listTheadRowClass}>
              {columns.map((col) => (
                <th key={col.key} className={listThClass} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className={listTbodyRowClass}>
                {Array.from({ length: colCount }, (_, j) => (
                  <td key={j} className={listTdClass}>
                    <div
                      className={cn(
                        "rounded bg-muted-foreground/12 animate-pulse",
                        j === 0 ? "h-4 w-full max-w-[200px]" : "h-4 w-20"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={cn(listSurfaceWithState({ refetching: isRefetching }), listScrollClass, "overflow-hidden transition-opacity")}>
      <table className={listTableClass("min-w-[900px]")}>
        <thead>
          <tr className={listTheadRowClass}>
            {columns.map((col) => (
              <th key={col.key} className={listThClass} scope="col">
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
            const totalPrice = it.total_vic_price ?? it.days?.reduce((sum, d) => sum + (d.events ?? []).reduce((s, e) => s + (e.vic_price ?? 0), 0), 0) ?? 0;
            const currencySym = it.currency === "EUR" ? "€" : it.currency ?? "€";
            const vicLabel = it.primary_vic_name || it.primary_vic_id || "—";
            return (
              <tr
                key={id}
                className={cn(listTbodyRowClass, "cursor-pointer")}
                onClick={() => router.push(`/dashboard/itineraries/${id}`)}
              >
                <td className={listTdClass}>
                  <Link
                    href={`/dashboard/itineraries/${id}`}
                    className={cn(listPrimaryTextClass, "hover:underline")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {it.trip_name || "—"}
                  </Link>
                </td>
                <td className={listTdClass} onClick={(e) => e.stopPropagation()}>
                  {it.primary_vic_id ? (
                    <Link href={`/dashboard/vics/${it.primary_vic_id}`} className={cn(listPrimaryTextClass, "hover:underline")}>
                      {vicLabel}
                    </Link>
                  ) : (
                    <span className={listMutedCellClass}>{vicLabel}</span>
                  )}
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
                  <span className={cn("rounded-full px-2 py-0.5 text-2xs font-medium", pipelineStageBadgeClass(ps))}>
                    {plLabel}
                  </span>
                </td>
                <td className={listTdClass}>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-2xs font-medium capitalize",
                      statusBadge?.className ?? "border border-border bg-muted-foreground/8 text-muted-foreground"
                    )}
                  >
                    {statusBadge?.label ?? it.status}
                  </span>
                </td>
                <td className={cn(listTdClass, listMutedCellClass)}>
                  {eventCount}
                </td>
                {canViewFinancials && (
                  <td className={cn(listTdClass, listMutedCellClass)}>
                    {totalPrice > 0 ? `${currencySym}${totalPrice.toLocaleString()}` : "—"}
                  </td>
                )}
                <td className={cn(listTdClass, "pr-4 text-right")} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal size={16} className="text-muted-foreground" />
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
                          <DropdownMenuItem onClick={() => onDelete(it)} className="text-[var(--muted-error-text)]">
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
