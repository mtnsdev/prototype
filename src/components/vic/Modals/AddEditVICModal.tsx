"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VIC, RelationshipStatus } from "@/types/vic";
import { createVIC, updateVIC, getVICId } from "@/lib/vic-api";
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
import TagInput from "../TagInput";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Core Identity" },
  { id: 2, label: "Relationship" },
  { id: 3, label: "Preferences & Tags" },
] as const;

const MAX = {
  full_name: 200,
  preferred_name: 100,
  home_city: 100,
  home_country: 100,
  home_address: 500,
  vip_notes: 2000,
  notes: 1000,
  dietary_restrictions: 500,
  accessibility_needs: 500,
};

const TITLE_OPTIONS = ["", "Mr", "Mrs", "Ms", "Dr", "Prof"] as const;
const REFERRAL_OPTIONS = ["", "Referral", "Word of mouth", "Website", "Social", "Event", "Partner", "Other"] as const;
const TIMEZONE_OPTIONS = ["", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "UTC"];
const LANGUAGE_OPTIONS = ["", "English", "French", "Spanish", "German", "Italian", "Portuguese", "Other"];

const RELATIONSHIP_OPTIONS: { value: RelationshipStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
  { value: "past", label: "Past" },
  { value: "do_not_contact", label: "Do not contact" },
];

const MOCK_ADVISORS = [
  { id: "1", name: "Alex Advisor" },
  { id: "2", name: "Sam Smith" },
  { id: "3", name: "Jordan Lee" },
];

type Props = {
  vic: VIC | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  full_name: string;
  preferred_name: string;
  title: string;
  email: string;
  email_secondary: string;
  phone_primary: string;
  phone_secondary: string;
  nationality: string;
  date_of_birth: string;
  home_address: string;
  home_city: string;
  home_country: string;
  time_zone: string;
  language_primary: string;
  languages_spoken: string[];
  assigned_advisor_id: string;
  secondary_advisor_id: string;
  vic_since: string;
  referral_source: string;
  referred_by_vic_id: string;
  relationship_status: RelationshipStatus | "";
  vip_notes: string;
  tags: string[];
  dietary_restrictions: string;
  accessibility_needs: string;
  gdpr_consent_given: boolean;
  marketing_consent: boolean;
  notes: string;
  city: string;
  country: string;
  company: string;
  role: string;
  customTags: string[];
};

function toFormState(v: VIC | null): FormState {
  const leg = v as unknown as { city?: string; country?: string; company?: string; role?: string; phone?: string; customTags?: string[] };
  return {
    full_name: v?.full_name ?? "",
    preferred_name: v?.preferred_name ?? "",
    title: v?.title ?? "",
    email: v?.email ?? "",
    email_secondary: v?.email_secondary ?? "",
    phone_primary: v?.phone_primary ?? leg?.phone ?? "",
    phone_secondary: v?.phone_secondary ?? "",
    nationality: v?.nationality ?? "",
    date_of_birth: v?.date_of_birth ? v.date_of_birth.slice(0, 10) : "",
    home_address: v?.home_address ?? "",
    home_city: v?.home_city ?? leg?.city ?? "",
    home_country: v?.home_country ?? leg?.country ?? "",
    time_zone: v?.time_zone ?? "",
    language_primary: v?.language_primary ?? "",
    languages_spoken: v?.languages_spoken ?? [],
    assigned_advisor_id: v?.assigned_advisor_id ?? "",
    secondary_advisor_id: v?.secondary_advisor_id ?? "",
    vic_since: v?.vic_since ? v.vic_since.slice(0, 10) : "",
    referral_source: v?.referral_source ?? "",
    referred_by_vic_id: (v as { referred_by_vic_id?: string })?.referred_by_vic_id ?? "",
    relationship_status: (v?.relationship_status as RelationshipStatus) ?? "active",
    vip_notes: v?.vip_notes ?? "",
    tags: v?.tags ?? leg?.customTags ?? [],
    dietary_restrictions: v?.dietary_restrictions ?? "",
    accessibility_needs: v?.accessibility_needs ?? "",
    gdpr_consent_given: v?.gdpr_consent_given ?? false,
    marketing_consent: v?.marketing_consent ?? false,
    notes: v?.notes ?? (v as unknown as { notes?: string })?.notes ?? "",
    city: leg?.city ?? "",
    country: leg?.country ?? "",
    company: leg?.company ?? "",
    role: leg?.role ?? "",
    customTags: v?.tags ?? leg?.customTags ?? [],
  };
}

