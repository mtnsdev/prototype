"use client";

import { Calendar as CalendarIcon, Cake, AlertTriangle, Plane, Circle } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import type { CalendarContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function eventIndicator(type: string) {
  if (type === "deadline") return { icon: "🔴", color: "text-red-400" };
  if (type === "birthday") return { icon: "🎂", color: "text-[var(--color-warning)]" };
  if (type === "passport_expiry") return { icon: "⚠", color: "text-[var(--color-warning)]" };
  if (type === "trip_departure" || type === "trip_return") return { icon: "●", color: "text-emerald-400" };
  return { icon: "●", color: "text-violet-400" };
}

type Props = {
  content: CalendarContent;
  staggerIndex?: number;
};

export default function CalendarWidget({ content, staggerIndex = 0 }: Props) {
  const items = content.items ?? [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayEvents = items.filter((e) => e.date.slice(0, 10) === todayStr);
  const futureEvents = items
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
  const nextFour = futureEvents.filter((e) => e.date !== todayStr).slice(0, 4);
  const moreCount = Math.max(0, futureEvents.length - 1 - nextFour.length);

  const monthLabel = today.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  const dayName = DAY_NAMES[today.getDay()];
  const dateNum = today.getDate();

  if (items.length === 0) {
    return (
      <AppleWidgetCard
        accent="violet"
        icon={<CalendarIcon size={20} />}
        title="Calendar"
        staggerIndex={staggerIndex}
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarIcon size={28} className="text-muted-foreground/70 mb-2" />
          <p className="text-sm text-muted-foreground">Clear schedule today</p>
          <p className="text-2xs text-muted-foreground/70 mt-2 text-center">
            Google Calendar sync — coming soon
          </p>
        </div>
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="violet"
      icon={<CalendarIcon size={20} />}
      title="Calendar"
      rightElement={
        <span className="text-xs font-medium text-muted-foreground">{monthLabel}</span>
      }
      staggerIndex={staggerIndex}
    >
      <div className="rounded-xl bg-violet-500/5 p-4 mb-4">
        <p className="text-4xl font-bold text-white">{dateNum}</p>
        <p className="text-sm text-muted-foreground/90 uppercase tracking-wider mt-0.5">{dayName}</p>
        <ul className="mt-3 space-y-1.5">
          {todayEvents.slice(0, 2).map((ev) => {
            const ind = eventIndicator(ev.event_type);
            return (
              <li key={ev.id} className="flex items-center gap-2 text-sm">
                {ev.time && <span className="text-muted-foreground shrink-0 w-10">{ev.time}</span>}
                <span className="text-white truncate flex-1">{ev.title}</span>
                <span className={cn("shrink-0", ind.color)}>{ind.icon}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="space-y-0">
        {nextFour.map((ev) => {
          const d = new Date(ev.date);
          const ind = eventIndicator(ev.event_type);
          return (
            <li
              key={ev.id}
              className="py-2 border-b border-white/5 last:border-0 flex items-center gap-2 text-sm"
            >
              <span className="font-semibold text-white w-7 shrink-0">
                {d.getDate()}
              </span>
              <span className="text-muted-foreground w-9 shrink-0 uppercase text-xs">
                {DAY_NAMES[d.getDay()].slice(0, 3)}
              </span>
              <span className="text-white truncate flex-1">{ev.title}</span>
              {ev.time && <span className="text-xs text-muted-foreground shrink-0">{ev.time}</span>}
              <span className={cn("shrink-0", ind.color)}>{ind.icon}</span>
            </li>
          );
        })}
      </ul>
      {moreCount > 0 && (
        <p className="mt-3 text-xs text-violet-400 hover:text-violet-300">
          +{moreCount} more this month →
        </p>
      )}
      <p className="text-2xs text-muted-foreground/70 mt-2 text-center">
        Google Calendar sync — coming soon
      </p>
    </AppleWidgetCard>
  );
}
