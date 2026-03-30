"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { addToItinerary, getProductId } from "@/lib/products-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const EVENT_TYPES = [
  { value: "stay", label: "Stay" },
  { value: "activity", label: "Activity" },
  { value: "meal", label: "Meal" },
  { value: "transfer", label: "Transfer" },
  { value: "experience", label: "Experience" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onAdded?: () => void;
};

// Placeholder: replace with real itinerary list from API when available
const MOCK_ITINERARIES = [
  { id: "itin-1", name: "Paris & Riviera 2025" },
  { id: "itin-2", name: "Monaco Grand Prix" },
];

export default function AddToItineraryModal({ open, onClose, product, onAdded }: Props) {
  const [itineraryId, setItineraryId] = useState("");
  const [day, setDay] = useState<number>(1);
  const [eventType, setEventType] = useState<string>("activity");
  const [customNotes, setCustomNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!product || !itineraryId) return;
    setError(null);
    setLoading(true);
    try {
      await addToItinerary(itineraryId, {
        source_product_id: getProductId(product),
        day,
        event_type: eventType,
        custom_notes: customNotes.trim() || undefined,
      });
      onAdded?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add to itinerary");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-accent border-input max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add to Itinerary</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Add <strong className="text-foreground">{product?.name ?? "this product"}</strong> to an itinerary.
        </p>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Itinerary</Label>
            <Select value={itineraryId} onValueChange={setItineraryId}>
              <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                <SelectValue placeholder="Select itinerary" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ITINERARIES.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground">Day</Label>
            <Input
              type="number"
              min={1}
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value, 10) || 1)}
              className="mt-1 bg-white/5 border-input text-foreground"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Event type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground">Notes (optional)</Label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Custom notes for this event"
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/75"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-input text-foreground">
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading || !itineraryId}>
            {loading ? "Adding…" : "Add to itinerary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
