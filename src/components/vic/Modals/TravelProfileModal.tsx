"use client";

import { useState } from "react";
import type { VIC, TravelProfile, TravelProfileType } from "@/types/vic";
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

const PROFILE_TYPES: TravelProfileType[] = [
  "business",
  "leisure",
  "romantic",
  "adventure",
  "wellness",
  "cultural",
  "celebration",
];

const PACE_OPTIONS = ["", "slow", "moderate", "fast"];
const BUDGET_OPTIONS = ["", "economy", "mid", "premium", "luxury"];
const CABIN_OPTIONS = ["", "economy", "premium_economy", "business", "first"];
const SEAT_OPTIONS = ["", "aisle", "window", "middle"];

type Props = {
  vic: VIC;
  existingTypes: TravelProfileType[];
  onClose: () => void;
  onSave: (profile: TravelProfile) => void;
};

export default function TravelProfileModal({ vic, existingTypes, onClose, onSave }: Props) {
  const [step, setStep] = useState<"type" | "form">("type");
  const [profileType, setProfileType] = useState<TravelProfileType | "">("");
  const [accommodation, setAccommodation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [experienceThemes, setExperienceThemes] = useState("");
  const [pace, setPace] = useState("");
  const [destinations, setDestinations] = useState("");
  const [budget, setBudget] = useState("");
  const [airlines, setAirlines] = useState("");
  const [cabinClass, setCabinClass] = useState("");
  const [seatPreference, setSeatPreference] = useState("");
  const [dietary, setDietary] = useState("");
  const [accessibility, setAccessibility] = useState("");
  const [specialReq, setSpecialReq] = useState("");

  const availableTypes = PROFILE_TYPES.filter((t) => !existingTypes.includes(t));

  const handleSelectType = (t: TravelProfileType) => {
    setProfileType(t);
    setStep("form");
  };

  const handleSave = () => {
    if (!profileType) return;
    const summary = [accommodation, cuisine, experienceThemes, destinations, budget].filter(Boolean).join(" · ") || undefined;
    const profile: TravelProfile = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tp-${Date.now()}`,
      profile_type: profileType,
      is_primary: (vic.travel_profiles?.length ?? 0) === 0,
      preferences_summary: summary || undefined,
      accommodation_preferences: accommodation || undefined,
      pace: pace || undefined,
      budget_tier: budget || undefined,
      special_requests: [specialReq, dietary, accessibility].filter(Boolean).join("; ") || undefined,
      destinations: destinations ? destinations.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(profile);
    onClose(); // parent may also close; harmless
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Travel Profile</DialogTitle>
        </DialogHeader>

        {step === "type" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select profile type (only types not already added):</p>
            {availableTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground/75">All profile types already exist for this VIC.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableTypes.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    className="justify-start capitalize"
                    onClick={() => handleSelectType(t)}
                  >
                    {t.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            <p className="text-xs text-muted-foreground/75 capitalize">Profile: {profileType.replace(/_/g, " ")}</p>
            <div>
              <Label>Accommodation preferences</Label>
              <Input value={accommodation} onChange={(e) => setAccommodation(e.target.value)} className="mt-1" placeholder="e.g. Hotels, Villas" />
            </div>
            <div>
              <Label>Cuisine preferences</Label>
              <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="mt-1" placeholder="e.g. Local, Fine dining" />
            </div>
            <div>
              <Label>Experience themes</Label>
              <Input value={experienceThemes} onChange={(e) => setExperienceThemes(e.target.value)} className="mt-1" placeholder="e.g. Culture, Nature" />
            </div>
            <div>
              <Label>Travel pace</Label>
              <select value={pace} onChange={(e) => setPace(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                {PACE_OPTIONS.map((o) => <option key={o || "x"} value={o}>{o || "—"}</option>)}
              </select>
            </div>
            <div>
              <Label>Destinations preferred</Label>
              <Input value={destinations} onChange={(e) => setDestinations(e.target.value)} className="mt-1" placeholder="e.g. France, Japan" />
            </div>
            <div>
              <Label>Budget range</Label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                {BUDGET_OPTIONS.map((o) => <option key={o || "x"} value={o}>{o || "—"}</option>)}
              </select>
            </div>
            <div>
              <Label>Preferred airlines</Label>
              <Input value={airlines} onChange={(e) => setAirlines(e.target.value)} className="mt-1" placeholder="e.g. Air France, Emirates" />
            </div>
            <div>
              <Label>Cabin class</Label>
              <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                {CABIN_OPTIONS.map((o) => <option key={o || "x"} value={o}>{o ? o.replace(/_/g, " ") : "—"}</option>)}
              </select>
            </div>
            <div>
              <Label>Seat preference</Label>
              <select value={seatPreference} onChange={(e) => setSeatPreference(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                {SEAT_OPTIONS.map((o) => <option key={o || "x"} value={o}>{o || "—"}</option>)}
              </select>
            </div>
            <div>
              <Label>Dietary restrictions</Label>
              <Input value={dietary} onChange={(e) => setDietary(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Accessibility needs</Label>
              <textarea value={accessibility} onChange={(e) => setAccessibility(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <Label>Special requirements</Label>
              <textarea value={specialReq} onChange={(e) => setSpecialReq(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border pt-3 shrink-0">
          {step === "form" ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("type")}>Back</Button>
              <Button type="button" onClick={handleSave}>Save profile</Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
