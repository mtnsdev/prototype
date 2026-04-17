import type {
  Destination,
  DestinationDocument,
  DestinationLegacySectionKey,
  EditorProductSlot,
  EditorTabSection,
  DestinationTripReport,
  DMCPartner,
  Hotel,
  Restaurant,
  TourismRegion,
  YachtCompany,
} from "@/data/destinations";
import { mergeLegacyEditorTabLabels, resolveAdvisorNavIcon, resolveAdvisorNavTitle } from "@/lib/destinationEditorTabs";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { getDestinationCatalogBundles } from "@/lib/destinationUnifiedCatalog";
import { stableItemId, stableSectionId } from "@/lib/stableDestinationIds";
import { resolveDestinationSectionPresentation } from "@/lib/destinationSectionPresentation";

/** Mirrors production `DestinationSection.sectionType` — drives `SectionRenderer`. */
export type DestinationSectionKind =
  | "partner_cards"
  | "product_list"
  | "contact_list"
  | "document_list"
  | "rich_text"
  | "trip_reports";

export type DestinationContactRow = {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  links: { label: string; url: string }[];
  subRegion?: string;
};

type SectionBase = {
  id: string;
  title: string;
  iconKey: string;
  sortOrder: number;
  count: number;
};

export type VirtualPartnerCardsSection = SectionBase & {
  sectionType: "partner_cards";
  partners: DMCPartner[];
};

export type VirtualProductListPillsSection = SectionBase & {
  sectionType: "product_list";
  groupingStyle: "pills";
  restaurants: Record<string, Restaurant[]>;
};

export type VirtualProductListAccordionSection = SectionBase & {
  sectionType: "product_list";
  groupingStyle: "accordion";
  hotels: Record<string, Hotel[]>;
};

export type VirtualContactListSection = SectionBase & {
  sectionType: "contact_list";
  contacts: DestinationContactRow[];
};

export type VirtualDocumentListSection = SectionBase & {
  sectionType: "document_list";
  documents: DestinationDocument[];
};

export type VirtualRichTextSection = SectionBase & {
  sectionType: "rich_text";
  text: string;
};

export type VirtualTripReportsSection = SectionBase & {
  sectionType: "trip_reports";
  reports: DestinationTripReport[];
};

export type VirtualDestinationSection =
  | VirtualPartnerCardsSection
  | VirtualProductListPillsSection
  | VirtualProductListAccordionSection
  | VirtualContactListSection
  | VirtualDocumentListSection
  | VirtualRichTextSection
  | VirtualTripReportsSection;

function countHotels(h: Record<string, Hotel[]>) {
  return Object.values(h).reduce((n, list) => n + list.length, 0);
}

function countRestaurants(r: Record<string, Restaurant[]>) {
  return Object.values(r).reduce((n, list) => n + list.length, 0);
}

function yachtToPartner(y: YachtCompany): DMCPartner {
  return {
    productId: y.productId,
    name: y.name,
    preferred: false,
    reppedBy: y.destinations,
    website: y.url,
    keyContact:
      y.contactName && (y.email || y.phone)
        ? `${y.contactName} · ${y.email ?? ""}${y.email && y.phone ? " · " : ""}${y.phone ?? ""}`
        : y.contact,
    generalRequests: y.email,
    pricing: undefined,
    paymentProcess: undefined,
    commissionProcess: undefined,
    afterHours: y.phone,
    notes: undefined,
    feedback: undefined,
    latitude: y.latitude,
    longitude: y.longitude,
  };
}

function tourismToContacts(slug: string, sectionId: string, regions: TourismRegion[]): DestinationContactRow[] {
  return regions.map((r, i) => ({
    id: stableItemId(slug, sectionId, `tourism-${i}-${r.name}`),
    name: r.name,
    organization: "Tourism & regional",
    role: r.description,
    description: r.contact,
    links: r.links,
  }));
}

/** `undefined` = use full library; `[]` = none; otherwise map indices to rows (skips missing). */
function pickDocumentsByIndices(all: DestinationDocument[], indices: number[] | undefined): DestinationDocument[] {
  if (indices === undefined) return all;
  if (indices.length === 0) return [];
  return indices.map((i) => all[i]).filter((x): x is DestinationDocument => x != null);
}

function slotToLegacyKey(slot: EditorProductSlot): Exclude<DestinationLegacySectionKey, "overview" | "trip-reports"> {
  if (slot === "yachts") return "yacht";
  return slot;
}

