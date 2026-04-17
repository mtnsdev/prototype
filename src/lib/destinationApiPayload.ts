import { getDestinationBySlug } from "@/data/destinations";
import {
  buildDestinationItemSectionMap,
  buildVirtualSectionsFromDestination,
  type VirtualDestinationSection,
} from "@/lib/destinationSectionModel";
import { stableItemId } from "@/lib/stableDestinationIds";

export function getDestinationApiPayload(slug: string) {
  const destination = getDestinationBySlug(slug);
  if (!destination) return null;
  const sections = buildVirtualSectionsFromDestination(destination);
  return { destination, sections };
}

export function findDestinationSectionPayload(slug: string, sectionId: string) {
  const base = getDestinationApiPayload(slug);
  if (!base) return null;
  const section = base.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  return { destination: base.destination, section };
}

function extractItem(slug: string, section: VirtualDestinationSection, itemId: string): unknown {
  switch (section.sectionType) {
    case "partner_cards":
      return section.partners.find(
        (p, i) => stableItemId(slug, section.id, p.productId ?? `${p.name}-${i}`) === itemId,
      );
    case "product_list":
      if (section.groupingStyle === "pills") {
        for (const [region, list] of Object.entries(section.restaurants)) {
          for (let i = 0; i < list.length; i++) {
            const r = list[i]!;
            const key = r.productId ?? `${region}-${r.name}-${i}`;
            if (stableItemId(slug, section.id, key) === itemId) return { region, restaurant: r };
          }
        }
        return undefined;
      }
      for (const [group, list] of Object.entries(section.hotels)) {
        for (let i = 0; i < list.length; i++) {
          const h = list[i]!;
          const key = h.productId ?? `${group}-${h.name}-${i}`;
          if (stableItemId(slug, section.id, key) === itemId) return { group, hotel: h };
        }
      }
      return undefined;
    case "contact_list":
      return section.contacts.find((c) => c.id === itemId);
    case "document_list":
      return section.documents.find(
        (d, i) => stableItemId(slug, section.id, d.kvDocumentId ?? `${d.name}-${i}`) === itemId,
      );
    case "trip_reports":
      return section.reports.find((r) => r.id === itemId);
    case "rich_text":
      return undefined;
    default: {
      const _e: never = section;
      return _e;
    }
  }
}


export function findDestinationItemPayload(slug: string, itemId: string) {
  const base = getDestinationApiPayload(slug);
  if (!base) return null;
  const map = buildDestinationItemSectionMap(base.destination, base.sections);
  const sectionId = map.get(itemId);
  if (!sectionId) return null;
  const section = base.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  const item = extractItem(slug, section, itemId);
  if (item == null) return null;
  return { destination: base.destination, section, item };
}
