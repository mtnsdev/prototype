"use client";

import { useState } from "react";
import { X, Sparkles, Upload } from "lucide-react";
import type { Itinerary, ItineraryTripOption } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
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
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141414] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">Publish Itinerary</h2>
        <p className="text-sm text-[rgba(245,245,245,0.6)] mt-2">
          This will update the client-facing view to reflect your latest changes.
        </p>
        <div className="mt-4 text-sm space-y-1 text-[rgba(245,245,245,0.7)]">
          <p>
            <span className="text-[rgba(245,245,245,0.5)]">Version:</span> v{nextVersion}
          </p>
          <p>
            <span className="text-[rgba(245,245,245,0.5)]">Last published:</span> {lastAt}
            {last > 0 && ` (v${last})`}
          </p>
        </div>
        <div className="mt-4 text-sm">
          <p className="text-[rgba(245,245,245,0.5)] mb-1">Changes since last publish:</p>
          <ul className="list-disc list-inside text-[rgba(245,245,245,0.75)] space-y-0.5">
            <li>2 events modified</li>
            <li>1 event added</li>
            <li>Pricing updated</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-white/10" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onPublish}>
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
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#141414] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Compare Options</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 p-4 space-y-2">
            <h3 className="font-semibold text-[#F5F5F5]">{classicLabel}</h3>
            <p className="text-sm text-gray-400">6 days</p>
            <p className="text-sm text-gray-400">{evClassic} events</p>
            <p className="text-sm text-gray-400">~€15,000</p>
            <p className="text-sm text-[rgba(245,245,245,0.7)] pt-2">Villa San Michele</p>
            <p className="text-sm text-gray-500">Car transfers</p>
            <p className="text-sm text-gray-500">Restaurant dining</p>
          </div>
          <div className="rounded-lg border border-violet-500/20 p-4 space-y-2">
            <h3 className="font-semibold text-[#F5F5F5]">{luxuryOption.name}</h3>
            <p className="text-sm text-gray-400">6 days</p>
            <p className="text-sm text-gray-400">{evLux} events</p>
            <p className="text-sm text-emerald-400">€{(luxuryOption.total_client_price ?? 35000).toLocaleString()}</p>
            <p className="text-sm text-[rgba(245,245,245,0.7)] pt-2">Rosewood Castiglion del Bosco</p>
            <p className="text-sm text-gray-500">Helicopter transfers</p>
            <p className="text-sm text-gray-500">Private chef experiences</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6 justify-end">
          <Button variant="outline" className="border-white/10" onClick={() => onToast("Send Both to Client — coming in v2")}>
            Send Both to Client
          </Button>
          <Button className="bg-violet-600" onClick={() => onToast("Select as Final — coming in v2")}>
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
  if (!open) return null;
  if (!isMonaco) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-6 text-gray-900">
          <div className="flex justify-between">
            <h2 className="font-semibold">Guest Portal</h2>
            <button type="button" onClick={onClose} className="text-gray-500">
              <X size={20} />
            </button>
          </div>
          <p className="mt-4 text-gray-600">Guest Portal — coming soon for this itinerary.</p>
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
      <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Guest Portal Preview</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8 text-gray-900">
        <div className="rounded-xl overflow-hidden mb-8">
          <div className="h-48 relative bg-gray-100">
            <ImageWithFallback fallbackType="trip" src={itinerary.hero_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
              <h1 className="text-xl font-serif font-semibold text-white">{itinerary.trip_name}</h1>
              <p className="text-white/90 text-sm">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
              <p className="text-amber-200 text-sm mt-1">⏱ {daysUntil} days until departure</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {["Itin.", "Pack", "Docs", "Info", "Chat"].map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600">
              {t}
            </span>
          ))}
        </div>
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Packing suggestions</h3>
          <p className="text-sm text-gray-600 mb-2">Based on Monaco in May:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Light formal wear for F1 events</li>
            <li>Smart casual for restaurant dinners</li>
            <li>Sun protection (avg 24°C in May)</li>
            <li>Comfortable shoes for Monaco streets</li>
          </ul>
        </section>
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Travel documents</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>☑ Passport (valid until 2029)</li>
            <li>☐ Travel insurance — not yet uploaded</li>
            <li>☑ F1 VIP Suite tickets — confirmed</li>
            <li>☐ Helicopter transfer confirmation</li>
          </ul>
        </section>
        <section className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Destination info</h3>
          <p className="text-sm text-gray-700">Currency: Euro (€) · Language: French · Emergency: 112 · CET (UTC+1) · Tipping 5–10%</p>
        </section>
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Message your advisor</h3>
          <p className="text-sm text-gray-800">Marie Limousis · TravelLustre</p>
          <p className="text-sm text-gray-500">marie@travellustre.com</p>
          <Button variant="outline" className="mt-2" onClick={() => {}}>
            Send Message — coming soon
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
  if (!open) return null;
  const lines: { title: string; qty: number; amt: number }[] = [];
  (itinerary.days ?? []).forEach((d) => {
    (d.events ?? []).forEach((e) => {
      if (e.client_price != null && e.client_price > 0 && e.status !== "cancelled") {
        lines.push({ title: e.title, qty: 1, amt: e.client_price });
      }
    });
  });
  const subtotal = lines.reduce((s, l) => s + l.amt, 0);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141414] p-6 shadow-xl my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Generate Invoice</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-xs text-gray-400">Invoice #: INV-2026-0023 · Issue date: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · EUR</p>
        <div className="mt-4 text-sm">
          <p className="text-gray-500 uppercase text-xs">Bill to</p>
          <p className="text-[#F5F5F5]">{itinerary.primary_vic_name}</p>
          <p className="text-gray-500 text-xs mt-2">Trip</p>
          <p className="text-[#F5F5F5]">{itinerary.trip_name}</p>
          <p className="text-gray-400 text-xs">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
        </div>
        <div className="mt-4 border-t border-white/10 pt-3 text-sm">
          <div className="grid grid-cols-12 gap-2 text-gray-500 text-xs mb-1">
            <span className="col-span-7">Line</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-3 text-right">Amount</span>
          </div>
          {lines.slice(0, 12).map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 text-gray-300 text-xs py-0.5">
              <span className="col-span-7 truncate">{l.title}</span>
              <span className="col-span-2">{l.qty}</span>
              <span className="col-span-3 text-right">€{l.amt.toLocaleString()}</span>
            </div>
          ))}
          {lines.length > 12 && <p className="text-xs text-gray-500">… {lines.length - 12} more lines</p>}
        </div>
        <div className="mt-4 border-t border-white/10 pt-2 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-[#F5F5F5]">€{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax</span>
            <span>€0</span>
          </div>
          <div className="flex justify-between font-semibold text-[#F5F5F5] pt-1">
            <span>Total due</span>
            <span>€{(itinerary.total_client_price ?? subtotal).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">50% deposit upon confirmation · Balance 30 days before departure</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" className="border-white/10" onClick={() => {}}>
            Download PDF — coming soon
          </Button>
          <Button variant="outline" size="sm" className="border-white/10" onClick={() => {}}>
            Email to Client — coming soon
          </Button>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-white/10" onClick={onClose}>
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
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141414] p-6">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-violet-300 flex items-center gap-2">
            <Sparkles size={18} /> Import Itinerary with Acuity
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X size={18} />
          </Button>
        </div>
        {loading ? (
          <div className="py-12 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <p className="text-sm text-violet-300">Acuity is parsing your content…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mt-2">Paste a URL, upload a PDF, or paste text and Acuity will convert it into structured events.</p>
            <textarea className="w-full mt-4 h-32 rounded-lg bg-white/5 border border-white/10 p-3 text-sm text-[#F5F5F5] placeholder:text-gray-500" placeholder="Paste URL or text here…" />
            <Button variant="outline" className="mt-2 border-white/10 gap-2">
              <Upload size={14} /> Upload PDF
            </Button>
            <p className="text-xs text-violet-400/80 mt-4">✦ Powered by Acuity Intelligence</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" className="border-white/10" onClick={onClose}>
                Cancel
              </Button>
              <Button className="bg-violet-600" onClick={handleParse}>
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
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141414] p-6">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-violet-300 flex items-center gap-2">
            <Sparkles size={18} /> Generate Destination Guide
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">Acuity will create a personalized travel brief.</p>
        <div className="mt-4 space-y-2 text-sm">
          <label className="block text-gray-500 text-xs">Destination</label>
          <input defaultValue={dest} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-[#F5F5F5]" />
          <p className="text-gray-400">VIC: {vicName}</p>
          <p className="text-gray-400">Travel dates: {dates}</p>
        </div>
        <div className="mt-4 text-sm text-gray-300 space-y-1">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="rounded" /> Weather & climate
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="rounded" /> Local dining recommendations
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="rounded" /> Cultural tips & etiquette
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked readOnly className="rounded" /> Transportation guide
          </label>
        </div>
        <p className="text-xs text-violet-400/80 mt-4">✦ Personalized using Acuity VIC insights</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-white/10" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-violet-600" onClick={onGenerate}>
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
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141414] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-violet-300 flex items-center gap-2">
            <Sparkles size={18} /> Activity Suggestions for {vicName.split(" ")[0]}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">Based on Acuity insights: wine enthusiast, fine dining, motorsport, art collector</p>
        <p className="text-sm text-gray-500 mt-1">For Monaco (23–26 May):</p>
        <div className="space-y-3 mt-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-white/10 p-3">
              <p className="text-sm font-medium text-[#F5F5F5]">🍷 {it.title}</p>
              <p className="text-xs text-gray-500">{it.sub}</p>
              <Button size="sm" variant="outline" className="mt-2 border-violet-500/30 text-violet-300" onClick={() => onAdd(it.day)}>
                + Add to {it.day}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-violet-400/80 mt-4">✦ Suggestions powered by Acuity + Gemini</p>
      </div>
    </div>
  );
}

