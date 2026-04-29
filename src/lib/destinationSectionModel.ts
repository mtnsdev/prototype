import type {
  Destination,
  DestinationDocument,
  DestinationLegacySectionKey,
  EditorProductSlot,
  EditorTabSection,
  // DestinationTripReport, // removed — trip reports moved to v2
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

/** Mirrors production `DestinationSection.sectionType` — drives `SectionRenderer`. */
export type DestinationSectionKind =
  | "product_list"
  | "contact_list"
  | "document_list"
  | "rich_text";

/** Unified product row used by all product list sections (DMCs, restaurants, hotels, yachts). */
export type ProductListItem = {
  productId?: string;
  catalogUnavailable?: boolean;
  name: string;
  url?: string;
  /** Sub-region tags — rendered as small chips on each row. An item can have multiple. */
  tags?: string[];
  /** Short category/cuisine/type pill shown beside the name. */
  pill?: string;
  /** One-line metadata (key contact, rep firm, etc.). */
  meta?: string;
  /** Description or note. */
  note?: string;
  latitude?: number;
  longitude?: number;
  /** Original product slot for map pin disambiguation. */
  productKind: "dmc" | "restaurant" | "hotel" | "yacht";
};

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

/** Which slice of a workspace row this virtual nav section represents (for admin ghost actions). */
export type VirtualSectionWorkspaceSlice =
  | "dmc"
  | "restaurants"
  | "hotels"
  | "yachts"
  | "tourism"
  | "text"
  | "documents";

export type VirtualSectionEditorRef = { kind: "workspace"; workspaceIndex: number; slice: VirtualSectionWorkspaceSlice };

type SectionBase = {
  id: string;
  title: string;
  iconKey: string;
  sortOrder: number;
  count: number;
  /** When set, admins can rename/reorder/remove this block via workspace row index. */
  editorRef?: VirtualSectionEditorRef;
};

export type VirtualProductListSection = SectionBase & {
  sectionType: "product_list";
  items: ProductListItem[];
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

// VirtualTripReportsSection removed — moved to v2

export type VirtualDestinationSection =
  | VirtualProductListSection
  | VirtualContactListSection
  | VirtualDocumentListSection
  | VirtualRichTextSection;

function dmcToItem(p: DMCPartner): ProductListItem {
  return {
    productId: p.productId,
    catalogUnavailable: p.catalogUnavailable,
    name: p.name,
    url: p.website,
    meta: p.keyContact,
    note: p.notes,
    latitude: p.latitude,
    longitude: p.longitude,
    productKind: "dmc",
  };
}

function restaurantToItem(r: Restaurant, subRegion: string): ProductListItem {
  return {
    productId: r.productId,
    catalogUnavailable: r.catalogUnavailable,
    name: r.name,
    url: r.url,
    tags: [subRegion],
    note: r.note,
    latitude: r.latitude,
    longitude: r.longitude,
    productKind: "restaurant",
  };
}

function hotelToItem(h: Hotel, subRegion: string): ProductListItem {
  const metaParts = [h.contact, h.repFirm ? `Rep: ${h.repFirm}` : undefined].filter(Boolean);
  return {
    productId: h.productId,
    catalogUnavailable: h.catalogUnavailable,
    name: h.name,
    url: h.url,
    tags: [subRegion],
    pill: h.properties?.[0],
    meta: metaParts.length > 0 ? metaParts.join(" · ") : undefined,
    note: h.note,
    latitude: h.latitude,
    longitude: h.longitude,
    productKind: "hotel",
  };
}

function yachtToItem(y: YachtCompany): ProductListItem {
  const contact =
    y.contactName && (y.email || y.phone)
      ? `${y.contactName} · ${y.email ?? ""}${y.email && y.phone ? " · " : ""}${y.phone ?? ""}`
      : y.contact;
  return {
    productId: y.productId,
    catalogUnavailable: y.catalogUnavailable,
    name: y.name,
    url: y.url,
    meta: contact,
    latitude: y.latitude,
    longitude: y.longitude,
    productKind: "yacht",
  };
}

function flattenRestaurants(byRegion: Record<string, Restaurant[]>): ProductListItem[] {
  const items: ProductListItem[] = [];
  for (const [region, list] of Object.entries(byRegion)) {
    for (const r of list) items.push(restaurantToItem(r, region));
  }
  return items;
}

function flattenHotels(byGroup: Record<string, Hotel[]>): ProductListItem[] {
  const items: ProductListItem[] = [];
  for (const [group, list] of Object.entries(byGroup)) {
    for (const h of list) items.push(hotelToItem(h, group));
  }
  return items;
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

function sectionDocumentsForEditorBlock(d: Destination, sec: EditorTabSection): DestinationDocument[] {
  const fromVault = sec.sectionFiles?.filter((x) => x?.name?.trim());
  if (fromVault && fromVault.length > 0) return fromVault;
  return pickDocumentsByIndices(d.documents, sec.documentIndices);
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

function workspaceNavIcon(sec: EditorTabSection, lk: DestinationLegacySectionKey, d: Destination): string {
  const custom = sec.navIconKey?.trim();
  if (custom) return custom;
  return resolveAdvisorNavIcon(d, lk);
}

/**
 * Builds tab-nav sections from flat `editorWorkspace.sections` order (catalog lists + file blocks).
 * Long-form intro copy is the destination `description` field under the hero, not a workspace text slice.
 */
export function buildVirtualSectionsFromDestination(destination: Destination): VirtualDestinationSection[] {
  const d = mergeLegacyEditorTabLabels(destination);
  const ws = ensureEditorWorkspace(d);
  const slug = d.slug;
  const cat = getDestinationCatalogBundles(d);
  const out: VirtualDestinationSection[] = [];
  let sortOrder = 0;
  /** Each workspace row may own at most one catalog list type (enforced in the editor). */
  for (let wi = 0; wi < ws.sections.length; wi++) {
    const sec = ws.sections[wi]!;
    const sid = sec.id;

    if (sec.includeProducts && sec.productSlot) {
        const slot = sec.productSlot;
        const lk = slotToLegacyKey(slot);
        const title = blockTitle(d, sec, slot);
        const iconKey = workspaceNavIcon(sec, lk, d);

        let items: ProductListItem[] = [];
        let slice: VirtualSectionWorkspaceSlice = "dmc";
        let sidSuffix = "p";

        if (slot === "dmc") {
          items = cat.dmcPartners.map(dmcToItem);
          slice = "dmc";
          sidSuffix = "p-dmc";
        } else if (slot === "restaurants") {
          items = flattenRestaurants(cat.restaurants);
          slice = "restaurants";
          sidSuffix = "p-rest";
        } else if (slot === "hotels") {
          items = flattenHotels(cat.hotels);
          slice = "hotels";
          sidSuffix = "p-hot";
        } else if (slot === "yachts") {
          items = (cat.yachtCompanies ?? []).map(yachtToItem);
          slice = "yachts";
          sidSuffix = "p-yacht";
        } else if (slot === "tourism" && d.tourismRegions.length > 0) {
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
            editorRef: { kind: "workspace", workspaceIndex: wi, slice: "tourism" },
          });
        }

        if (items.length > 0) {
          const secId = stableSectionId(slug, `${sid}-${sidSuffix}`);
          out.push({
            id: secId,
            title,
            iconKey,
            sectionType: "product_list",
            sortOrder: sortOrder++,
            count: items.length,
            items,
            editorRef: { kind: "workspace", workspaceIndex: wi, slice },
          });
        }

      }

      if (sec.includeText) {
        const lk = sec.productSlot ? slotToLegacyKey(sec.productSlot) : "overview";
        const tid = stableSectionId(slug, `${sid}-t`);
        const text = sec.textBody ?? "";
        out.push({
          id: tid,
          title: sec.heading?.trim() || resolveAdvisorNavTitle(d, lk),
          iconKey: workspaceNavIcon(sec, lk, d),
          sectionType: "rich_text",
          sortOrder: sortOrder++,
          count: 1,
          text,
          editorRef: { kind: "workspace", workspaceIndex: wi, slice: "text" },
        });
      }

    if (sec.includeDocuments) {
      const docs = sectionDocumentsForEditorBlock(d, sec);
      if (docs.length > 0) {
        const lk = sec.productSlot ? slotToLegacyKey(sec.productSlot) : "documents";
        const did = stableSectionId(slug, `${sid}-d`);
        out.push({
          id: did,
          title: sec.heading?.trim() || resolveAdvisorNavTitle(d, lk),
          iconKey: workspaceNavIcon(sec, lk, d),
          sectionType: "document_list",
          sortOrder: sortOrder++,
          count: docs.length,
          documents: docs,
          editorRef: { kind: "workspace", workspaceIndex: wi, slice: "documents" },
        });
      }
    }
  }

  return out;
}

/** @deprecated Prefer {@link buildVirtualSectionsFromDestination}. */
export const buildLegacyVirtualSectionsFromDestination = buildVirtualSectionsFromDestination;

/** Virtual tab count for destination grid cards (sidebar mirrors this list). */
export function countDestinationVirtualSections(destination: Destination): number {
  return buildVirtualSectionsFromDestination(destination).length;
}

function countForVirtual(s: VirtualDestinationSection): number {
  switch (s.sectionType) {
    case "product_list":
      return s.items.length;
    case "contact_list":
      return s.contacts.length;
    case "document_list":
      return s.documents.length;
    case "rich_text":
      return 1;
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
      case "product_list":
        s.items.forEach((item, i) => {
          const key = item.productId ?? `${item.name}-${i}`;
          m.set(stableItemId(slug, s.id, key), s.id);
        });
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
      default:
        break;
    }
  }
  return m;
}
