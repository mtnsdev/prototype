"use client";

import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import type { Itinerary, ItineraryStatus } from "@/types/itinerary";
import { getItineraryId } from "@/lib/itineraries-api";
import { formatDateRange } from "./statusConfig";

const COLUMNS: { status: ItineraryStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "proposed", label: "Proposed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
];

function vicShort(name?: string): string {
  if (!name) return "—";
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0];
  return `${p[0]} ${p[p.length - 1][0]}.`;
}

type Props = { itineraries: Itinerary[] };

export default function ItineraryKanbanView({ itineraries }: Props) {
  const router = useRouter();

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden p-4">
      <div className="flex h-full min-h-0 items-stretch gap-4">
        {COLUMNS.map((col) => {
          const colItems = itineraries.filter((it) => it.status === col.status);
          return (
            <div
              key={col.status}
              className="flex h-full min-h-0 w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card/40"
            >
              <div className="shrink-0 border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label} ({colItems.length})
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {colItems.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground/55 py-8 px-2">
                    No trips {col.label.toLowerCase()} yet
                  </p>
                ) : (
                  colItems.map((it) => {
                    const id = getItineraryId(it);
                    const hasDates = it.trip_start_date || it.trip_end_date;
                    return (
                      <button
                        key={id}
                        type="button"
                        title="Drag to move — coming soon"
                        onClick={() => router.push(`/dashboard/itineraries/${id}`)}
                        className="text-left rounded-lg border border-border bg-card/30 hover:bg-card/50 hover:border-input transition-all group w-full"
                      >
                        <div className="flex items-center justify-between gap-2 px-2.5 pt-2.5 pb-0">
                          <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/80">Trip</span>
                          <span
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md text-muted-foreground cursor-help"
                            title="Drag to move — coming soon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical size={14} />
                          </span>
                        </div>
                        <div className="p-2.5 pt-1">
                          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{it.trip_name}</p>
                          <p className="text-xs text-muted-foreground/75 mt-1">{vicShort(it.primary_vic_name)}</p>
                          <p className="text-xs text-muted-foreground/55 mt-0.5">
                            {hasDates ? formatDateRange(it.trip_start_date, it.trip_end_date) : "No dates"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(it.destinations ?? []).slice(0, 2).map((d) => (
                              <span
                                key={d}
                                className="text-2xs px-1.5 py-0.5 rounded-md border border-border/60 bg-muted-foreground/5 text-muted-foreground truncate max-w-full"
                              >
                                {d.split(",")[0]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
