"use client";

import { Suspense } from "react";
import ItinerariesPage from "@/components/itineraries/ItinerariesPage";

export default function ItinerariesDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
      <ItinerariesPage />
    </Suspense>
  );
}
