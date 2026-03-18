"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import type { UpcomingTripsContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

function formatDeparture(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function statusDot(status: string) {
  if (status === "confirmed") return "bg-emerald-500";
  if (status === "proposed") return "bg-blue-500";
  if (status === "draft" || status === "in_progress") return "bg-gray-500";
  return "bg-gray-500";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  content: UpcomingTripsContent;
  staggerIndex?: number;
};

export default function UpcomingTripsWidget({ content, staggerIndex = 0 }: Props) {
  const items = (content.items ?? [])
    .sort((a, b) => a.days_until_departure - b.days_until_departure)
    .slice(0, 3);
  const total = (content.items ?? []).length;

  if (items.length === 0) {
    return (
      <AppleWidgetCard
        accent="emerald"
        icon={<Plane size={20} />}
        title="Upcoming Trips"
        staggerIndex={staggerIndex}
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Plane size={28} className="text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">No upcoming trips — create one?</p>
          <Link href="/dashboard/itineraries" className="text-sm text-emerald-400 hover:text-emerald-300 mt-1">
            Create itinerary →
          </Link>
        </div>
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="emerald"
      icon={<Plane size={20} />}
      title="Upcoming Trips"
      rightElement={
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          {total}
        </span>
      }
      staggerIndex={staggerIndex}
    >
      <ul className="space-y-2">
        {items.map((trip) => {
          const maxDays = Math.max(...items.map((t) => t.days_until_departure), 1);
          const fillPct = Math.max(0, 100 - (trip.days_until_departure / maxDays) * 100);
          return (
            <li key={trip.itinerary_id}>
              <Link
                href={`/dashboard/itineraries/${trip.itinerary_id}`}
                className="block rounded-xl bg-white/[0.03] p-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">{trip.trip_name}</p>
                  <span className="text-xs text-gray-500 shrink-0">
                    {formatDeparture(trip.departure_date)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{trip.vic_name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-500">
                    {trip.destinations.slice(0, 2).join(", ")}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                      trip.status === "confirmed" && "border-emerald-500/40 text-emerald-400",
                      trip.status === "proposed" && "border-blue-500/40 text-blue-400",
                      (trip.status === "draft" || trip.status === "in_progress") && "border-gray-500/40 text-gray-400"
                    )}
                  >
                    {statusLabel(trip.status)}
                  </span>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot(trip.status))} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        trip.status === "confirmed" ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    in {trip.days_until_departure} days
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {total > 3 && (
        <Link
          href="/dashboard/itineraries"
          className="inline-block mt-4 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all trips →
        </Link>
      )}
    </AppleWidgetCard>
  );
}
