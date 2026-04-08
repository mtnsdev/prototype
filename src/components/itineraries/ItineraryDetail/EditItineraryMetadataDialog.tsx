"use client";

import { useEffect, useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { updateItinerary } from "@/lib/itineraries-api";
import { persistItineraryMetadata } from "@/lib/itineraryLocalOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  onSaved: (next: Itinerary) => void;
};

export default function EditItineraryMetadataDialog({ open, onClose, itinerary, onSaved }: Props) {
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [tripName, setTripName] = useState(itinerary.trip_name);
  const [start, setStart] = useState(itinerary.trip_start_date ?? "");
  const [end, setEnd] = useState(itinerary.trip_end_date ?? "");
  const [destinations, setDestinations] = useState((itinerary.destinations ?? []).join(", "));
  const [travelers, setTravelers] = useState(
    itinerary.traveler_count != null ? String(itinerary.traveler_count) : ""
  );
  const [description, setDescription] = useState(itinerary.description ?? "");
  const [notes, setNotes] = useState(itinerary.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setTripName(itinerary.trip_name);
    setStart(itinerary.trip_start_date ?? "");
    setEnd(itinerary.trip_end_date ?? "");
    setDestinations((itinerary.destinations ?? []).join(", "));
    setTravelers(itinerary.traveler_count != null ? String(itinerary.traveler_count) : "");
    setDescription(itinerary.description ?? "");
    setNotes(itinerary.notes ?? "");
  }, [open, itinerary]);

  const handleSave = async () => {
    setSaving(true);
    const destList = destinations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tc = travelers.trim() === "" ? undefined : Math.max(0, parseInt(travelers, 10) || 0);
    const patch = {
      trip_name: tripName.trim() || itinerary.trip_name,
      trip_start_date: start.trim() || undefined,
      trip_end_date: end.trim() || undefined,
      destinations: destList,
      traveler_count: tc,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const updated = await updateItinerary(itinerary.id, patch);
      onSaved(updated);
      showToast("Trip details saved");
      onClose();
    } catch {
      persistItineraryMetadata(itinerary.id, patch);
      onSaved({ ...itinerary, ...patch });
      showToast("Saved locally (preview) — sync when API is available");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit trip details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="itin-name">Trip name</Label>
            <Input
              id="itin-name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="bg-background border-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="itin-start">Start</Label>
              <Input
                id="itin-start"
                type="date"
                value={start ? start.slice(0, 10) : ""}
                onChange={(e) => setStart(e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itin-end">End</Label>
              <Input
                id="itin-end"
                type="date"
                value={end ? end.slice(0, 10) : ""}
                onChange={(e) => setEnd(e.target.value)}
                className="bg-background border-input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itin-dest">Destinations</Label>
            <Input
              id="itin-dest"
              placeholder="Paris, Lyon"
              value={destinations}
              onChange={(e) => setDestinations(e.target.value)}
              className="bg-background border-input"
            />
            <p className="text-2xs text-muted-foreground">Comma-separated</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itin-travelers">Travelers</Label>
            <Input
              id="itin-travelers"
              inputMode="numeric"
              placeholder="2"
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itin-desc">Description</Label>
            <textarea
              id="itin-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itin-notes">Internal notes</Label>
            <textarea
              id="itin-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="border-input" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="bg-brand-cta text-brand-cta-foreground" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
