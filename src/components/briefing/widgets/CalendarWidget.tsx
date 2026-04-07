"use client";

import type { ReactNode } from "react";
import {
  Calendar as CalendarIcon,
  Cake,
  AlertTriangle,
  Plane,
  Circle,
  AlertCircle,
} from "lucide-react";
import AppleWidgetCard, { type WidgetCardDensity } from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import { mergeWidgetHeaderRight } from "../mergeWidgetHeaderRight";
import type { CalendarContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function eventIndicator(type: string): {
  Icon: typeof Circle;
  className: string;
} {
  if (type === "deadline")
    return { Icon: AlertCircle, className: "text-foreground/70" };
  if (type === "birthday")
    return { Icon: Cake, className: "text-muted-foreground" };
  if (type === "passport_expiry")
    return { Icon: AlertTriangle, className: "text-muted-foreground" };
  if (type === "trip_departure" || type === "trip_return")
    return { Icon: Plane, className: "text-[var(--color-info)]" };
  return { Icon: Circle, className: "text-muted-foreground" };
}

type Props = {
  content: CalendarContent;
  staggerIndex?: number;
  cardDensity?: WidgetCardDensity;
  layoutMenu?: ReactNode;
};

export default function CalendarWidget({ content, staggerIndex = 0, cardDensity, layoutMenu }: Props) {
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
        density={cardDensity ?? "default"}
        rightElement={mergeWidgetHeaderRight(undefined, layoutMenu)}
      >
        <BriefingEmptyState
          icon={<CalendarIcon />}
          title="Nothing on the calendar"
          description="Your schedule is clear. Google Calendar sync is coming soon."
        />
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="violet"
      icon={<CalendarIcon size={20} />}
      title="Calendar"
      rightElement={mergeWidgetHeaderRight(
        <span className="text-xs font-medium text-muted-foreground">{monthLabel}</span>,
        layoutMenu,
      )}
      staggerIndex={staggerIndex}
      density={cardDensity ?? "default"}
    >
      <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-3xl font-semibold tabular-nums text-foreground">{dateNum}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{dayName}</p>
        <ul className="mt-3 space-y-1.5">
          {todayEvents.slice(0, 2).map((ev) => {
            const ind = eventIndicator(ev.event_type);
            return (
              <li key={ev.id} className="flex items-center gap-2 text-sm">
                {ev.time && (
                  <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{ev.time}</span>
                )}
                <span className="min-w-0 flex-1 truncate text-foreground">{ev.title}</span>
                <ind.Icon className={cn("size-3.5 shrink-0", ind.className)} aria-hidden />
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="divide-y divide-border">
        {nextFour.map((ev) => {
          const d = new Date(ev.date);
          const ind = eventIndicator(ev.event_type);
          return (
            <li
              key={ev.id}
              className="flex items-center gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
            >
              <span className="w-7 shrink-0 font-semibold tabular-nums text-foreground">{d.getDate()}</span>
              <span className="w-9 shrink-0 text-xs uppercase text-muted-foreground">
                {DAY_NAMES[d.getDay()].slice(0, 3)}
              </span>
              <span className="min-w-0 flex-1 truncate text-foreground">{ev.title}</span>
              {ev.time && (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{ev.time}</span>
              )}
              <ind.Icon className={cn("size-3.5 shrink-0", ind.className)} aria-hidden />
            </li>
          );
        })}
      </ul>
      {moreCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          +{moreCount} more this month
        </p>
      )}
      <p className="text-2xs text-muted-foreground/70 mt-2 text-center">
        Google Calendar sync — coming soon
      </p>
    </AppleWidgetCard>
  );
}