/** Sidebar title for a catalog block: author heading, else slot-based label (not the parent tab label — avoids duplicate labels under a single Guide tab). */
function blockTitle(d: Destination, sec: EditorTabSection, slot: EditorProductSlot): string {
  const h = sec.heading?.trim();
  if (h) return h;
  return resolveAdvisorNavTitle(d, slotToLegacyKey(slot));
}

/**
 * Builds page sections from flat `editorWorkspace.sections` order. Each block can emit products, text, and/or
 * documents in that order.
 */
export function buildVirtualSectionsFromDestination(destination: Destination): VirtualDestinationSection[] {
  const d = mergeLegacyEditorTabLabels(destination);
  const ws = ensureEditorWorkspace(d);
  const slug = d.slug;
  const cat = getDestinationCatalogBundles(d);
  const out: VirtualDestinationSection[] = [];
  let sortOrder = 0;
  /** One full-catalog block per slot — multiple editor blocks with the same slot would otherwise duplicate the same list in nav. */
  const fullCatalogSlotEmitted = new Set<EditorProductSlot>();

  for (const sec of ws.sections) {
    const sid = sec.id;

    if (sec.includeProducts && sec.productSlot) {
        const slot = sec.productSlot;
        const lk = slotToLegacyKey(slot);
        const title = blockTitle(d, sec, slot);
        const iconKey = resolveAdvisorNavIcon(d, lk);

        if (slot === "dmc" && cat.dmcPartners.length > 0) {
          if (!fullCatalogSlotEmitted.has("dmc")) {
            fullCatalogSlotEmitted.add("dmc");
            out.push({
              id: stableSectionId(slug, `${sid}-p-dmc`),
              title,
              iconKey,
              sectionType: "partner_cards",
              sortOrder: sortOrder++,
              count: cat.dmcPartners.length,
              partners: cat.dmcPartners,
            });
          }
        }

        if (slot === "restaurants") {
          const restaurantTotal = countRestaurants(cat.restaurants);
          if (restaurantTotal > 0 && !fullCatalogSlotEmitted.has("restaurants")) {
            fullCatalogSlotEmitted.add("restaurants");
            out.push({
              id: stableSectionId(slug, `${sid}-p-rest`),
              title,
              iconKey,
              sectionType: "product_list",
              groupingStyle: "pills",
              sortOrder: sortOrder++,
              count: restaurantTotal,
              restaurants: cat.restaurants,
            });
          }
        }

        if (slot === "hotels") {
          const hotelTotal = countHotels(cat.hotels);
          if (hotelTotal > 0 && !fullCatalogSlotEmitted.has("hotels")) {
            fullCatalogSlotEmitted.add("hotels");
            out.push({
              id: stableSectionId(slug, `${sid}-p-hot`),
              title,
              iconKey,
              sectionType: "product_list",
              groupingStyle: "accordion",
              sortOrder: sortOrder++,
              count: hotelTotal,
              hotels: cat.hotels,
            });
          }
        }

        if (slot === "yachts") {
          const yachts = cat.yachtCompanies;
          if (yachts.length > 0 && !fullCatalogSlotEmitted.has("yachts")) {
            fullCatalogSlotEmitted.add("yachts");
            out.push({
              id: stableSectionId(slug, `${sid}-p-yacht`),
              title,
              iconKey,
              sectionType: "partner_cards",
              sortOrder: sortOrder++,
              count: yachts.length,
              partners: yachts.map(yachtToPartner),
            });
          }
        }

        if (slot === "tourism" && d.tourismRegions.length > 0) {
          if (!fullCatalogSlotEmitted.has("tourism")) {
            fullCatalogSlotEmitted.add("tourism");
            const sectionId = stableSectionId(slug, `${sid}-p-tour`);
            const contacts = tourismToContacts(slug, sectionId, d.tourismRegions);
            out.push({
              id: sectionId,
              title,
              iconKey,
              sectionType: "contact_list",
              sortOrder: sortOrder++,
              count: contacts.length,
              contacts,
            });
          }
        }

        if (slot === "documents" && d.documents.length > 0) {
          if (!fullCatalogSlotEmitted.has("documents")) {
            fullCatalogSlotEmitted.add("documents");
            out.push({
              id: stableSectionId(slug, `${sid}-p-docs`),
              title,
              iconKey,
              sectionType: "document_list",
              sortOrder: sortOrder++,
              count: d.documents.length,
              documents: d.documents,
            });
          }
        }
      }

      if (sec.includeText) {
        const text = sec.textBody?.trim() ?? "";
        if (text) {
          const lk = sec.productSlot ? slotToLegacyKey(sec.productSlot) : "overview";
          out.push({
            id: stableSectionId(slug, `${sid}-t`),
            title: sec.heading?.trim() || resolveAdvisorNavTitle(d, lk),
            iconKey: resolveAdvisorNavIcon(d, lk),
            sectionType: "rich_text",
            sortOrder: sortOrder++,
            count: 1,
            text,
          });
        }
      }

    if (sec.includeDocuments) {
      const docs = pickDocumentsByIndices(d.documents, sec.documentIndices);
      if (docs.length > 0) {
        const lk = sec.productSlot ? slotToLegacyKey(sec.productSlot) : "documents";
        out.push({
          id: stableSectionId(slug, `${sid}-d`),
          title: sec.heading?.trim() || resolveAdvisorNavTitle(d, lk),
          iconKey: resolveAdvisorNavIcon(d, lk),
          sectionType: "document_list",
          sortOrder: sortOrder++,
          count: docs.length,
          documents: docs,
        });
      }
    }
  }

  const trips = d.tripReports ?? [];
  if (trips.length > 0) {
    const trPres = resolveDestinationSectionPresentation("trip-reports");
    out.push({
      id: stableSectionId(slug, "trip-reports"),
      title: trPres.title,
      iconKey: trPres.iconKey,
      sectionType: "trip_reports",
      sortOrder: sortOrder++,
      count: trips.length,
      reports: trips,
    });
  }

  if (out.length === 0 && d.description.trim() !== "") {
    const ovPres = resolveDestinationSectionPresentation("overview");
    out.push({
      id: stableSectionId(slug, "overview"),
      title: ovPres.title,
      iconKey: ovPres.iconKey,
      sectionType: "rich_text",
      sortOrder: 0,
      count: 1,
      text: d.description,
    });
  }

  return out;
}