export function AutomationBuilderModal({ open, onClose, onSaveDraft }: { open: boolean; onClose: () => void; onSaveDraft: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141414] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Create Automation</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <input placeholder="Name" className="w-full mt-4 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" />
        <p className="text-xs text-gray-500 mt-4 uppercase">When (Trigger)</p>
        <select className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-[#F5F5F5]">
          <option>Select trigger…</option>
          <option>VIC birthday</option>
          <option>Passport expiry in X days</option>
          <option>Trip status changed</option>
          <option>Trip departure in X days</option>
          <option>New VIC created</option>
          <option>Acuity scan completed</option>
        </select>
        <p className="text-xs text-gray-500 mt-4 uppercase">Then (Action)</p>
        <select className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-[#F5F5F5]">
          <option>Select action…</option>
          <option>Send email</option>
          <option>Create action item</option>
          <option>Notify advisor</option>
          <option>Update VIC field</option>
          <option>Run Acuity scan</option>
        </select>
        <p className="text-xs text-gray-500 mt-4">Automation builder in development. These templates show planned capabilities.</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-white/10" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onSaveDraft}>
            Save Draft
          </Button>
        </div>
      </div>
    </div>
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
  const templates = [
    { t: "Travel Preferences", d: "Dietary, seating, airline, hotel preferences" },
    { t: "Passport & Emergency Contact", d: "Passport details, emergency contacts, insurance" },
    { t: "Trip Inquiry", d: "Destination wishes, budget, dates, group size" },
    { t: "Post-Trip Feedback", d: "Satisfaction, favorite moments, suggestions" },
  ];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141414] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Send Form to {vicName}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Select a template:</p>
        <div className="space-y-2 mt-3">
          {templates.map((x) => (
            <button
              key={x.t}
              type="button"
              className="w-full text-left rounded-lg border border-white/10 p-3 hover:bg-white/5"
            >
              <p className="text-sm font-medium text-[#F5F5F5]">📋 {x.t}</p>
              <p className="text-xs text-gray-500">{x.d}</p>
            </button>
          ))}
        </div>
        <Button variant="link" className="text-violet-400 p-0 h-auto mt-2" onClick={() => {}}>
          Create Custom Form — coming soon
        </Button>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" className="border-white/10" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSend}>Send Selected</Button>
        </div>
      </div>
    </div>
  );
}
