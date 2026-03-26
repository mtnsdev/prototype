"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ItineraryDetailPage from "@/components/itineraries/ItineraryDetail/ItineraryDetailPage";

function ItineraryDetailInner() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  return <ItineraryDetailPage itineraryId={id} />;
}

export default function ItineraryDetailRoute() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
        <ItineraryDetailInner />
      </Suspense>
    </div>
  );
}
