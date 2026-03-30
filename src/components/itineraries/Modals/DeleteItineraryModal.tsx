"use client";

import { useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { getItineraryId } from "@/lib/itineraries-api";
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary | null;
  onDeleted: () => void;
};

export default function DeleteItineraryModal({ open, onClose, itinerary, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!itinerary) return;
    setError(null);
    setLoading(true);
    try {
      const { deleteItinerary } = await import("@/lib/itineraries-api");
      await deleteItinerary(getItineraryId(itinerary));
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Delete itinerary"
      description={
        <>
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">&quot;{itinerary?.trip_name ?? "this itinerary"}&quot;</span>?
        </>
      }
      consequence="This cannot be undone."
      onConfirm={handleConfirm}
      loading={loading}
      error={error}
      confirmLabel="Delete"
    />
  );
}
