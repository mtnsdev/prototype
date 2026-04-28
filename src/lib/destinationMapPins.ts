import type { Destination } from "@/data/destinations";
import { stableItemId } from "@/lib/stableDestinationIds";
import type {
  VirtualDestinationSection,
  VirtualPartnerCardsSection,
  VirtualProductListAccordionSection,
  VirtualProductListPillsSection,
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

function isPartnerCards(s: VirtualDestinationSection): s is VirtualPartnerCardsSection {
  return s.sectionType === "partner_cards";
}

function isRestaurantSection(s: VirtualDestinationSection): s is VirtualProductListPillsSection {
  return s.sectionType === "product_list" && s.groupingStyle === "pills";
}

function isHotelSection(s: VirtualDestinationSection): s is VirtualProductListAccordionSection {
  return s.sectionType === "product_list" && s.groupingStyle === "accordion";
}

/** Pins respect the active catalog section (spec: map follows section filter). */
export function buildDestinationMapPins(
  destination: Destination,
  sections: VirtualDestinationSection[],
  activeSectionId: string | undefined,
): DestinationMapPin[] {
  const slug = destination.slug;
  const active = activeSectionId ? sections.find((s) => s.id === activeSectionId) : undefined;

  const showSection = (section: VirtualDestinationSection | undefined) => {
    if (!section) return false;
    if (!active) return true;
    return active.id === section.id;
  };

  const dmcSection = sections.find(
    (s) => isPartnerCards(s) && s.partnerCardsKind === "dmc",
  ) as VirtualPartnerCardsSection | undefined;
  const yachtSection = sections.find(
    (s) => isPartnerCards(s) && s.partnerCardsKind === "yachts",
  ) as VirtualPartnerCardsSection | undefined;
  const restaurantSection = sections.find(isRestaurantSection);
  const hotelSection = sections.find(isHotelSection);

  const out: DestinationMapPin[] = [];

  if (showSection(dmcSection) && dmcSection) {
    const sid = dmcSection.id;
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

  if (showSection(yachtSection) && yachtSection) {
    const sid = yachtSection.id;
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

  if (showSection(restaurantSection) && restaurantSection) {
    const sid = restaurantSection.id;
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

  if (showSection(hotelSection) && hotelSection) {
    const sid = hotelSection.id;
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
