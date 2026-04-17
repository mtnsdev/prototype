"use client";

import { useMemo } from "react";
import type { DestinationTripReport } from "@/data/destinations";
import { TripReportCard } from "@/components/destinations/sections/TripReportCard";

type Props = {
  reports: DestinationTripReport[];
};

export function TripReportsSection({ reports }: Props) {
  const sorted = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const eb = new Date(`${b.travelDates.end}T12:00:00`).getTime();
        const ea = new Date(`${a.travelDates.end}T12:00:00`).getTime();
        if (eb !== ea) return eb - ea;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [reports],
  );

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No trip reports yet.</p>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((r) => (
        <TripReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}
