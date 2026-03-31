"use client";

import { useState } from "react";
import { X, Sparkles, Upload } from "lucide-react";
import type { Itinerary, ItineraryTripOption } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/ToastContext";
import { formatDateRange } from "./statusConfig";

function daysAgo(iso?: string): string {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

export function PublishItineraryModal({
  open,
  onClose,
  itinerary,
  nextVersion,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  nextVersion: number;
  onPublish: () => void;
}) {
  if (!open) return null;
  const last = itinerary.published_version ?? 0;
  const lastAt = itinerary.last_published_at
    ? new Date(itinerary.last_published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">Publish Itinerary</h2>
        <p className="text-sm text-muted-foreground mt-2">
          This will update the VIC-facing view to reflect your latest changes.
        </p>
        <div className="mt-4 text-sm space-y-1 text-muted-foreground">
          <p>
            <span className="text-muted-foreground/75">Version:</span> v{nextVersion}
          </p>
          <p>
            <span className="text-muted-foreground/75">Last published:</span> {lastAt}
            {last > 0 && ` (v${last})`}
          </p>
        </div>
        <div className="mt-4 text-sm">
          <p className="text-muted-foreground/75 mb-1">Changes since last publish:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            <li>2 events modified</li>
            <li>1 event added</li>
            <li>Pricing updated</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-border" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-brand-cta text-brand-cta-foreground hover:bg-brand-cta-hover" onClick={onPublish}>
            Publish Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CompareOptionsModal({
  open,
  onClose,
  classicLabel,
  luxuryOption,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  classicLabel: string;
  luxuryOption: ItineraryTripOption;
  onToast: (m: string) => void;
}) {
  if (!open) return null;
  const evClassic = 18;
  const evLux = luxuryOption.days.reduce((n, d) => n + (d.events?.length ?? 0), 0);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Compare Options</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h3 className="font-semibold text-foreground">{classicLabel}</h3>
            <p className="text-sm text-muted-foreground/90">6 days</p>
            <p className="text-sm text-muted-foreground/90">{evClassic} events</p>
            <p className="text-sm text-muted-foreground/90">~€15,000</p>
            <p className="text-sm text-muted-foreground pt-2">Villa San Michele</p>
            <p className="text-sm text-muted-foreground">Car transfers</p>
            <p className="text-sm text-muted-foreground">Restaurant dining</p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-2 bg-muted-foreground/5">
            <h3 className="font-semibold text-foreground">{luxuryOption.name}</h3>
            <p className="text-sm text-muted-foreground/90">6 days</p>
            <p className="text-sm text-muted-foreground/90">{evLux} events</p>
            <p className="text-sm text-foreground font-medium">€{(luxuryOption.total_vic_price ?? 35000).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground pt-2">Rosewood Castiglion del Bosco</p>
            <p className="text-sm text-muted-foreground">Helicopter transfers</p>
            <p className="text-sm text-muted-foreground">Private chef experiences</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6 justify-end">
          <Button variant="outline" className="border-border" onClick={() => onToast("Send Both to VIC — available in the next release")}>
            Send Both to VIC
          </Button>
          <Button className="bg-brand-cta text-brand-cta-foreground hover:bg-brand-cta-hover" onClick={() => onToast("Select as Final Option — available in the next release")}>
            Select as Final
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GuestPortalPreviewModal({
  open,
  onClose,
  itinerary,
  isMonaco,
}: {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  isMonaco: boolean;
}) {
  const showToast = useToast();
  if (!open) return null;
  if (!isMonaco) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 text-neutral-900">
          <div className="flex justify-between">
            <h2 className="font-semibold">Guest Portal</h2>
            <button type="button" onClick={onClose} className="text-neutral-500">
              <X size={20} />
            </button>
          </div>
          <p className="mt-4 text-neutral-600">Guest Portal — coming soon for this itinerary.</p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }
  const dep = itinerary.trip_start_date ? new Date(itinerary.trip_start_date).getTime() : 0;
  const daysUntil = dep ? Math.max(0, Math.ceil((dep - Date.now()) / 86400000)) : 0;
  return (
    <div className="fixed inset-0 z-[60] overflow-auto bg-white">
      <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-neutral-200 bg-white">
        <h2 className="text-lg font-semibold text-neutral-900">Guest Portal Preview</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8 text-neutral-900">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 mb-8 p-5">
          <h1 className="text-xl font-semibold text-neutral-900">{itinerary.trip_name}</h1>
          <p className="text-neutral-600 text-sm mt-1">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
          <p className="text-neutral-500 text-sm mt-2">{daysUntil} days until departure</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {["Itin.", "Pack", "Docs", "Info", "Chat"].map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-lg border border-neutral-200 text-sm text-neutral-600">
              {t}
            </span>
          ))}
        </div>
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Packing suggestions</h3>
          <p className="text-sm text-neutral-600 mb-2">Based on Monaco in May:</p>
          <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
            <li>Light formal wear for F1 events</li>
            <li>Smart casual for restaurant dinners</li>
            <li>Sun protection (avg 24°C in May)</li>
            <li>Comfortable shoes for Monaco streets</li>
          </ul>
        </section>
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Travel documents</h3>
          <ul className="text-sm text-neutral-700 space-y-1">
            <li>☑ Passport (valid until 2029)</li>
            <li>☐ Travel insurance — not yet uploaded</li>
            <li>☑ F1 VIP Suite tickets — confirmed</li>
            <li>☐ Helicopter transfer confirmation</li>
          </ul>
        </section>
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Destination info</h3>
          <p className="text-sm text-neutral-700">Currency: Euro (€) · Language: French · Emergency: 112 · CET (UTC+1) · Tipping 5–10%</p>
        </section>
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Message your advisor</h3>
          <p className="text-sm text-neutral-800">Marie Limousis · TravelLustre</p>
          <p className="text-sm text-neutral-500">marie@travellustre.com</p>
          <Button variant="outline" className="mt-2" onClick={() => showToast("Send Message to advisor — available in the next release")}>
            Send Message
          </Button>
        </section>
      </div>
    </div>
  );
}

export function InvoiceModal({
  open,
  onClose,
  itinerary,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  onGenerate: () => void;
}) {
  const showToast = useToast();
  if (!open) return null;
  const lines: { title: string; qty: number; amt: number }[] = [];
  (itinerary.days ?? []).forEach((d) => {
    (d.events ?? []).forEach((e) => {
      if (e.vic_price != null && e.vic_price > 0 && e.status !== "cancelled") {
        lines.push({ title: e.title, qty: 1, amt: e.vic_price });
      }
    });
  });
  const subtotal = lines.reduce((s, l) => s + l.amt, 0);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-foreground">Generate Invoice</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/90">Invoice #: INV-2026-0023 · Issue date: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · EUR</p>
        <div className="mt-4 text-sm">
          <p className="text-muted-foreground uppercase text-xs">Bill to</p>
          <p className="text-foreground">{itinerary.primary_vic_name}</p>
          <p className="text-muted-foreground text-xs mt-2">Trip</p>
          <p className="text-foreground">{itinerary.trip_name}</p>
          <p className="text-muted-foreground/90 text-xs">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
        </div>
        <div className="mt-4 border-t border-border pt-3 text-sm">
          <div className="grid grid-cols-12 gap-2 text-muted-foreground text-xs mb-1">
            <span className="col-span-7">Line</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-3 text-right">Amount</span>
          </div>
          {lines.slice(0, 12).map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 text-foreground/88 text-xs py-0.5">
              <span className="col-span-7 truncate">{l.title}</span>
              <span className="col-span-2">{l.qty}</span>
              <span className="col-span-3 text-right">€{l.amt.toLocaleString()}</span>
            </div>
          ))}
          {lines.length > 12 && <p className="text-xs text-muted-foreground">… {lines.length - 12} more lines</p>}
        </div>
        <div className="mt-4 border-t border-border pt-2 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground/90">Subtotal</span>
            <span className="text-foreground">€{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground/90">Tax</span>
            <span>€0</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground pt-1">
            <span>Total due</span>
            <span>€{(itinerary.total_vic_price ?? subtotal).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">50% deposit upon confirmation · Balance 30 days before departure</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" className="border-border" onClick={() => {
            showToast("Invoice PDF — opening print dialog");
            window.print();
          }}>
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="border-border" onClick={() => showToast("Email invoice to VIC — available in the next release")}>
            Email to VIC
          </Button>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-border" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onGenerate}>Generate</Button>
        </div>
      </div>
    </div>
  );
}

export function ImportItineraryModal({ open, onClose, onParse }: { open: boolean; onClose: () => void; onParse: () => void }) {
  const [loading, setLoading] = useState(false);
  if (!open) return null;
  const handleParse = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onParse();
      onClose();
    }, 3000);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" /> Import Itinerary
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X size={18} />
          </Button>
        </div>
        {loading ? (
          <div className="py-12 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <p className="text-sm text-blue-300">Parsing your content…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground/90 mt-2">Paste a URL, upload a PDF, or paste text and we&apos;ll convert it into structured events.</p>
            <textarea className="w-full mt-4 h-32 rounded-lg bg-white/5 border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Paste URL or text here…" />
            <Button variant="outline" className="mt-2 border-border gap-2">
              <Upload size={14} /> Upload PDF
            </Button>
            <p className="text-xs text-blue-400/80 mt-4">✦ AI-powered import</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" className="border-border" onClick={onClose}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-500" onClick={handleParse}>
                Import & Parse
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DestinationGuideModal({ open, onClose, vicName, dest, dates, onGenerate }: { open: boolean; onClose: () => void; vicName: string; dest: string; dates: string; onGenerate: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" /> Generate Destination Guide
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground/90 mt-2">We&apos;ll create a personalized travel brief.</p>
        <div className="mt-4 space-y-2 text-sm">
          <label className="block text-muted-foreground text-xs">Destination</label>
          <input defaultValue={dest} className="w-full rounded-lg bg-white/5 border border-border px-3 py-2 text-foreground" />
          <p className="text-muted-foreground/90">VIC: {vicName}</p>
          <p className="text-muted-foreground/90">Travel dates: {dates}</p>
        </div>
        <div className="mt-4 text-sm text-foreground/88 space-y-1">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="checkbox-on-dark checkbox-on-dark-sm" /> Weather & climate
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="checkbox-on-dark checkbox-on-dark-sm" /> Local dining recommendations
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="checkbox-on-dark checkbox-on-dark-sm" /> Cultural tips & etiquette
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="checkbox-on-dark checkbox-on-dark-sm" /> Transportation guide
          </label>
        </div>
        <p className="text-xs text-blue-400/80 mt-4">✦ Personalized using VIC profile insights</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-border" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500" onClick={onGenerate}>
            Generate Guide
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ActivitySuggestModal({
  open,
  onClose,
  vicName,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  vicName: string;
  onAdd: (day: string) => void;
}) {
  if (!open) return null;
  const items = [
    { title: "Wine tasting at Clos du Rocher", sub: "Private cellar, Monégasque wines", day: "Day 2" },
    { title: "Private viewing — Nouveau Musée", sub: "Contemporary art collection", day: "Day 3" },
    { title: "Sunset yacht charter", sub: "Along the Riviera coastline", day: "Day 2" },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-400" /> Activity Suggestions for {vicName.split(" ")[0]}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground/90 mt-2">Based on VIC profile: wine enthusiast, fine dining, motorsport, art collector</p>
        <p className="text-sm text-muted-foreground mt-1">For Monaco (23–26 May):</p>
        <div className="space-y-3 mt-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">🍷 {it.title}</p>
              <p className="text-xs text-muted-foreground">{it.sub}</p>
              <Button size="sm" variant="outline" className="mt-2 border-blue-500/30 text-blue-300" onClick={() => onAdd(it.day)}>
                + Add to {it.day}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-400/80 mt-4">✦ Suggestions based on VIC preferences</p>
      </div>
    </div>
  );
}

export function AutomationBuilderModal({ open, onClose, onSaveDraft }: { open: boolean; onClose: () => void; onSaveDraft: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" showCloseButton>
        <DialogHeader className="text-left">
          <DialogTitle>Create automation</DialogTitle>
        </DialogHeader>
        <Input placeholder="Name" className="mt-1" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">When (trigger)</p>
        <select className="mt-1 h-9 w-full rounded-md border border-input bg-inset px-3 text-sm text-foreground outline-none">
          <option>Select trigger…</option>
          <option>VIC birthday</option>
          <option>Passport expiry in X days</option>
          <option>Trip status changed</option>
          <option>Trip departure in X days</option>
          <option>New VIC created</option>
          <option>VIC Acuity profile completed</option>
        </select>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Then (action)</p>
        <select className="mt-1 h-9 w-full rounded-md border border-input bg-inset px-3 text-sm text-foreground outline-none">
          <option>Select action…</option>
          <option>Send email</option>
          <option>Create action item</option>
          <option>Notify advisor</option>
          <option>Update VIC field</option>
          <option>Run Acuity on VIC</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Automation builder in development. These templates show planned capabilities.
        </p>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" className="border-input" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="toolbarAccent" size="sm" onClick={onSaveDraft}>
            Save draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SendFormModal({
  open,
  onClose,
  vicName,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  vicName: string;
  onSend: () => void;
}) {
  const showToast = useToast();
  const templates = [
    { t: "Travel Preferences", d: "Dietary, seating, airline, hotel preferences" },
    { t: "Passport & Emergency Contact", d: "Passport details, emergency contacts, insurance" },
    { t: "Trip Inquiry", d: "Destination wishes, budget, dates, group size" },
    { t: "Post-Trip Feedback", d: "Satisfaction, favorite moments, suggestions" },
  ];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-foreground">Send Form to {vicName}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Select a template:</p>
        <div className="space-y-2 mt-3">
          {templates.map((x) => (
            <button
              key={x.t}
              type="button"
              className="w-full text-left rounded-lg border border-border p-3 hover:bg-white/5"
            >
              <p className="text-sm font-medium text-foreground">📋 {x.t}</p>
              <p className="text-xs text-muted-foreground">{x.d}</p>
            </button>
          ))}
        </div>
        <Button variant="link" className="text-blue-400 p-0 h-auto mt-2" onClick={() => showToast("Custom forms coming in v2 — use templates for now")}>
          Create Custom Form
        </Button>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-border" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSend}>Send Selected</Button>
        </div>
      </div>
    </div>
  );
}
