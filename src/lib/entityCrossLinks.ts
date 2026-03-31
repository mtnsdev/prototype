import type { Itinerary } from "@/types/itinerary";
import type { DirectoryProduct } from "@/types/product-directory";
import type { VIC } from "@/types/vic";

/** A resolved cross-link between a VIC and a product. */
export interface VicProductLink {
  vicId: string;
  vicName: string;
  productId: string;
  productName: string;
  /** How the link was established. */
  source: "itinerary_event" | "manual" | "acuity";
  /** If from an itinerary, which one. */
  itineraryId?: string;
  itineraryName?: string;
  /** Most recent stay/visit date. */
  lastVisitDate?: string;
  /** Total times this VIC has booked this product. */
  visitCount: number;
}

type MutableVicProductLink = VicProductLink & { _lastDateMs: number };

function eventDateMs(itinerary: Itinerary, dayDate?: string, eventStart?: string): number {
  const candidate = `${dayDate ?? itinerary.trip_start_date ?? itinerary.created_at ?? ""}T${eventStart ?? "00:00"}:00`;
  const ts = Date.parse(candidate);
  if (!Number.isNaN(ts)) return ts;
  const fallback = Date.parse(dayDate ?? itinerary.trip_start_date ?? itinerary.created_at ?? "");
  return Number.isNaN(fallback) ? 0 : fallback;
}

function pushOrMergeLink(
  bucket: Map<string, MutableVicProductLink>,
  next: Omit<VicProductLink, "visitCount"> & { visitCount?: number },
  eventTs: number
): void {
  const key = `${next.vicId}::${next.productId}`;
  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, {
      ...next,
      visitCount: next.visitCount ?? 1,
      _lastDateMs: eventTs,
    });
    return;
  }
  existing.visitCount += next.visitCount ?? 1;
  if (eventTs > existing._lastDateMs) {
    existing._lastDateMs = eventTs;
    existing.lastVisitDate = next.lastVisitDate ?? existing.lastVisitDate;
    existing.itineraryId = next.itineraryId ?? existing.itineraryId;
    existing.itineraryName = next.itineraryName ?? existing.itineraryName;
  }
}

/** Resolve all products linked to a VIC (via itinerary events + manual links). */
export function getProductsForVic(
  vicId: string,
  itineraries: Itinerary[],
  products: DirectoryProduct[],
  vics: VIC[] = []
): VicProductLink[] {
  const links = new Map<string, MutableVicProductLink>();
  const productsById = new Map((products ?? []).map((p) => [p.id, p]));
  const vic = (vics ?? []).find((v) => v.id === vicId);
  const vicName = vic?.full_name ?? "Unknown VIC";

  for (const itinerary of itineraries ?? []) {
    if ((itinerary?.primary_vic_id ?? "") !== vicId) continue;
    for (const day of itinerary.days ?? []) {
      for (const event of day.events ?? []) {
        const productId = event?.source_product_id;
        if (!productId) continue;
        const productName =
          event.source_product_name ??
          productsById.get(productId)?.name ??
          "Unknown product";
        const ts = eventDateMs(itinerary, day.date, event.start_time);
        pushOrMergeLink(
          links,
          {
            vicId,
            vicName: itinerary.primary_vic_name ?? vicName,
            productId,
            productName,
            source: "itinerary_event",
            itineraryId: itinerary.id,
            itineraryName: itinerary.trip_name,
            lastVisitDate: day.date ?? itinerary.trip_start_date,
          },
          ts
        );
      }
    }
  }

  const provenanceSource = vic?.field_provenance?.linked_product_ids?.source;
  const manualSource: VicProductLink["source"] = provenanceSource === "acuity" ? "acuity" : "manual";
  for (const productId of vic?.linked_product_ids ?? []) {
    if (links.has(`${vicId}::${productId}`)) continue;
    const productName = productsById.get(productId)?.name ?? "Unknown product";
    pushOrMergeLink(
      links,
      {
        vicId,
        vicName,
        productId,
        productName,
        source: manualSource,
        visitCount: 1,
      },
      0
    );
  }

  return Array.from(links.values())
    .sort((a, b) => b._lastDateMs - a._lastDateMs || b.visitCount - a.visitCount)
    .map(({ _lastDateMs: _ignored, ...link }) => link);
}

