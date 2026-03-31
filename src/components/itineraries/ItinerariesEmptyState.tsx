"use client";

import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyItineraries, EmptySearchResults } from "@/components/ui/empty-states";
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
    // For "agency" tab, use custom UI
    if (tab === "agency") {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[280px]">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
            <Route className="w-8 h-8 text-muted-foreground/75" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No agency itineraries</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Itineraries created by your agency will appear here.
          </p>
        </div>
      );
    }

    // For "mine" tab, use the unified empty state system
    return (
      <div className="min-h-[280px] flex flex-col items-center justify-center">
        <EmptyItineraries
          action={onCreateItinerary ? { label: "Create Itinerary", onClick: onCreateItinerary } : undefined}
          className="w-full px-4"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center px-4">
      <EmptySearchResults className="w-full" />
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}
