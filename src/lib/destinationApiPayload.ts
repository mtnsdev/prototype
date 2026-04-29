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
    case "product_list":
      return section.items.find(
        (item, i) => stableItemId(slug, section.id, item.productId ?? `${item.name}-${i}`) === itemId,
      );
    case "contact_list":
      return section.contacts.find((c) => c.id === itemId);
    case "document_list":
      return section.documents.find(
        (d, i) => stableItemId(slug, section.id, d.kvDocumentId ?? `${d.name}-${i}`) === itemId,
      );
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