/** Resolve all VICs linked to a product (reverse lookup). */
export function getVicsForProduct(
  productId: string,
  vics: VIC[],
  itineraries: Itinerary[]
): VicProductLink[] {
  const links = new Map<string, MutableVicProductLink>();
  const vicById = new Map((vics ?? []).map((v) => [v.id, v]));

  for (const itinerary of itineraries ?? []) {
    const vicId = itinerary.primary_vic_id;
    if (!vicId) continue;
    for (const day of itinerary.days ?? []) {
      for (const event of day.events ?? []) {
        if ((event?.source_product_id ?? "") !== productId) continue;
        const ts = eventDateMs(itinerary, day.date, event.start_time);
        const knownVic = vicById.get(vicId);
        pushOrMergeLink(
          links,
          {
            vicId,
            vicName: itinerary.primary_vic_name ?? knownVic?.full_name ?? "Unknown VIC",
            productId,
            productName: event.source_product_name ?? "Unknown product",
            source: "itinerary_event",
            itineraryId: itinerary.id,
            itineraryName: itinerary.trip_name,
            lastVisitDate: day.date ?? itinerary.trip_start_date,
          },
          ts
        );
      }
    }
  }

  for (const vic of vics ?? []) {
    const linked = vic.linked_product_ids ?? [];
    if (!linked.includes(productId)) continue;
    const key = `${vic.id}::${productId}`;
    if (links.has(key)) continue;
    const provenanceSource = vic.field_provenance?.linked_product_ids?.source;
    const source: VicProductLink["source"] = provenanceSource === "acuity" ? "acuity" : "manual";
    pushOrMergeLink(
      links,
      {
        vicId: vic.id,
        vicName: vic.full_name,
        productId,
        productName: "Unknown product",
        source,
        visitCount: 1,
      },
      0
    );
  }

  return Array.from(links.values())
    .sort((a, b) => b.visitCount - a.visitCount || b._lastDateMs - a._lastDateMs)
    .map(({ _lastDateMs: _ignored, ...link }) => link);
}

/** Resolve all itineraries that include a specific product. */
export function getItinerariesForProduct(
  productId: string,
  itineraries: Itinerary[]
): {
  itineraryId: string;
  itineraryName: string;
  vicName: string;
  eventCount: number;
  totalSpend: number;
}[] {
  const rows = new Map<
    string,
    { itineraryId: string; itineraryName: string; vicName: string; eventCount: number; totalSpend: number }
  >();

  for (const itinerary of itineraries ?? []) {
    let eventCount = 0;
    let totalSpend = 0;
    for (const day of itinerary.days ?? []) {
      for (const event of day.events ?? []) {
        if ((event?.source_product_id ?? "") !== productId) continue;
        eventCount += 1;
        totalSpend += event.vic_price ?? 0;
      }
    }
    if (eventCount === 0) continue;
    rows.set(itinerary.id, {
      itineraryId: itinerary.id,
      itineraryName: itinerary.trip_name,
      vicName: itinerary.primary_vic_name ?? "Unknown VIC",
      eventCount,
      totalSpend,
    });
  }

  return Array.from(rows.values()).sort((a, b) => b.eventCount - a.eventCount || b.totalSpend - a.totalSpend);
}

/** Resolve all itineraries for a VIC with product details per event. */
export function getItinerariesForVic(vicId: string, itineraries: Itinerary[]): Itinerary[] {
  return (itineraries ?? []).filter((itinerary) => (itinerary?.primary_vic_id ?? "") === vicId);
}
