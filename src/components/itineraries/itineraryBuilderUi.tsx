"use client";

import type { Itinerary, ItineraryEvent, ItineraryDay } from "@/types/itinerary";
import { cn } from "@/lib/utils";

export type BuilderDisplayStatus = "Draft" | "Preparing" | "Confirmed" | "Completed" | "Cancelled";

export function getBuilderDisplayStatus(it: Itinerary): BuilderDisplayStatus {
  if (it.status === "cancelled") return "Cancelled";
  if (it.status === "completed") return "Completed";
  if (it.status === "confirmed") return "Confirmed";
  if (it.status === "draft") return "Draft";
  if (it.status === "proposed" || it.status === "in_progress") return "Preparing";
  return "Draft";
}

export function builderTopAccentClass(s: BuilderDisplayStatus): string {
  switch (s) {
    case "Confirmed":
    case "Completed":
      return "bg-[#5B8A6E]";
    case "Preparing":
      return "bg-[#B8976E]";
    case "Draft":
      return "bg-[#6B6560]";
    case "Cancelled":
      return "bg-[#A66B6B]";
    default:
      return "bg-[#6B6560]";
  }
}

export function StatusBadge({ status }: { status: BuilderDisplayStatus }) {
  const cls = {
    Confirmed: "border-[rgba(91,138,110,0.12)] bg-[rgba(91,138,110,0.08)] text-[#5B8A6E]",
    Completed: "border-[rgba(91,138,110,0.12)] bg-[rgba(91,138,110,0.08)] text-[#5B8A6E]",
    Preparing: "border-[rgba(184,151,110,0.12)] bg-[rgba(184,151,110,0.08)] text-[#B8976E]",
    Draft: "border-[rgba(107,101,96,0.12)] bg-[rgba(107,101,96,0.08)] text-[#6B6560]",
    Cancelled: "border-[rgba(166,107,107,0.12)] bg-[rgba(166,107,107,0.08)] text-[#A66B6B]",
  }[status];
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", cls)}>
      {status}
    </span>
  );
}

function parseIso(d?: string): Date | null {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

/** e.g. Apr 11–14, 2026 */
export function formatTripDatesDisplay(start?: string, end?: string): string {
  const a = parseIso(start);
  const b = parseIso(end);
  if (!a && !b) return "—";
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });
  if (a && b) {
    const sameYear = a.getFullYear() === b.getFullYear();
    const sameMonth = sameYear && a.getMonth() === b.getMonth();
    if (sameMonth) {
      return `${a.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${b.getDate()}, ${b.getFullYear()}`;
    }
    return `${fmt(a, true)} – ${fmt(b, true)}`;
  }
  return fmt(a ?? b!, true);
}

export function nightsForItinerary(it: Itinerary): number {
  const a = parseIso(it.trip_start_date);
  const b = parseIso(it.trip_end_date);
  if (!a || !b) return it.days?.length ?? 0;
  const ms = b.getTime() - a.getTime();
  const n = Math.round(ms / 86400000);
  return Math.max(1, n || (it.days?.length ?? 1));
}

export function countLinkedProducts(it: Itinerary): number {
  let n = 0;
  for (const d of it.days ?? []) {
    for (const e of d.events ?? []) {
      if (e.source_product_id || e.source_product_name) n += 1;
    }
  }
  return n;
}

export function commissionDisplay(it: Itinerary, canView: boolean): string | null {
  if (!canView) return null;
  const t = it.total_commission;
  if (t == null || t === 0) return null;
  const sym = it.currency === "EUR" ? "€" : it.currency === "USD" ? "$" : "";
  return `${sym}${t.toLocaleString()}`;
}

export function updatedShort(iso?: string): string {
  const d = parseIso(iso);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Map event → builder item category for icons */
export type BuilderItemKind = "accommodation" | "experience" | "transfer" | "dining" | "note";

export function eventToBuilderKind(ev: ItineraryEvent): BuilderItemKind {
  switch (ev.event_type) {
    case "stay":
      return "accommodation";
    case "meal":
      return "dining";
    case "transfer":
    case "flight":
      return "transfer";
    case "note":
    case "free_time":
      return "note";
    case "activity":
    case "experience":
      return "experience";
    default:
      return "experience";
  }
}

export function eventItemStatusLabel(ev: ItineraryEvent): "confirmed" | "proposed" | null {
  if (ev.status === "confirmed") return "confirmed";
  if (ev.status === "tentative") return "proposed";
  return null;
}

export function formatProductCommission(ev: ItineraryEvent): string | null {
  if (ev.commission_amount != null && ev.commission_amount > 0) {
    return `€${ev.commission_amount.toLocaleString()}`;
  }
  if (ev.commission_rate != null && ev.commission_rate > 0 && ev.custom_notes?.includes("FSPP")) {
    return `${ev.commission_rate}% + FSPP amenities`;
  }
  if (ev.commission_rate != null && ev.commission_rate > 0) {
    return `${ev.commission_rate}% rack`;
  }
  return null;
}

export function dayLabelDate(day: ItineraryDay): string {
  if (day.date) {
    const d = parseIso(day.date);
    if (d) {
      return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    }
  }
  return "—";
}
