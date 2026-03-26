"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Itinerary, ItineraryDay, ItineraryEvent } from "@/types/itinerary";
import ItineraryEventCard from "./ItineraryEventCard";
import AddEventModal from "../Modals/AddEventModal";
import { Button } from "@/components/ui/button";
import { addItineraryDay } from "@/lib/itineraries-api";

function formatDayDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

type Props = {
  itinerary: Itinerary;
  canEdit: boolean;
  canViewFinancials: boolean;
  onEventChange: () => void;
  onEventSelect?: (day: ItineraryDay, ev: ItineraryEvent) => void;
  editEvent?: { day: ItineraryDay; event: ItineraryEvent } | null;
  onEditEventClose?: () => void;
  onEditEventRequest?: (day: ItineraryDay, ev: ItineraryEvent) => void;
};

function dayClientTotal(day: ItineraryDay): number {
  return (day.events ?? []).reduce((sum, e) => sum + (e.client_price ?? 0), 0);
}

function dayMarginTotal(day: ItineraryDay): number {
  return (day.events ?? []).reduce((sum, e) => {
    const cp = e.client_price ?? 0;
    const net = e.net_cost ?? (cp > 0 ? Math.round(cp * 0.75) : 0);
    return sum + (cp - net);
  }, 0);
}

function marginColor(marginPct: number): string {
  if (marginPct >= 20) return "text-emerald-500";
  if (marginPct >= 10) return "text-amber-500";
  return "text-red-500";
}

export default function ItineraryTimeline({ itinerary, canEdit, canViewFinancials, onEventChange, onEventSelect, editEvent: editEventProp, onEditEventClose, onEditEventRequest }: Props) {
  const days = itinerary.days ?? [];
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set(days.map((d) => d.day_number)));
  const [addEventDay, setAddEventDay] = useState<ItineraryDay | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const editEvent = editEventProp ?? null;

  const allExpanded = days.length > 0 && expandedDays.size === days.length;
  const allCollapsed = expandedDays.size === 0;

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };

  const expandAll = () => setExpandedDays(new Set(days.map((d) => d.day_number)));
  const collapseAll = () => setExpandedDays(new Set());

  const handleAddDay = async () => {
    const nextDayNum = days.length ? Math.max(...days.map((d) => d.day_number), 0) + 1 : 1;
    setAddingDay(true);
    try {
      await addItineraryDay(itinerary.id, { day_number: nextDayNum, events: [] });
      onEventChange();
    } finally {
      setAddingDay(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      {days.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-[rgba(245,245,245,0.7)]"
            onClick={expandAll}
            disabled={allExpanded}
          >
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[rgba(245,245,245,0.7)]"
            onClick={collapseAll}
            disabled={allCollapsed}
          >
            Collapse all
          </Button>
        </div>
      )}
      {days.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-8 text-center">
          <p className="text-[rgba(245,245,245,0.6)] text-sm">No days yet. Add days to build your timeline.</p>
          {canEdit && (
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-2">Edit itinerary to add days.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const isExpanded = expandedDays.has(day.day_number);
            const eventCount = day.events?.length ?? 0;
            return (
              <div
                key={day.day_number}
                className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleDay(day.day_number)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.04]"
                >
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-[rgba(245,245,245,0.5)] shrink-0" />
                  ) : (
                    <ChevronRight size={18} className="text-[rgba(245,245,245,0.5)] shrink-0" />
                  )}
                  <span className="font-medium text-[#F5F5F5]">
                    Day {day.day_number}
                    {day.date && ` — ${formatDayDate(day.date)}`}
                    {day.location && ` · ${day.location}`}
                  </span>
                  {day.title && (
                    <span className="text-sm text-[rgba(245,245,245,0.6)] truncate"> — {day.title}</span>
                  )}
                  <span className="text-xs text-[rgba(245,245,245,0.4)] ml-auto">
                    {eventCount} event{eventCount !== 1 ? "s" : ""}
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] px-4 pb-4 pt-2 space-y-2">
                    {(day.events ?? []).length === 0 ? (
                      <p className="text-sm text-[rgba(245,245,245,0.5)] py-2">
                        No events yet. Add your first event.
                      </p>
                    ) : (
                      (day.events ?? []).map((ev) => (
                        <ItineraryEventCard
                          key={ev.id}
                          event={ev}
                          day={day}
                          itineraryId={itinerary.id}
                          dayNumber={day.day_number}
                          canEdit={canEdit}
                          canViewFinancials={canViewFinancials}
                          onUpdate={onEventChange}
                          onEdit={() => onEditEventRequest?.(day, ev)}
                          onEventClick={onEventSelect ? () => onEventSelect(day, ev) : undefined}
                        />
                      ))
                    )}
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-[rgba(245,245,245,0.7)]"
                        onClick={() => setAddEventDay(day)}
                      >
                        <Plus size={14} className="mr-1" /> Add event
                      </Button>
                    )}
                    {day.notes && (
                      <div className="rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] p-2 mt-2">
                        <p className="text-xs text-[rgba(245,245,245,0.7)]">{day.notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-[rgba(245,245,245,0.45)] pt-1 border-t border-[rgba(255,255,255,0.04)] mt-2">
                      {(day.events ?? []).length} event{(day.events ?? []).length !== 1 ? "s" : ""}
                      {dayClientTotal(day) > 0 && (
                        <> · {itinerary.currency === "EUR" ? "€" : itinerary.currency} {dayClientTotal(day).toLocaleString()} client</>
                      )}
                      {canViewFinancials && dayMarginTotal(day) > 0 && (
                        <> · <span className={marginColor(dayClientTotal(day) > 0 ? Math.round((dayMarginTotal(day) / dayClientTotal(day)) * 100) : 0)}>€{dayMarginTotal(day).toLocaleString()} margin</span></>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {days.length > 0 && canEdit && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[rgba(245,245,245,0.7)]"
            onClick={handleAddDay}
            disabled={addingDay}
          >
            <Plus size={14} className="mr-1" /> Add day
          </Button>
        </div>
      )}

      {(addEventDay || editEvent) && (
        <AddEventModal
          open
          onClose={() => { setAddEventDay(null); onEditEventClose?.(); }}
          itineraryId={itinerary.id}
          dayNumber={addEventDay?.day_number ?? editEvent?.day.day_number ?? 1}
          event={editEvent?.event ?? null}
          onAdded={() => {
            setAddEventDay(null);
            onEditEventClose?.();
            onEventChange();
          }}
        />
      )}
    </div>
  );
}
