"use client";

import { Route, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ItineraryTab } from "./ItineraryTabBar";

type Props = {
  hasNoItineraries: boolean;
  tab?: ItineraryTab;
  onCreateItinerary?: () => void;
  onClearFilters?: () => void;
};

export default function ItinerariesEmptyState({
  hasNoItineraries,
  tab = "mine",
  onCreateItinerary,
  onClearFilters,
}: Props) {
  if (hasNoItineraries) {
    const copy =
      tab === "agency"
        ? { title: "No agency itineraries", body: "Itineraries created by your agency will appear here." }
        : { title: "No itineraries yet", body: "Create your first itinerary and link it to a VIC." };

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[280px]">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Route className="w-8 h-8 text-[rgba(245,245,245,0.5)]" />
        </div>
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-2">{copy.title}</h2>
        <p className="text-sm text-[rgba(245,245,245,0.6)] max-w-sm mb-6">{copy.body}</p>
        {tab === "mine" && onCreateItinerary && (
          <Button onClick={onCreateItinerary} className="gap-2">
            <Route size={16} />
            Create Itinerary
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[200px]">
      <Search className="w-10 h-10 text-[rgba(245,245,245,0.4)] mb-4" />
      <p className="text-sm text-[rgba(245,245,245,0.6)] mb-4">
        No itineraries match your search. Try different filters or clear to see all.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
