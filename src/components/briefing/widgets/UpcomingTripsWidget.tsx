"use client";

import Link from "next/link";
import type { UpcomingTripsContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

type Props = { content: UpcomingTripsContent };

export default function UpcomingTripsWidget({ content }: Props) {
  const items = (content.items ?? []).sort(
    (a, b) => a.days_until_departure - b.days_until_departure
  );
  if (items.length === 0) {
    return (
      <p className="text-sm text-[rgba(245,245,245,0.5)] py-4">No upcoming trips in the next 30 days.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((trip) => (
        <li key={trip.itinerary_id}>
          <Link
            href={`/dashboard/itineraries/${trip.itinerary_id}`}
            className="block rounded-lg border border-[rgba(255,255,255,0.06)] bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-[#F5F5F5] shrink-0">
                {trip.vic_name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#F5F5F5] text-sm truncate">{trip.trip_name}</p>
                <p className="text-xs text-[rgba(245,245,245,0.6)]">{trip.vic_name}</p>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)] shrink-0">
                {trip.status}
              </span>
            </div>
            <p className="text-xs text-[rgba(245,245,245,0.6)] mt-2">
              {trip.destinations.join(", ")}
            </p>
            <p className="text-xs text-[rgba(245,245,245,0.8)] mt-1">
              Departs in {trip.days_until_departure} days
            </p>
            {trip.pending_confirmations > 0 && (
              <p className="text-xs text-[var(--muted-amber-text)] mt-0.5">
                {trip.pending_confirmations} unconfirmed event{trip.pending_confirmations !== 1 ? "s" : ""}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
