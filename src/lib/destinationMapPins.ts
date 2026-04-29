import type { Destination } from "@/data/destinations";
import { stableItemId } from "@/lib/stableDestinationIds";
import type {
  VirtualDestinationSection,
  VirtualProductListSection,
} from "@/lib/destinationSectionModel";

export type DestinationMapPinKind = "partner" | "yacht" | "restaurant" | "hotel";

export type DestinationMapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: DestinationMapPinKind;
  href?: string;
};

function isProductList(s: VirtualDestinationSection): s is VirtualProductListSection {
  return s.sectionType === "product_list";
}

const kindToPinKind: Record<string, DestinationMapPinKind> = {
  dmc: "partner",
  yacht: "yacht",
  restaurant: "restaurant",
  hotel: "hotel",
};

/** Pins respect the active catalog section (spec: map follows section filter). */
export function buildDestinationMapPins(
  destination: Destination,
  sections: VirtualDestinationSection[],
  activeSectionId: string | undefined,
): DestinationMapPin[] {
  const slug = destination.slug;
  const active = activeSectionId ? sections.find((s) => s.id === activeSectionId) : undefined;
  const out: DestinationMapPin[] = [];

  const productSections = sections.filter(isProductList);

  for (const sec of productSections) {
    if (active && active.id !== sec.id) continue;

    sec.items.forEach((item, i) => {
      if (item.latitude == null || item.longitude == null) return;
      const key = item.productId ?? `${item.name}-${i}`;
      out.push({
        id: stableItemId(slug, sec.id, key),
        lat: item.latitude,
        lng: item.longitude,
        label: item.name,
        kind: kindToPinKind[item.productKind] ?? "partner",
        href: item.url,
      });
    });
  }

  return out;
}
