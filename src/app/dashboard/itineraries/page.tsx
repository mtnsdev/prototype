"use client";

import { Suspense } from "react";
import ItinerariesPage from "@/components/itineraries/ItinerariesPage";

export default function ItinerariesDashboardPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense fallback={<div className="p-6 text-muted-foreground/75">Loading…</div>}>
        <ItinerariesPage />
      </Suspense>
    </div>
  );
}
