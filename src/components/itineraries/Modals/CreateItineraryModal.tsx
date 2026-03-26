"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Itinerary, ItineraryDay, PipelineEvent } from "@/types/itinerary";
import type { VIC } from "@/types/vic";
import { createItinerary } from "@/lib/itineraries-api";
import { getVICId } from "@/lib/vic-api";
import { FAKE_VICS } from "@/components/vic/fakeData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Trip basics" },
  { id: 2, label: "Link VIC" },
  { id: 3, label: "Initial days" },
] as const;

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (itinerary: Itinerary) => void;
  prefillVicId?: string;
};

export default function CreateItineraryModal({ open, onClose, onCreated, prefillVicId }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tripName, setTripName] = useState("");
  const [description, setDescription] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [travelerCount, setTravelerCount] = useState<number | "">("");
  const [currency, setCurrency] = useState("EUR");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [vicId, setVicId] = useState("");
  const [vicSearch, setVicSearch] = useState("");

  const [dayCount, setDayCount] = useState(1);
  const [dayTitles, setDayTitles] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError(null);
    setTripName("");
    setDescription("");
    setTripStartDate("");
    setTripEndDate("");
    setDestinations([]);
    setDestinationInput("");
    setTravelerCount("");
    setCurrency("EUR");
    setTags([]);
    setTagInput("");
    setVicId(prefillVicId ?? "");
    setVicSearch("");
    setDayCount(1);
    setDayTitles({});
  }, [open, prefillVicId]);

  const vics = FAKE_VICS.filter(
    (v) =>
      !vicSearch.trim() ||
      (v.full_name ?? "").toLowerCase().includes(vicSearch.toLowerCase()) ||
      (v.preferred_name ?? "").toLowerCase().includes(vicSearch.toLowerCase())
  ).slice(0, 20);

  const selectedVic = vicId ? vics.find((v) => getVICId(v) === vicId) ?? FAKE_VICS.find((v) => getVICId(v) === vicId) : null;

  const canStep2 = tripName.trim().length > 0 && tripName.trim().length <= 200;
  const canStep3 = canStep2 && !!vicId;
  const endDateValid = !tripStartDate || !tripEndDate || tripEndDate >= tripStartDate;

  const addDestination = () => {
    const v = destinationInput.trim();
    if (v && !destinations.includes(v)) setDestinations((d) => [...d, v]);
    setDestinationInput("");
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((t) => [...t, v]);
    setTagInput("");
  };

  const handleSave = async () => {
    setError(null);
    if (!tripName.trim() || !vicId) return;
    setSaving(true);
    try {
      const days: ItineraryDay[] = Array.from({ length: dayCount }, (_, i) => ({
        day_number: i + 1,
        title: dayTitles[i + 1] || undefined,
        events: [],
      }));

      const body: Partial<Itinerary> = {
        trip_name: tripName.trim(),
        description: description.trim() || undefined,
        primary_vic_id: vicId,
        primary_vic_name: selectedVic ? (selectedVic as VIC).full_name : undefined,
        status: "draft",
        trip_start_date: tripStartDate || undefined,
        trip_end_date: tripEndDate && endDateValid ? tripEndDate : undefined,
        destinations,
        traveler_count: typeof travelerCount === "number" ? travelerCount : undefined,
        currency,
        tags,
        days,
        data_ownership_level: "Advisor",
        agency_id: "agency-1",
        pipeline_stage: "lead",
        pipeline_history: [] as PipelineEvent[],
      };

      const it = await createItinerary(body);
      onCreated(it);
      onClose();
    } catch (e) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        const now = new Date();
        const iso = (d: Date) => d.toISOString();
        const fakeIt: Itinerary = {
          id: `fake-it-new-${Date.now()}`,
          agency_id: "agency-1",
          trip_name: tripName.trim(),
          description: description.trim() || undefined,
          primary_vic_id: vicId,
          primary_vic_name: selectedVic ? (selectedVic as VIC).full_name : undefined,
          primary_advisor_id: "1",
          status: "draft",
          trip_start_date: tripStartDate || undefined,
          trip_end_date: tripEndDate && endDateValid ? tripEndDate : undefined,
          destinations,
          traveler_count: typeof travelerCount === "number" ? travelerCount : undefined,
          days: Array.from({ length: dayCount }, (_, i) => ({
            day_number: i + 1,
            title: dayTitles[i + 1] || undefined,
            events: [],
          })),
          tags,
          currency,
          data_ownership_level: "Advisor",
          created_by: "1",
          created_at: iso(now),
          updated_at: iso(now),
          pipeline_stage: "lead",
          pipeline_history: [],
        };
        onCreated(fakeIt);
        onClose();
      } else {
        setError(e instanceof Error ? e.message : "Failed to create");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0e0e14] border-[rgba(255,255,255,0.06)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">Create itinerary</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex-1 py-1.5 rounded text-center text-xs font-medium",
                step === s.id ? "bg-white/15 text-[#F5F5F5]" : "bg-white/5 text-[rgba(245,245,245,0.5)]"
              )}
            >
              {s.id}. {s.label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Trip name *</Label>
              <Input
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Max 200 characters"
                className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]"
                maxLength={200}
              />
            </div>
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Trip summary"
                rows={3}
                className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[rgba(245,245,245,0.8)]">Start date</Label>
                <Input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[rgba(245,245,245,0.8)]">End date</Label>
                <Input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]"
                />
                {!endDateValid && <p className="text-xs text-red-400 mt-0.5">End date must be after start date.</p>}
              </div>
            </div>
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Destinations</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDestination())}
                  placeholder="e.g. Paris, France"
                  className="bg-white/5 border-white/10 text-[#F5F5F5]"
                />
                <Button type="button" variant="outline" size="sm" onClick={addDestination} className="border-white/10">
                  Add
                </Button>
              </div>
              {destinations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {destinations.map((d) => (
                    <span
                      key={d}
                      className="text-xs px-2 py-0.5 rounded bg-white/10 text-[#F5F5F5] flex items-center gap-1"
                    >
                      {d}
                      <button type="button" onClick={() => setDestinations((prev) => prev.filter((x) => x !== d))} className="hover:text-red-400">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[rgba(245,245,245,0.8)]">Traveler count</Label>
                <Input
                  type="number"
                  min={1}
                  value={travelerCount === "" ? "" : travelerCount}
                  onChange={(e) => setTravelerCount(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                  className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]"
                />
              </div>
              <div>
                <Label className="text-[rgba(245,245,245,0.8)]">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag"
                  className="bg-white/5 border-white/10 text-[#F5F5F5]"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag} className="border-white/10">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded bg-white/10 text-[#F5F5F5] flex items-center gap-1"
                    >
                      {t}
                      <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-red-400">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Search VIC *</Label>
              <Input
                value={vicSearch}
                onChange={(e) => setVicSearch(e.target.value)}
                placeholder="Type to search VICs"
                className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]"
              />
            </div>
            <div>
              <Label className="text-[rgba(245,245,245,0.8)]">Select VIC</Label>
              <Select value={vicId} onValueChange={setVicId}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-[#F5F5F5]">
                  <SelectValue placeholder="Choose a VIC" />
                </SelectTrigger>
                <SelectContent>
                  {vics.map((v) => (
                    <SelectItem key={getVICId(v)} value={getVICId(v)}>
                      {(v as VIC).full_name ?? getVICId(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedVic && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                <p className="font-medium text-[#F5F5F5]">{(selectedVic as VIC).full_name}</p>
                <p className="text-[rgba(245,245,245,0.6)]">
                  {[(selectedVic as VIC).home_city, (selectedVic as VIC).home_country].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-[rgba(245,245,245,0.8)]">Number of days</Label>
              <Input
                type="number"
                min={1}
                value={dayCount}
                onChange={(e) => setDayCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 bg-white/5 border-white/10 text-[#F5F5F5]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDayCount((c) => c + 1)}
                className="border-white/10"
              >
                Add Day
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span className="text-sm text-[rgba(245,245,245,0.6)] w-16">Day {d}</span>
                  <Input
                    value={dayTitles[d] ?? ""}
                    onChange={(e) => setDayTitles((prev) => ({ ...prev, [d]: e.target.value }))}
                    placeholder="Optional title"
                    className="flex-1 bg-white/5 border-white/10 text-[#F5F5F5]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter className="gap-2 flex-wrap">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="border-white/10 text-[#F5F5F5]">
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose} className="border-white/10 text-[#F5F5F5]">
              Cancel
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canStep2 : !canStep3}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
