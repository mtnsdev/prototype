import type { Destination } from "@/data/destinations";
import { stableItemId, stableSectionId } from "@/lib/stableDestinationIds";
import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";

export type DestinationMapPinKind = "partner" | "yacht" | "restaurant" | "hotel";

export type DestinationMapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: DestinationMapPinKind;
  href?: string;
};

/** Pins respect the active catalog section (spec: map follows section filter). */
export function buildDestinationMapPins(
  destination: Destination,
  sections: VirtualDestinationSection[],
  activeSectionId: string | undefined,
): DestinationMapPin[] {
  const slug = destination.slug;
  const active = sections.find((s) => s.id === activeSectionId);

  const allow = (sectionKey: string) => {
    if (!active) return true;
    return active.id === stableSectionId(slug, sectionKey);
  };

  const out: DestinationMapPin[] = [];

  if (allow("dmc")) {
    const sid = stableSectionId(slug, "dmc");
    destination.dmcPartners.forEach((p, i) => {
      const key = p.productId ?? `${p.name}-${i}`;
      if (p.latitude == null || p.longitude == null) return;
      out.push({
        id: stableItemId(slug, sid, key),
        lat: p.latitude,
        lng: p.longitude,
        label: p.name,
        kind: "partner",
        href: p.website,
      });
    });
  }

  if (allow("yacht")) {
    const sid = stableSectionId(slug, "yacht");
    for (const y of destination.yachtCompanies ?? []) {
      const key = y.productId ?? y.name;
      if (y.latitude == null || y.longitude == null) continue;
      out.push({
        id: stableItemId(slug, sid, key),
        lat: y.latitude,
        lng: y.longitude,
        label: y.name,
        kind: "yacht",
        href: y.url,
      });
    }
  }

  if (allow("restaurants")) {
    const sid = stableSectionId(slug, "restaurants");
    for (const [region, list] of Object.entries(destination.restaurants)) {
      list.forEach((r, i) => {
        const key = r.productId ?? `${region}-${r.name}-${i}`;
        if (r.latitude == null || r.longitude == null) return;
        out.push({
          id: stableItemId(slug, sid, key),
          lat: r.latitude,
          lng: r.longitude,
          label: r.name,
          kind: "restaurant",
          href: r.url,
        });
      });
    }
  }

  if (allow("hotels")) {
    const sid = stableSectionId(slug, "hotels");
    for (const [group, list] of Object.entries(destination.hotels)) {
      list.forEach((h, i) => {
        const key = h.productId ?? `${group}-${h.name}-${i}`;
        if (h.latitude == null || h.longitude == null) return;
        out.push({
          id: stableItemId(slug, sid, key),
          lat: h.latitude,
          lng: h.longitude,
          label: h.name,
          kind: "hotel",
          href: h.url,
        });
      });
    }
  }

  return out;
}
