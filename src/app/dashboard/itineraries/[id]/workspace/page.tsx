"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ItineraryDetailPage from "@/components/itineraries/ItineraryDetail/ItineraryDetailPage";
import ProductDirectoryPage from "@/components/products/ProductDirectoryPage";

function ItineraryCatalogWorkspaceInner() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <section
        className="flex min-h-0 min-w-0 min-h-[45%] flex-1 flex-col overflow-hidden border-border lg:min-h-0 lg:flex-[11] lg:border-r"
        aria-label="Itinerary"
      >
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading trip…</div>}>
          <ItineraryDetailPage itineraryId={id} />
        </Suspense>
      </section>
      <section
        className="flex min-h-0 min-w-0 min-h-[55%] flex-1 flex-col overflow-hidden border-t border-border lg:min-h-0 lg:flex-[9] lg:border-t-0"
        aria-label="Catalog"
      >
        <ProductDirectoryPage embedMode />
      </section>
    </div>
  );
}

export default function ItineraryCatalogWorkspacePage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <ItineraryCatalogWorkspaceInner />
    </div>
  );
}
