"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Plane, Compass } from "lucide-react";
import AppleWidgetCard, { type WidgetCardDensity } from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import { mergeWidgetHeaderRight } from "../mergeWidgetHeaderRight";
import type { UpcomingTripsContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

function formatDeparture(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function statusDot(status: string) {
  if (status === "confirmed") return "bg-[var(--color-info)]";
  if (status === "proposed") return "bg-[var(--muted-foreground)]/55";
  if (status === "draft" || status === "in_progress") return "bg-muted-foreground/45";
  return "bg-muted-foreground/45";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  content: UpcomingTripsContent;
  staggerIndex?: number;
  isAdmin?: boolean;
  cardDensity?: WidgetCardDensity;
  layoutMenu?: ReactNode;
};

export default function UpcomingTripsWidget({
  content,
  staggerIndex = 0,
  isAdmin = false,
  cardDensity,
  layoutMenu,
}: Props) {
  const items = (content.items ?? [])
    .sort((a, b) => a.days_until_departure - b.days_until_departure)
    .slice(0, 3);
  const total = (content.items ?? []).length;

  if (items.length === 0) {
    return (
      <AppleWidgetCard
        accent="blue"
        icon={isAdmin ? <Compass size={20} /> : <Plane size={20} />}
        title={isAdmin ? "Agency Trips" : "Upcoming Trips"}
        staggerIndex={staggerIndex}
        density={cardDensity ?? "default"}
        rightElement={mergeWidgetHeaderRight(undefined, layoutMenu)}
      >
        <BriefingEmptyState
          icon={isAdmin ? <Compass /> : <Plane />}
          title={isAdmin ? "No agency trips on the horizon" : "No upcoming trips"}
          description={
            isAdmin
              ? "Confirmed and proposed departures across advisors appear here."
              : "Create an itinerary or link a trip to see it on your briefing."
          }
          action={
            <Link
              href="/dashboard/itineraries?filter=upcoming"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              Browse itineraries
            </Link>
          }
        />
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="blue"
      icon={isAdmin ? <Compass size={20} /> : <Plane size={20} />}
      title={isAdmin ? "Agency Trips" : "Upcoming Trips"}
      rightElement={mergeWidgetHeaderRight(
        <span className="text-2xs rounded-md border border-border bg-muted/40 px-2 py-0.5 font-medium tabular-nums text-muted-foreground">
          {total}
        </span>,
        layoutMenu,
      )}
      staggerIndex={staggerIndex}
      density={cardDensity ?? "default"}
    >
      {isAdmin && (
        <p className="text-2xs text-muted-foreground/70 mt-0.5 -mb-1">Across all advisors</p>
      )}
      <ul className="space-y-2">
        {items.map((trip) => (
          <li key={trip.itinerary_id}>
            <Link
              href={`/dashboard/itineraries/${trip.itinerary_id}`}
              className="block rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{trip.trip_name}</p>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDeparture(trip.departure_date)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {trip.vic_name}
                {isAdmin && trip.advisor_name && (
                  <span className="text-muted-foreground/80"> · {trip.advisor_name}</span>
                )}
                <span className="text-muted-foreground/80"> · in {trip.days_until_departure} days</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {trip.destinations.slice(0, 2).join(", ")}
                </span>
                <span
                  className={cn(
                    "text-2xs rounded-md border px-1.5 py-0.5 font-medium uppercase tracking-wide",
                    trip.status === "confirmed" &&
                      "border-[var(--muted-info-border)] bg-[var(--muted-info-bg)] text-[var(--muted-info-text)]",
                    trip.status === "proposed" &&
                      "border-border bg-muted/35 text-muted-foreground",
                    (trip.status === "draft" || trip.status === "in_progress") &&
                      "border-border text-muted-foreground",
                  )}
                >
                  {statusLabel(trip.status)}
                </span>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot(trip.status))} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/itineraries?filter=upcoming"
        className="mt-4 inline-block text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        View all trips
      </Link>
    </AppleWidgetCard>
  );
}
