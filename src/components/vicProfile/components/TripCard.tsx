"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trip } from "@/types/vic-profile";
import { formatCurrency, formatShortDate, tripNights } from "@/lib/vic-profile-helpers";

export function TripCard({ trip, defaultOpen = false }: { trip: Trip; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const destLine = trip.destinations.map((d) => `${d.city}`).join(" · ");
  const propNames = trip.destinations.flatMap((d) => d.properties.map((p) => p.name)).slice(0, 4);

  return (
    <div className="rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{trip.name ?? "Untitled trip"}</span>
            <span className="rounded-md border border-border px-1.5 py-0 text-2xs uppercase text-muted-foreground">
              {trip.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
            {trip.totalValue != null ? ` · ${formatCurrency(trip.totalValue)}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{destLine}</p>
          {propNames.length > 0 ? (
            <p className="mt-1 text-xs text-foreground/90">{propNames.join(", ")}</p>
          ) : null}
        </div>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3 text-sm">
          {trip.patternTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {trip.patternTags.map((t) => (
                <span key={t} className="rounded-full bg-muted/50 px-2 py-0.5 text-2xs text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {trip.travelingWith.length > 0 ? (
            <div>
              <p className="text-2xs font-medium uppercase text-muted-foreground">Traveling with</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {trip.travelingWith.map((c) => (
                  <li key={c.name}>
                    {c.name} ({c.relationship})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <p className="text-2xs font-medium uppercase text-muted-foreground">Nights (properties)</p>
            <p className="text-muted-foreground">{tripNights(trip)} total</p>
          </div>
          {trip.destinations.map((d) => (
            <div key={d.id} className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <p className="font-medium text-foreground">
                {d.city}, {d.country}
              </p>
              {d.properties.map((p) => (
                <div key={p.id} className="mt-2 text-xs text-muted-foreground">
                  <span className="text-foreground">{p.name}</span>
                  {p.brand ? ` · ${p.brand}` : ""} — {p.nights} nights
                </div>
              ))}
              {d.experiences.length > 0 ? (
                <ul className="mt-2 text-xs text-muted-foreground">
                  {d.experiences.map((e) => (
                    <li key={e.id}>
                      {e.name} ({e.type})
                    </li>
                  ))}
                </ul>
              ) : null}
              {d.logistics.length > 0 ? (
                <ul className="mt-2 text-xs text-muted-foreground">
                  {d.logistics.map((l) => (
                    <li key={l.id}>
                      {l.type}: {l.from} → {l.to}
                      {l.class ? ` (${l.class})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