export default function AddEditVICModal({ vic, onClose, onSaved }: Props) {
  const isEdit = vic != null;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => toFormState(vic));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const fullNameValid = form.full_name.trim().length > 0 && form.full_name.length <= MAX.full_name;
  const emailValid = form.email.trim().length > 0;
  const phoneValid = form.phone_primary.trim().length > 0;
  const canNextStep1 = fullNameValid && emailValid && phoneValid;
  const canNextStep2 = form.assigned_advisor_id.trim().length > 0;

  const handleNext = () => {
    setError(null);
    if (step === 1 && !canNextStep1) {
      setError("Full name, email, and phone (primary) are required.");
      return;
    }
    if (step === 2 && !canNextStep2) {
      setError("Assigned advisor is required.");
      return;
    }
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  const buildPayload = useCallback((): Partial<VIC> & Record<string, unknown> => {
    return {
      full_name: form.full_name.trim(),
      preferred_name: form.preferred_name.trim() || undefined,
      title: form.title.trim() || undefined,
      email: form.email.trim() || undefined,
      email_secondary: form.email_secondary.trim() || undefined,
      phone_primary: form.phone_primary.trim() || undefined,
      phone_secondary: form.phone_secondary.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
      date_of_birth: form.date_of_birth.trim() || undefined,
      home_address: form.home_address.trim().slice(0, MAX.home_address) || undefined,
      home_city: form.home_city.trim() || undefined,
      home_country: form.home_country.trim() || undefined,
      time_zone: form.time_zone.trim() || undefined,
      language_primary: form.language_primary.trim() || undefined,
      languages_spoken: form.languages_spoken.length ? form.languages_spoken : undefined,
      assigned_advisor_id: form.assigned_advisor_id.trim() || undefined,
      secondary_advisor_id: form.secondary_advisor_id.trim() || undefined,
      vic_since: form.vic_since.trim() || undefined,
      referral_source: form.referral_source.trim() || undefined,
      referred_by_vic_id: form.referred_by_vic_id.trim() || undefined,
      relationship_status: form.relationship_status || undefined,
      vip_notes: form.vip_notes.slice(0, MAX.vip_notes) || undefined,
      tags: form.tags.length ? form.tags : undefined,
      dietary_restrictions: form.dietary_restrictions.slice(0, MAX.dietary_restrictions) || undefined,
      accessibility_needs: form.accessibility_needs.slice(0, MAX.accessibility_needs) || undefined,
      gdpr_consent_given: form.gdpr_consent_given,
      marketing_consent: form.marketing_consent,
      notes: form.notes.slice(0, MAX.notes) || undefined,
      city: form.home_city.trim() || form.city.trim() || undefined,
      country: form.home_country.trim() || form.country.trim() || undefined,
      company: form.company.trim() || undefined,
      role: form.role.trim() || undefined,
      customTags: form.tags.length ? form.tags : undefined,
    };
  }, [form]);

  const handleSubmit = async () => {
    if (!canNextStep1) {
      setError("Full name, email, and phone (primary) are required.");
      return;
    }
    if (!canNextStep2) {
      setError("Assigned advisor is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = buildPayload();
      if (isEdit && vic) {
        await updateVIC(getVICId(vic), body);
      } else {
        await createVIC(body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit VIC" : "Add VIC"}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  "rounded-full w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors",
                  step === s.id
                    ? "bg-muted text-foreground"
                    : step > s.id
                      ? "bg-white/20 text-foreground"
                      : "bg-white/10 text-muted-foreground/75"
                )}
              >
                {s.id}
              </button>
              <span className={cn("text-xs hidden sm:inline", step === s.id ? "text-foreground" : "text-muted-foreground/75")}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-[rgba(245,245,245,0.3)] shrink-0" />
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {/* Step 1: Core Identity (16 fields) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => update({ full_name: e.target.value })}
                    maxLength={MAX.full_name}
                    className="mt-1"
                    placeholder="e.g. Jean-Christophe Chopin"
                  />
                  {form.full_name.length > MAX.full_name && <p className="text-xs text-red-400 mt-1">Max {MAX.full_name} characters</p>}
                </div>
                <div>
                  <Label htmlFor="preferred_name">Preferred name</Label>
                  <Input id="preferred_name" value={form.preferred_name} onChange={(e) => update({ preferred_name: e.target.value })} maxLength={MAX.preferred_name} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <select id="title" value={form.title} onChange={(e) => update({ title: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                    {TITLE_OPTIONS.map((o) => <option key={o || "x"} value={o}>{o || "—"}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email_secondary">Email (secondary)</Label>
                  <Input id="email_secondary" type="email" value={form.email_secondary} onChange={(e) => update({ email_secondary: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone_primary">Phone (primary) *</Label>
                  <Input id="phone_primary" value={form.phone_primary} onChange={(e) => update({ phone_primary: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone_secondary">Phone (secondary)</Label>
                  <Input id="phone_secondary" value={form.phone_secondary} onChange={(e) => update({ phone_secondary: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={form.nationality} onChange={(e) => update({ nationality: e.target.value })} placeholder="e.g. FR, US" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="home_address">Home address</Label>
                <Input id="home_address" value={form.home_address} onChange={(e) => update({ home_address: e.target.value })} maxLength={MAX.home_address} className="mt-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="home_city">City</Label>
                  <Input id="home_city" value={form.home_city} onChange={(e) => update({ home_city: e.target.value })} maxLength={MAX.home_city} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="home_country">Country</Label>
                  <Input id="home_country" value={form.home_country} onChange={(e) => update({ home_country: e.target.value })} maxLength={MAX.home_country} className="mt-1" placeholder="ISO code" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="time_zone">Time zone</Label>
                  <select id="time_zone" value={form.time_zone} onChange={(e) => update({ time_zone: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                    {TIMEZONE_OPTIONS.map((z) => <option key={z || "x"} value={z}>{z || "—"}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="language_primary">Primary language</Label>
                  <select id="language_primary" value={form.language_primary} onChange={(e) => update({ language_primary: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground">
                    {LANGUAGE_OPTIONS.map((l) => <option key={l || "x"} value={l}>{l || "—"}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Languages spoken</Label>
                <TagInput value={form.languages_spoken} onChange={(languages_spoken) => update({ languages_spoken })} className="mt-1" placeholder="Add language" />
              </div>
            </div>
          )}

          {/* Step 2: Relationship (7 fields) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="assigned_advisor_id">Assigned advisor *</Label>
                <select
                  id="assigned_advisor_id"
                  value={form.assigned_advisor_id}
                  onChange={(e) => update({ assigned_advisor_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  <option value="">— Select —</option>
                  {MOCK_ADVISORS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="secondary_advisor_id">Secondary advisor</Label>
                <select
                  id="secondary_advisor_id"
                  value={form.secondary_advisor_id}
                  onChange={(e) => update({ secondary_advisor_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  <option value="">—</option>
                  {MOCK_ADVISORS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="vic_since">VIC since</Label>
                <Input id="vic_since" type="date" value={form.vic_since} onChange={(e) => update({ vic_since: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="referral_source">Referral source</Label>
                <select
                  id="referral_source"
                  value={form.referral_source}
                  onChange={(e) => update({ referral_source: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  {REFERRAL_OPTIONS.map((o) => <option key={o || "x"} value={o}>{o || "—"}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="referred_by_vic_id">Referred by VIC</Label>
                <Input id="referred_by_vic_id" value={form.referred_by_vic_id} onChange={(e) => update({ referred_by_vic_id: e.target.value })} className="mt-1" placeholder="VIC ID or search" />
              </div>
              <div>
                <Label htmlFor="relationship_status">Relationship status</Label>
                <select
                  id="relationship_status"
                  value={form.relationship_status}
                  onChange={(e) => update({ relationship_status: (e.target.value || "") as RelationshipStatus | "" })}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  {RELATIONSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="vip_notes">VIP notes</Label>
                <textarea
                  id="vip_notes"
                  value={form.vip_notes}
                  onChange={(e) => update({ vip_notes: e.target.value })}
                  maxLength={MAX.vip_notes}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                  placeholder="Internal notes about this VIC"
                />
                <p className="text-xs text-muted-foreground/75">{form.vip_notes.length}/{MAX.vip_notes}</p>
              </div>
            </div>
          )}

          {/* Step 3: Preferences & Tags */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Tags</Label>
                <TagInput value={form.tags} onChange={(tags) => update({ tags, customTags: tags })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="dietary">Dietary restrictions</Label>
                <textarea
                  id="dietary"
                  value={form.dietary_restrictions}
                  onChange={(e) => update({ dietary_restrictions: e.target.value })}
                  maxLength={MAX.dietary_restrictions}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                  placeholder="e.g. Vegetarian, gluten-free"
                />
              </div>
              <div>
                <Label htmlFor="accessibility">Accessibility needs</Label>
                <textarea
                  id="accessibility"
                  value={form.accessibility_needs}
                  onChange={(e) => update({ accessibility_needs: e.target.value })}
                  maxLength={MAX.accessibility_needs}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gdpr_consent"
                  checked={form.gdpr_consent_given}
                  onChange={(e) => update({ gdpr_consent_given: e.target.checked })}
                  className="checkbox-on-dark"
                />
                <Label htmlFor="gdpr_consent" className="font-normal">GDPR consent given</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="marketing_consent"
                  checked={form.marketing_consent}
                  onChange={(e) => update({ marketing_consent: e.target.checked })}
                  className="checkbox-on-dark"
                />
                <Label htmlFor="marketing_consent" className="font-normal">Marketing consent</Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3 shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} className="gap-1">
                  <ChevronLeft size={16} />
                  Back
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button type="button" onClick={handleNext} disabled={step === 1 ? !canNextStep1 : !canNextStep2}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={saving || !canNextStep1 || !canNextStep2}>
                  {saving ? "Saving…" : isEdit ? "Save" : "Save VIC"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
