"use client";

import { useState, useEffect } from "react";
import {
  type DragEndEvent,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Plus } from "lucide-react";
import type { Itinerary, ItineraryDay, ItineraryEvent } from "@/types/itinerary";
import ItineraryEventCard from "./ItineraryEventCard";
import AddEventModal from "../Modals/AddEventModal";
import { Button } from "@/components/ui/button";
import { addItineraryDay } from "@/lib/itineraries-api";
import { cn } from "@/lib/utils";

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
  /** When set, drag-and-drop reorders / moves events between days and calls back with updated days. */
  onDaysChange?: (days: ItineraryDay[]) => void;
};

function dayClientTotal(day: ItineraryDay): number {
  return (day.events ?? []).reduce((sum, e) => sum + (e.vic_price ?? 0), 0);
}

function dayMarginTotal(day: ItineraryDay): number {
  return (day.events ?? []).reduce((sum, e) => {
    const cp = e.vic_price ?? 0;
    const net = e.net_cost ?? (cp > 0 ? Math.round(cp * 0.75) : 0);
    return sum + (cp - net);
  }, 0);
}

function marginColor(marginPct: number): string {
  if (marginPct >= 20) return "text-emerald-500";
  if (marginPct >= 10) return "text-amber-500";
  return "text-red-500";
}

function cloneDays(days: ItineraryDay[]): ItineraryDay[] {
  try {
    return structuredClone(days);
  } catch {
    return JSON.parse(JSON.stringify(days)) as ItineraryDay[];
  }
}

function findEventPosition(
  days: ItineraryDay[],
  eventId: string
): { dayIdx: number; evIdx: number } | null {
  for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
    const evIdx = days[dayIdx].events.findIndex((e) => e.id === eventId);
    if (evIdx !== -1) return { dayIdx, evIdx };
  }
  return null;
}

function eventSortId(eventId: string) {
  return `event-${eventId}`;
}

function dayDropId(dayNumber: number) {
  return `day-${dayNumber}`;
}

function handleDragEndReorder(
  days: ItineraryDay[],
  event: DragEndEvent,
  onDaysChange: (days: ItineraryDay[]) => void
) {
  const { active, over } = event;
  if (!over) return;
  const activeId = String(active.id);
  const overId = String(over.id);
  if (activeId === overId) return;

  const activeEventId = activeId.startsWith("event-") ? activeId.slice(7) : null;
  if (!activeEventId) return;

  const from = findEventPosition(days, activeEventId);
  if (!from) return;

  const newDays = cloneDays(days);

  if (overId.startsWith("day-") && !overId.startsWith("event-")) {
    const dayNum = Number(overId.slice(4));
    if (Number.isNaN(dayNum)) return;
    const toDayIdx = newDays.findIndex((d) => d.day_number === dayNum);
    if (toDayIdx === -1) return;
    const [moved] = newDays[from.dayIdx].events.splice(from.evIdx, 1);
    newDays[toDayIdx].events.push(moved);
    onDaysChange(newDays);
    return;
  }

  const overEventId = overId.startsWith("event-") ? overId.slice(7) : null;
  if (!overEventId) return;

  const to = findEventPosition(newDays, overEventId);
  if (!to) return;

  if (from.dayIdx === to.dayIdx) {
    const evs = newDays[from.dayIdx].events;
    const oldIndex = from.evIdx;
    const newIndex = to.evIdx;
    if (oldIndex === newIndex) return;
    newDays[from.dayIdx].events = arrayMove(evs, oldIndex, newIndex);
  } else {
    const [moved] = newDays[from.dayIdx].events.splice(from.evIdx, 1);
    const insertAt = newDays[to.dayIdx].events.findIndex((e) => e.id === overEventId);
    const safeInsert = insertAt === -1 ? newDays[to.dayIdx].events.length : insertAt;
    newDays[to.dayIdx].events.splice(safeInsert, 0, moved);
  }

  onDaysChange(newDays);
}

function DayEventsDropZone({
  dayNumber,
  children,
}: {
  dayNumber: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(dayNumber) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-10 space-y-2 rounded-lg border border-transparent transition-colors",
        isOver && "border-dashed border-border bg-foreground/[0.03]"
      )}
    >
      {children}
    </div>
  );
}

