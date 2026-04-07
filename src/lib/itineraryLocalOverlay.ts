/**
 * Preview-only: persist itinerary edits (e.g. add product as event) in localStorage.
 * Merged onto `FAKE_ITINERARIES` wherever itineraries are shown until a real API exists.
 */

import type { Itinerary, ItineraryDay, ItineraryEvent, EventType } from "@/types/itinerary";
import type { Product } from "@/types/product";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";

/** Sum VIC sell from line items (events with numeric vic_price). */
export function sumItineraryEventVicPrices(it: Itinerary): number {
  let s = 0;
  for (const d of it.days ?? []) {
    for (const e of d.events ?? []) {
      if (typeof e.vic_price === "number" && !Number.isNaN(e.vic_price)) s += e.vic_price;
    }
  }
  return s;
}

/**
 * Preview-only estimate when product has no retail price — keeps trip totals moving when adding from Products.
 * Replace with real pricing when the API supplies quotes per line item.
 */
function indicativeVicPriceFromProduct(p: Product): number {
  switch (p.price_range) {
    case "budget":
      return 350;
    case "mid":
      return 950;
    case "premium":
      return 2800;
    case "luxury":
      return 6500;
    case "ultra_luxury":
      return 15000;
    default:
      return 1200;
  }
}

const STORAGE_KEY = "enable_vic_itinerary_overlay_v1";

type OverlayFile = {
  version: 1;
  appendedByItinerary: Record<string, Array<{ dayNumber: number; event: ItineraryEvent }>>;
};

function productId(p: Product): string {
  return p.id ?? p._id ?? "";
}

function safeRead(): OverlayFile {
  if (typeof window === "undefined") return { version: 1, appendedByItinerary: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, appendedByItinerary: {} };
    const p = JSON.parse(raw) as OverlayFile;
    if (p?.version !== 1 || p.appendedByItinerary == null || typeof p.appendedByItinerary !== "object") {
      return { version: 1, appendedByItinerary: {} };
    }
    return p;
  } catch {
    return { version: 1, appendedByItinerary: {} };
  }
}

function safeWrite(data: OverlayFile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

const EVENT_TYPES: Set<string> = new Set([
  "stay",
  "activity",
  "meal",
  "transfer",
  "experience",
  "flight",
  "free_time",
  "note",
]);

function normalizeEventType(raw: string): EventType {
  if (EVENT_TYPES.has(raw)) return raw as EventType;
  return "activity";
}

function newLocalEventId(): string {
  return `evt-local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Record a product added from the directory (preview). No-op on server. */
export function persistProductAddedEvent(
  itineraryId: string,
  product: Product,
  opts: { day: number; event_type: string; custom_notes?: string }
): void {
  if (typeof window === "undefined") return;

  const event: ItineraryEvent = {
    id: newLocalEventId(),
    event_type: normalizeEventType(opts.event_type),
    title: product.name,
    description: product.description,
    status: "tentative",
    source_product_id: productId(product),
    source_product_name: product.name,
    source_product_category: product.category,
    custom_notes: opts.custom_notes,
    thumbnail_url: product.hero_image_url ?? product.gallery_urls?.[0],
    vic_price: indicativeVicPriceFromProduct(product),
  };

  const file = safeRead();
  const arr = file.appendedByItinerary[itineraryId] ?? [];
  arr.push({ dayNumber: Math.max(1, Math.floor(opts.day)), event });
  file.appendedByItinerary[itineraryId] = arr;
  safeWrite(file);
  try {
    window.dispatchEvent(new CustomEvent("enable-itinerary-overlay-changed", { detail: { itineraryId } }));
  } catch {
    /* ignore */
  }
}

/** Deep-merge appended events onto a base itinerary (from mock or API). */
export function applyItineraryOverlay(base: Itinerary): Itinerary {
  const file = safeRead();
  const appended = file.appendedByItinerary[base.id];
  if (!appended?.length) return base;

  let clone: Itinerary;
  try {
    clone = structuredClone(base);
  } catch {
    clone = JSON.parse(JSON.stringify(base)) as Itinerary;
  }

  for (const { dayNumber, event } of appended) {
    const dn = Math.max(1, dayNumber);
    let day = clone.days.find((d) => d.day_number === dn);
    if (!day) {
      const newDay: ItineraryDay = {
        day_number: dn,
        title: `Day ${dn}`,
        location: "",
        events: [],
      };
      clone.days = [...clone.days, newDay];
      clone.days.sort((a, b) => a.day_number - b.day_number);
      day = clone.days.find((d) => d.day_number === dn)!;
    }
    day.events = [...(day.events ?? []), { ...event }];
  }

  /** Add VIC sell for preview-appended lines only; keep mock headline total as baseline. */
  const appendedVicSum = appended.reduce((s, x) => s + (x.event.vic_price ?? 0), 0);
  if (appendedVicSum > 0) {
    const baseline =
      base.total_vic_price != null && !Number.isNaN(base.total_vic_price)
        ? base.total_vic_price
        : sumItineraryEventVicPrices(base);
    clone.total_vic_price = baseline + appendedVicSum;
  }

  return clone;
}

/** Mock itineraries plus any preview-local mutations (list, pickers, cross-links). */
export function getPreviewItinerarySource(): Itinerary[] {
  return FAKE_ITINERARIES.map((it) => applyItineraryOverlay(it));
}

export function getItineraryOverlaySummary(): { itineraryCount: number; eventCount: number } {
  const f = safeRead();
  let eventCount = 0;
  for (const list of Object.values(f.appendedByItinerary)) {
    eventCount += list?.length ?? 0;
  }
  return { itineraryCount: Object.keys(f.appendedByItinerary).length, eventCount };
}

/** True if this trip has preview-appended line items in local storage. */
export function itineraryHasLocalOverlayAppends(itineraryId: string): boolean {
  const f = safeRead();
  const list = f.appendedByItinerary[itineraryId];
  return (list?.length ?? 0) > 0;
}

/** Remove all preview-appended itinerary events and notify listeners. */
export function clearItineraryOverlay(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("enable-itinerary-overlay-changed", { detail: {} }));
  } catch {
    /* ignore */
  }
}
