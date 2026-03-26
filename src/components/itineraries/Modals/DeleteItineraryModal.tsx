"use client";

import { useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { getItineraryId } from "@/lib/itineraries-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary | null;
  onDeleted: () => void;
};

export default function DeleteItineraryModal({ open, onClose, itinerary, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
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

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0e0e14] border-[rgba(255,255,255,0.06)]">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">Delete itinerary</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[rgba(245,245,245,0.8)]">
          Are you sure you want to delete &quot;{itinerary?.trip_name ?? "this itinerary"}&quot;? This cannot be undone.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-[#F5F5F5]">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