function SortableEventRow({
  event,
  day,
  itineraryId,
  dayNumber,
  canEdit,
  canViewFinancials,
  onEventChange,
  onEditEventRequest,
  onEventSelect,
  dndEnabled,
}: {
  event: ItineraryEvent;
  day: ItineraryDay;
  itineraryId: string;
  dayNumber: number;
  canEdit: boolean;
  canViewFinancials: boolean;
  onEventChange: () => void;
  onEditEventRequest?: (day: ItineraryDay, ev: ItineraryEvent) => void;
  onEventSelect?: (day: ItineraryDay, ev: ItineraryEvent) => void;
  dndEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: eventSortId(event.id),
    disabled: !dndEnabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-start gap-2", isDragging && "z-10 opacity-60")}
    >
      {dndEnabled ? (
        <button
          type="button"
          className="mt-3 shrink-0 cursor-grab rounded-md border border-border/60 bg-white/[0.03] p-1 text-muted-foreground hover:bg-foreground/[0.06] active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder or move to another day"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <span className="w-8 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <ItineraryEventCard
          event={event}
          day={day}
          itineraryId={itineraryId}
          dayNumber={dayNumber}
          canEdit={canEdit}
          canViewFinancials={canViewFinancials}
          onUpdate={onEventChange}
          onEdit={() => onEditEventRequest?.(day, event)}
          onEventClick={onEventSelect ? () => onEventSelect(day, event) : undefined}
        />
      </div>
    </div>
  );
}

export default function ItineraryTimeline({
  itinerary,
  canEdit,
  canViewFinancials,
  onEventChange,
  onEventSelect,
  editEvent: editEventProp,
  onEditEventClose,
  onEditEventRequest,
  onDaysChange,
}: Props) {
  const days = itinerary.days ?? [];
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set(days.map((d) => d.day_number)));
  const [addEventDay, setAddEventDay] = useState<ItineraryDay | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const editEvent = editEventProp ?? null;

  const dndEnabled = !!(canEdit && onDaysChange);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      for (const d of days) {
        if (!prev.has(d.day_number)) next.add(d.day_number);
      }
      return next;
    });
  }, [days]);

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

  const onDragEnd = (e: DragEndEvent) => {
    if (!onDaysChange) return;
    handleDragEndReorder(days, e, onDaysChange);
  };

  const timelineInner = (
    <>
      {days.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={expandAll}
            disabled={allExpanded}
          >
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={collapseAll}
            disabled={allCollapsed}
          >
            Collapse all
          </Button>
          {dndEnabled && (
            <span className="text-2xs text-muted-foreground/75">Drag events to reorder or move between days.</span>
          )}
        </div>
      )}
      {days.length === 0 ? (
        <div className="rounded-xl border border-border bg-foreground/[0.04] p-8 text-center">
          <p className="text-sm text-muted-foreground">No days yet. Add days to build your timeline.</p>
          {canEdit && (
            <p className="mt-2 text-xs text-muted-foreground/75">Use Add day below, or open Split view with the catalog.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const isExpanded = expandedDays.has(day.day_number);
            const eventCount = day.events?.length ?? 0;
            const sortableIds = (day.events ?? []).map((ev) => eventSortId(ev.id));
            return (
              <div
                key={day.day_number}
                className="overflow-hidden rounded-xl border border-border bg-foreground/[0.04]"
              >
                <button
                  type="button"
                  onClick={() => toggleDay(day.day_number)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.04]"
                >
                  {isExpanded ? (
                    <ChevronDown size={18} className="shrink-0 text-muted-foreground/75" />
                  ) : (
                    <ChevronRight size={18} className="shrink-0 text-muted-foreground/75" />
                  )}
                  <span className="font-medium text-foreground">
                    Day {day.day_number}
                    {day.date && ` — ${formatDayDate(day.date)}`}
                    {day.location && ` · ${day.location}`}
                  </span>
                  {day.title && (
                    <span className="truncate text-sm text-muted-foreground"> — {day.title}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {eventCount} event{eventCount !== 1 ? "s" : ""}
                  </span>
                </button>
                {isExpanded && (
                  <div className="space-y-2 border-t border-border px-4 pb-4 pt-2">
                    <DayEventsDropZone dayNumber={day.day_number}>
                      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        {(day.events ?? []).length === 0 ? (
                          <p className="py-2 text-sm text-muted-foreground/75">
                            No events yet. Add your first event, or drop one here from another day.
                          </p>
                        ) : (
                          (day.events ?? []).map((ev) => (
                            <SortableEventRow
                              key={ev.id}
                              event={ev}
                              day={day}
                              itineraryId={itinerary.id}
                              dayNumber={day.day_number}
                              canEdit={canEdit}
                              canViewFinancials={canViewFinancials}
                              onEventChange={onEventChange}
                              onEditEventRequest={onEditEventRequest}
                              onEventSelect={onEventSelect}
                              dndEnabled={dndEnabled}
                            />
                          ))
                        )}
                      </SortableContext>
                    </DayEventsDropZone>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-input text-muted-foreground"
                        onClick={() => setAddEventDay(day)}
                      >
                        <Plus size={14} className="mr-1" /> Add event
                      </Button>
                    )}
                    {day.notes && (
                      <div className="mt-2 rounded-lg border border-border bg-foreground/[0.05] p-2">
                        <p className="text-xs text-muted-foreground">{day.notes}</p>
                      </div>
                    )}
                    <p className="mt-2 border-t border-border pt-1 text-xs text-muted-foreground/75">
                      {(day.events ?? []).length} event{(day.events ?? []).length !== 1 ? "s" : ""}
                      {dayClientTotal(day) > 0 && (
                        <>
                          {" "}
                          · {itinerary.currency === "EUR" ? "€" : itinerary.currency}{" "}
                          {dayClientTotal(day).toLocaleString()} VIC price
                        </>
                      )}
                      {canViewFinancials && dayMarginTotal(day) > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          <span
                            className={marginColor(
                              dayClientTotal(day) > 0
                                ? Math.round((dayMarginTotal(day) / dayClientTotal(day)) * 100)
                                : 0
                            )}
                          >
                            €{dayMarginTotal(day).toLocaleString()} margin
                          </span>
                        </>
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
            className="border-input text-muted-foreground"
            onClick={handleAddDay}
            disabled={addingDay}
          >
            <Plus size={14} className="mr-1" /> Add day
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-3xl p-6">
      {dndEnabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          {timelineInner}
        </DndContext>
      ) : (
        timelineInner
      )}

      {(addEventDay || editEvent) && (
        <AddEventModal
          open
          onClose={() => {
            setAddEventDay(null);
            onEditEventClose?.();
          }}
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
