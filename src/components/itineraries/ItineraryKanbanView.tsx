"use client";

import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import type { Itinerary, ItineraryStatus } from "@/types/itinerary";
import { getItineraryId } from "@/lib/itineraries-api";
import { formatDateRange } from "./statusConfig";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils";

const COLUMNS: { status: ItineraryStatus; label: string; headerClass: string }[] = [
  { status: "draft", label: "Draft", headerClass: "text-gray-400 border-gray-600/40" },
  { status: "proposed", label: "Proposed", headerClass: "text-blue-400 border-blue-500/30" },
  { status: "confirmed", label: "Confirmed", headerClass: "text-emerald-400 border-emerald-500/30" },
  { status: "in_progress", label: "In progress", headerClass: "text-amber-400 border-amber-500/30" },
  { status: "completed", label: "Completed", headerClass: "text-teal-400 border-teal-500/30" },
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
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
      <div className="flex gap-4 min-h-[min(70vh,640px)] items-start">
        {COLUMNS.map((col) => {
          const colItems = itineraries.filter((it) => it.status === col.status);
          return (
            <div
              key={col.status}
              className="w-[260px] shrink-0 flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
            >
              <div
                className={cn(
                  "px-3 py-2.5 border-b text-xs font-semibold uppercase tracking-wider border-white/[0.06]",
                  col.headerClass
                )}
              >
                {col.label} ({colItems.length})
              </div>
              <div className="p-2 flex flex-col gap-2 overflow-y-auto max-h-[calc(70vh-48px)] min-h-[200px]">
                {colItems.length === 0 ? (
                  <p className="text-xs text-center text-[rgba(245,245,245,0.35)] py-8 px-2">
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
                        className="text-left rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all group overflow-hidden w-full"
                      >
                        <div className="relative h-20 w-full bg-zinc-900">
                          <ImageWithFallback
                            fallbackType="trip"
                            src={it.hero_image_url}
                            alt={it.trip_name}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                          <span
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-black/50 text-white/70 cursor-help"
                            title="Drag to move — coming soon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical size={14} />
                          </span>
                        </div>
                        <div className="p-2.5 pt-2">
                          <p className="text-sm font-semibold text-[#F5F5F5] line-clamp-2 leading-snug">{it.trip_name}</p>
                          <p className="text-xs text-[rgba(245,245,245,0.45)] mt-1">{vicShort(it.primary_vic_name)}</p>
                          <p className="text-xs text-[rgba(245,245,245,0.4)] mt-0.5">
                            {hasDates ? formatDateRange(it.trip_start_date, it.trip_end_date) : "No dates"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(it.destinations ?? []).slice(0, 2).map((d) => (
                              <span
                                key={d}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[rgba(245,245,245,0.55)] truncate max-w-full"
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
