"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Trip } from "@/types/vic-profile";
import { TripCard } from "../components/TripCard";
import { formatCurrency, tripNights } from "@/lib/vic-profile-helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const JourneyMap = dynamic(() => import("../components/JourneyMap").then((m) => m.JourneyMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-muted/20 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

type View = "timeline" | "map" | "stats";

export function JourneyHistoryTab({ trips }: { trips: Trip[] }) {
  const [view, setView] = useState<View>("timeline");
  const timelineTrips = useMemo(
    () =>
      [...trips]
        .filter((t) => t.status === "completed" || t.status === "cancelled")
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [trips]
  );

  const stats = useMemo(() => {
    const countries = new Set<string>();
    let nights = 0;
    const brandSpend = new Map<string, number>();
    const monthCounts = Array.from({ length: 12 }, () => 0);
    const yearSpend = new Map<number, number>();

    for (const t of trips) {
      const y = new Date(t.startDate).getFullYear();
      const m = new Date(t.startDate).getMonth();
      monthCounts[m] += 1;
      if (t.totalValue) yearSpend.set(y, (yearSpend.get(y) ?? 0) + t.totalValue);
      for (const d of t.destinations) {
        countries.add(d.country);
      }
      nights += tripNights(t);
      for (const d of t.destinations) {
        for (const p of d.properties) {
          if (p.brand && t.totalValue) {
            const share =
              t.destinations.reduce((acc, x) => acc + x.properties.reduce((n, pr) => n + pr.nights, 0), 0) || 1;
            const propShare = p.nights / share;
            brandSpend.set(p.brand, (brandSpend.get(p.brand) ?? 0) + (t.totalValue ?? 0) * propShare);
          }
        }
      }
    }

    const yearArr = [...yearSpend.entries()].sort((a, b) => a[0] - b[0]);
    const maxYear = Math.max(...yearArr.map(([, v]) => v), 1);
    const topBrands = [...brandSpend.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxBrand = Math.max(...topBrands.map(([, v]) => v), 1);
    const years = yearArr.map(([year]) => year);
    const avgTripLen = trips.length ? trips.reduce((acc, t) => acc + tripNights(t), 0) / trips.length : 0;

    return {
      countries: countries.size,
      nights,
      avgTripLen,
      monthCounts,
      yearArr,
      maxYear,
      topBrands,
      maxBrand,
      years,
    };
  }, [trips]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["timeline", "map", "stats"] as const).map((v) => (
          <Button key={v} type="button" size="sm" variant={view === v ? "secondary" : "outline"} onClick={() => setView(v)}>
            {v === "timeline" ? "Timeline" : v === "map" ? "Map" : "Stats"}
          </Button>
        ))}
      </div>

      {view === "timeline" ? (
        timelineTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No travel history yet — create your first proposal.</p>
        ) : (
          <div className="space-y-3">
            {timelineTrips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        )
      ) : null}

      {view === "map" ? <JourneyMap trips={trips} /> : null}

      {view === "stats" ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-2xs uppercase text-muted-foreground">Countries</p>
              <p className="text-2xl font-semibold">{stats.countries}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-2xs uppercase text-muted-foreground">Nights (all trips)</p>
              <p className="text-2xl font-semibold">{stats.nights}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-2xs uppercase text-muted-foreground">Avg trip length</p>
              <p className="text-2xl font-semibold">{stats.avgTripLen.toFixed(1)} nights</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Seasonal heatmap (departure month)</p>
            <div className="grid grid-cols-12 gap-1">
              {stats.monthCounts.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-10 w-full rounded-md border border-border",
                      c === 0 ? "bg-muted/30" : "bg-[var(--brand-cta)]/25"
                    )}
                    style={{ opacity: Math.min(1, 0.25 + c * 0.2) }}
                    title={`Month ${i + 1}: ${c}`}
                  />
                  <span className="text-2xs text-muted-foreground">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">YoY spend</p>
            <div className="space-y-2">
              {stats.yearArr.map(([year, val]) => (
                <div key={year}>
                  <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                    <span>{year}</span>
                    <span>{formatCurrency(val)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-[var(--brand-cta)]/70"
                      style={{ width: `${(val / stats.maxYear) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Top brands (allocated)</p>
            <div className="space-y-2">
              {stats.topBrands.length === 0 ? (
                <p className="text-xs text-muted-foreground">No brand-tagged stays in history.</p>
              ) : (
                stats.topBrands.map(([name, val]) => (
                  <div key={name}>
                    <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                      <span>{name}</span>
                      <span>{formatCurrency(val)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-violet-500/60"
                        style={{ width: `${(val / stats.maxBrand) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
