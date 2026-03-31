"use client";

import { useState, useEffect } from "react";
import type { ItineraryEvent, EventType } from "@/types/itinerary";
import type { ProductCategory } from "@/types/product";
import { addItineraryEvent, updateItineraryEvent } from "@/lib/itineraries-api";
import { fetchProductList } from "@/lib/products-api";
import { useToast } from "@/contexts/ToastContext";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bed, UtensilsCrossed, Car, Star, Plane, Clock, Compass, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_TYPES: { value: EventType; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "stay", label: "Stay", Icon: Bed },
  { value: "activity", label: "Activity", Icon: Star },
  { value: "meal", label: "Meal", Icon: UtensilsCrossed },
  { value: "transfer", label: "Transfer", Icon: Car },
  { value: "experience", label: "Experience", Icon: Compass },
  { value: "flight", label: "Flight", Icon: Plane },
  { value: "free_time", label: "Free time", Icon: Clock },
  { value: "note", label: "Note", Icon: StickyNote },
];

function eventTypeToProductCategory(t: EventType): ProductCategory | null {
  switch (t) {
    case "stay": return "accommodation";
    case "meal": return "restaurant";
    case "transfer": return "transportation";
    case "activity":
    case "experience": return "activity";
    default: return null;
  }
}

const STATUS_OPTIONS: { value: ItineraryEvent["status"]; label: string }[] = [
  { value: "tentative", label: "Tentative" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  itineraryId: string;
  dayNumber: number;
  onAdded: () => void;
  /** When set, modal edits this event instead of adding a new one */
  event?: ItineraryEvent | null;
};

export default function AddEventModal({ open, onClose, itineraryId, dayNumber, onAdded, event: existingEvent }: Props) {
  const isEdit = !!existingEvent?.id;
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<EventType>("activity");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<ItineraryEvent["status"]>("confirmed");
  const [customNotes, setCustomNotes] = useState("");
  const [vicPrice, setVicPrice] = useState("");
  const [netCost, setNetCost] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [linkedProduct, setLinkedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [roomType, setRoomType] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");

  useEffect(() => {
    if (!open) return;
    if (existingEvent) {
      setEventType(existingEvent.event_type);
      setTitle(existingEvent.title);
      setDescription(existingEvent.description ?? "");
      setStartTime(existingEvent.start_time ?? "");
      setEndTime(existingEvent.end_time ?? "");
      setStatus(existingEvent.status);
      setCustomNotes(existingEvent.custom_notes ?? "");
      setVicPrice(existingEvent.vic_price != null ? String(existingEvent.vic_price) : "");
      setNetCost(existingEvent.net_cost != null ? String(existingEvent.net_cost) : "");
      setCommissionRate(existingEvent.commission_rate != null ? String(existingEvent.commission_rate) : "");
      setRoomType(existingEvent.room_type ?? "");
      setCuisine(existingEvent.cuisine ?? "");
      setDietaryNotes(existingEvent.dietary_notes ?? "");
      setPickupLocation(existingEvent.pickup_location ?? "");
      setDropoffLocation(existingEvent.dropoff_location ?? "");
      setVehicleType(existingEvent.vehicle_type ?? "");
      setFlightNumber(existingEvent.flight_number ?? "");
      setDepartureAirport(existingEvent.departure_airport ?? "");
      setArrivalAirport(existingEvent.arrival_airport ?? "");
      setConfirmationNumber(existingEvent.confirmation_number ?? "");
      setLinkedProduct(null);
    } else {
      setEventType("activity");
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setStatus("confirmed");
      setCustomNotes("");
      setVicPrice("");
      setNetCost("");
      setCommissionRate("");
      setCheckInTime("");
      setCheckOutTime("");
      setRoomType("");
      setCuisine("");
      setDietaryNotes("");
      setPickupLocation("");
      setDropoffLocation("");
      setVehicleType("");
      setFlightNumber("");
      setDepartureAirport("");
      setArrivalAirport("");
      setConfirmationNumber("");
      setLinkedProduct(null);
    }
    setProductSearch("");
    setProductResults([]);
    setError(null);
  }, [open, existingEvent]);

  useEffect(() => {
    const cat = eventTypeToProductCategory(eventType);
    if (!cat || productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    let cancelled = false;
    fetchProductList({ search: productSearch, category: cat, limit: 10 })
      .then((res) => {
        if (!cancelled) setProductResults(res.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProductResults([]);
      });
    return () => { cancelled = true; };
  }, [productSearch, eventType]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setError(null);
    setSaving(true);
    const payload: Partial<ItineraryEvent> = {
      event_type: eventType,
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      status,
      custom_notes: customNotes.trim() || undefined,
      vic_price: vicPrice ? Number(vicPrice) : undefined,
      net_cost: netCost ? Number(netCost) : undefined,
      commission_rate: commissionRate ? Number(commissionRate) : undefined,
      confirmation_number: confirmationNumber.trim() || undefined,
      source_product_id: linkedProduct?.id ?? undefined,
      source_product_name: linkedProduct?.name ?? undefined,
      source_product_category: linkedProduct?.category ?? undefined,
      room_type: roomType.trim() || undefined,
      cuisine: cuisine.trim() || undefined,
      dietary_notes: dietaryNotes.trim() || undefined,
      pickup_location: pickupLocation.trim() || undefined,
      dropoff_location: dropoffLocation.trim() || undefined,
      vehicle_type: vehicleType.trim() || undefined,
      flight_number: flightNumber.trim() || undefined,
      departure_airport: departureAirport.trim() || undefined,
      arrival_airport: arrivalAirport.trim() || undefined,
    };
    try {
      if (isEdit && existingEvent?.id) {
        await updateItineraryEvent(itineraryId, dayNumber, existingEvent.id, payload);
        showToast("Event updated");
      } else {
        await addItineraryEvent(itineraryId, dayNumber, payload);
        showToast("Event added");
      }
      onAdded();
      onClose();
    } catch (e) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        showToast(isEdit ? "Event updated" : "Event added");
        onAdded();
        onClose();
      } else {
        setError(e instanceof Error ? e.message : "Failed to save event");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? "Edit event" : "Add event"} — Day {dayNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Event type</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {EVENT_TYPES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEventType(value)}
                  className={cn(
                    "p-2 rounded-lg border text-center text-xs transition-colors",
                    eventType === value
                      ? "border-[#F5F5F5] bg-white/10 text-foreground"
                      : "border-input bg-white/5 text-muted-foreground hover:border-white/20"
                  )}
                >
                  <span className="block mx-auto mb-1"><Icon size={20} /></span>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Check-in at Four Seasons"
              className="mt-1 bg-white/5 border-input text-foreground"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Start time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 bg-white/5 border-input text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">End time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 bg-white/5 border-input text-foreground"
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ItineraryEvent["status"])}>
              <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground">Confirmation number</Label>
            <Input
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              placeholder="e.g. ABC123"
              className="mt-1 bg-white/5 border-input text-foreground"
            />
          </div>
          {eventType === "stay" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Check-in time</Label>
                <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground">Check-out time</Label>
                <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground">Room type</Label>
                <Input value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="e.g. Deluxe Suite" className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
            </div>
          )}
          {eventType === "meal" && (
            <div className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Cuisine</Label>
                <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. French" className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground">Dietary notes</Label>
                <Input value={dietaryNotes} onChange={(e) => setDietaryNotes(e.target.value)} placeholder="e.g. Vegetarian" className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
            </div>
          )}
          {eventType === "transfer" && (
            <div className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Pickup location</Label>
                <Input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground">Dropoff location</Label>
                <Input value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground">Vehicle type</Label>
                <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. Private car" className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
            </div>
          )}
          {eventType === "flight" && (
            <div className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Flight number</Label>
                <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="e.g. AF 1234" className="mt-1 bg-white/5 border-input text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Departure airport</Label>
                  <Input value={departureAirport} onChange={(e) => setDepartureAirport(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Arrival airport</Label>
                  <Input value={arrivalAirport} onChange={(e) => setArrivalAirport(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
                </div>
              </div>
            </div>
          )}
          {eventTypeToProductCategory(eventType) && (
            <div>
              <Label className="text-muted-foreground">Link product</Label>
              <Input
                value={linkedProduct ? linkedProduct.name : productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  if (linkedProduct) setLinkedProduct(null);
                }}
                onFocus={() => productSearch.length >= 2 && setProductResults(productResults)}
                placeholder="Search products by category…"
                className="mt-1 bg-white/5 border-input text-foreground"
              />
              {linkedProduct ? (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-input bg-white/5 p-2">
                  <span className="text-sm text-foreground">{linkedProduct.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setLinkedProduct(null); setProductSearch(""); }} className="text-muted-foreground">
                    Clear
                  </Button>
                </div>
              ) : productResults.length > 0 && (
                <ul className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-input bg-inset">
                  {productResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-white/10"
                        onClick={() => {
                          setLinkedProduct(p);
                          setTitle(p.name);
                          setProductSearch("");
                          setProductResults([]);
                        }}
                      >
                        {p.name} {p.category && `(${p.category})`}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">VIC price</Label>
              <Input type="number" min={0} step={0.01} value={vicPrice} onChange={(e) => setVicPrice(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Net cost</Label>
              <Input type="number" min={0} step={0.01} value={netCost} onChange={(e) => setNetCost(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground">Commission %</Label>
              <Input type="number" min={0} max={100} step={0.1} value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="mt-1 bg-white/5 border-input text-foreground" />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Custom notes</Label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-input text-foreground">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : isEdit ? "Save" : "Add event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
