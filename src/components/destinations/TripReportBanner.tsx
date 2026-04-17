"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { DestinationTripReport } from "@/data/destinations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { destMuted } from "@/components/destinations/destinationStyles";

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function weeksAgo(end: string, now: Date): number {
  const d = new Date(`${end}T12:00:00`);
  return Math.max(0, Math.round(daysBetween(now, d) / 7));
}

type Props = {
  destinationSlug: string;
  destinationName: string;
  reports: DestinationTripReport[];
  /** Prototype “today” — defaults to client now. */
  now?: Date;
};

export function TripReportBanner({ destinationSlug, destinationName, reports, now }: Props) {
  const storageKey = `dest-trip-banner-${destinationSlug}`;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) === "1") setHidden(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const payload = useMemo(() => {
    const today = now ?? new Date();
    const windowDays = 90;
    const recent = reports
      .filter((r) => {
        const end = new Date(`${r.travelDates.end}T12:00:00`);
        const diff = daysBetween(today, end);
        return diff >= 0 && diff <= windowDays;
      })
      .sort((a, b) => {
        const eb = new Date(`${b.travelDates.end}T12:00:00`).getTime();
        const ea = new Date(`${a.travelDates.end}T12:00:00`).getTime();
        if (eb !== ea) return eb - ea;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    const top = recent[0];
    if (!top) return null;
    const more = recent.length - 1;
    const w = weeksAgo(top.travelDates.end, today);
    return { top, more, w };
  }, [reports, now]);

  if (hidden || payload == null) return null;

  const { top, more, w } = payload;

  const dismiss = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="min-w-0 pr-8">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{top.advisorName}</span>{" "}
          <span className={destMuted}>was just back from {destinationName}</span>{" "}
          <span className={cn("tabular-nums", destMuted)}>({w === 0 ? "this week" : `${w}w ago`})</span>
          {more > 0 ? (
            <span className={destMuted}>
              {" "}
              · {more} more recent report{more > 1 ? "s" : ""}
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="toolbarAccent" size="sm" asChild>
          <Link href={`/dashboard/products/destinations/${destinationSlug}#item-${top.id}`}>View report</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 sm:static"
          aria-label="Dismiss banner"
          onClick={dismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