/** @deprecated Prefer {@link buildVirtualSectionsFromDestination}. */
export const buildLegacyVirtualSectionsFromDestination = buildVirtualSectionsFromDestination;

function countForVirtual(s: VirtualDestinationSection): number {
  switch (s.sectionType) {
    case "partner_cards":
      return s.partners.length;
    case "product_list":
      return s.groupingStyle === "pills"
        ? countRestaurants(s.restaurants)
        : countHotels(s.hotels);
    case "contact_list":
      return s.contacts.length;
    case "document_list":
      return s.documents.length;
    case "rich_text":
      return 1;
    case "trip_reports":
      return s.reports.length;
    default: {
      const _e: never = s;
      return _e;
    }
  }
}

export function countTotalSectionItems(sections: VirtualDestinationSection[]): number {
  return sections.reduce((sum, s) => sum + s.count, 0);
}

/** Map item fragment id → parent section id (for `#item-…` deep links). */
export function buildDestinationItemSectionMap(
  destination: Destination,
  sections: VirtualDestinationSection[],
): Map<string, string> {
  const slug = destination.slug;
  const m = new Map<string, string>();

  for (const s of sections) {
    switch (s.sectionType) {
      case "partner_cards":
        s.partners.forEach((p, i) => {
          const key = p.productId ?? `${p.name}-${i}`;
          m.set(stableItemId(slug, s.id, key), s.id);
        });
        break;
      case "product_list":
        if (s.groupingStyle === "pills") {
          for (const [region, list] of Object.entries(s.restaurants)) {
            list.forEach((r, i) => {
              const key = r.productId ?? `${region}-${r.name}-${i}`;
              m.set(stableItemId(slug, s.id, key), s.id);
            });
          }
        } else {
          for (const [group, list] of Object.entries(s.hotels)) {
            list.forEach((h, i) => {
              const key = h.productId ?? `${group}-${h.name}-${i}`;
              m.set(stableItemId(slug, s.id, key), s.id);
            });
          }
        }
        break;
      case "contact_list":
        s.contacts.forEach((c) => m.set(c.id, s.id));
        break;
      case "document_list":
        s.documents.forEach((d, i) => {
          const key = d.kvDocumentId ?? `${d.name}-${i}`;
          m.set(stableItemId(slug, s.id, key), s.id);
        });
        break;
      case "trip_reports":
        s.reports.forEach((r) => m.set(r.id, s.id));
        break;
      default:
        break;
    }
  }
  return m;
}
