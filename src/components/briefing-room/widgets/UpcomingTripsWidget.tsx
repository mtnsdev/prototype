"use client";

import { CalendarRange } from "lucide-react";
import type { UpcomingTrip } from "@/types/briefing-room";
import { useUpcomingTrips } from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";
import { cn } from "@/lib/utils";

function countdownClass(days: number): string {
  if (days <= 3) return "border-[var(--color-error-muted)] bg-[var(--color-error-muted)] text-[var(--color-error)]";
  if (days <= 7)
    return "border-[var(--color-warning-muted)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]";
  return "border-[var(--border-subtle)] bg-[var(--surface-interactive)] text-[var(--text-secondary)]";
}

export function UpcomingTripsWidget() {
  const { data, isPending, isError, error } = useUpcomingTrips();
  const integration = data?.integration ?? { name: "Axus", connected: false };
  const trips: UpcomingTrip[] = data?.trips ?? [];

  return (
    <WidgetShell
      title="Upcoming trips"
      icon={CalendarRange}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load trips") : undefined}
      integration={{ name: "Axus", connected: integration.connected }}
      skeletonRows={3}
    >
      {trips.length === 0 && integration.connected ? (
        <p className="text-sm text-[var(--text-secondary)]">No upcoming departures in the next window.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-[var(--border-subtle)] pl-4">
          {trips.map((trip) => (
            <li key={trip.id} className="relative">
              <span
                className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-card)] bg-[var(--brand-chat-user)]"
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{trip.clientName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{trip.destination}</p>
                  <p className="mt-1 text-2xs text-[var(--text-tertiary)]">
                    Departs{" "}
                    {new Date(trip.departureDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-2xs font-semibold tabular-nums",
                    countdownClass(trip.daysUntil)
                  )}
                >
                  {trip.daysUntil} days
                </span>
              </div>
              <p className="mt-1 text-2xs text-[var(--text-tertiary)]">{trip.status}</p>
            </li>
          ))}
        </ol>
      )}
    </WidgetShell>
  );
}
