"use client";

import { useMemo } from "react";
import { Cake, FileCheck, Plane, Calendar as CalendarIcon } from "lucide-react";
import type { CalendarContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

type Props = { content: CalendarContent };

function eventIcon(type: string) {
  if (type === "birthday") return Cake;
  if (type === "passport_expiry") return FileCheck;
  if (type === "trip_departure" || type === "trip_return") return Plane;
  return CalendarIcon;
}

export default function CalendarWidget({ content }: Props) {
  const items = content.items ?? [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => set.add(e.date.slice(0, 10)));
    return set;
  }, [items]);

  const next7Days = useMemo(() => {
    const list: { date: string; events: typeof items }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const events = items.filter((e) => e.date.slice(0, 10) === dateStr);
      list.push({ date: dateStr, events });
    }
    return list;
  }, [items]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (items.length === 0) {
    return (
      <p className="text-sm text-[rgba(245,245,245,0.5)] py-4">No upcoming events.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-[#F5F5F5]">
          {today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="grid grid-cols-7 gap-0.5 mt-2 text-xs">
          {weekDays.map((d) => (
            <div key={d} className="text-[rgba(245,245,245,0.5)] py-1">
              {d.slice(0, 1)}
            </div>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const hasEvent = datesWithEvents.has(dateStr);
            const isToday = dateStr === today.toISOString().slice(0, 10);
            return (
              <div
                key={dateStr}
                className={cn(
                  "py-1 rounded flex flex-col items-center justify-center gap-0.5",
                  isToday && "bg-white/20 text-[#F5F5F5]",
                  !isToday && "text-[rgba(245,245,245,0.8)]"
                )}
              >
                <span>{i + 1}</span>
                {hasEvent && <span className="w-1 h-1 rounded-full bg-[var(--muted-amber-text)]" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
        <p className="text-xs font-medium text-[rgba(245,245,245,0.6)] mb-2">Next 7 days</p>
        <ul className="space-y-2">
          {next7Days.map(({ date, events }) => (
            <li key={date}>
              {events.length > 0 ? (
                events.map((ev) => {
                  const Icon = eventIcon(ev.event_type);
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ev.color }}
                      />
                      <Icon size={14} className="text-[rgba(245,245,245,0.6)] shrink-0" />
                      <span className="text-[#F5F5F5] truncate">{ev.title}</span>
                      {ev.time && <span className="text-xs text-[rgba(245,245,245,0.5)] shrink-0">{ev.time}</span>}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[rgba(245,245,245,0.4)] py-0.5">
                  {new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} — No events
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
