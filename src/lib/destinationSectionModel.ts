import type {
  Destination,
  DestinationDocument,
  DestinationLegacySectionKey,
  EditorProductSlot,
  EditorSliceKind,
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

/** Default slice order when an `EditorTabSection` has no explicit `sliceOrder` — preserves legacy display order. */
const DEFAULT_SLICE_ORDER: readonly EditorSliceKind[] = ["products", "text", "documents"];

/** Resolve the in-card slice order for a row, filtered to slices that are actually enabled. */
export function getRowSliceOrder(row: EditorTabSection): EditorSliceKind[] {
  const enabled = (k: EditorSliceKind) =>
    (k === "products" && row.includeProducts) ||
    (k === "text" && row.includeText) ||
    (k === "documents" && row.includeDocuments);

  const seen = new Set<EditorSliceKind>();
  const result: EditorSliceKind[] = [];
  const explicit = row.sliceOrder ?? [];
  for (const k of explicit) {
    if (enabled(k) && !seen.has(k)) {
      result.push(k);
      seen.add(k);
    }
  }
  for (const k of DEFAULT_SLICE_ORDER) {
    if (enabled(k) && !seen.has(k)) {
      result.push(k);
      seen.add(k);
    }
  }
  return result;
}

/** Stable DOM/URL anchor id for a section row card (one card may host multiple slices). */
export function rowAnchorId(destinationSlug: string, row: EditorTabSection): string {
  return stableSectionId(destinationSlug, `row-${row.id}`);
}

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
  /** Hero/thumbnail image URL — preferred over favicon extraction when set. */
  image?: string;
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
    image: p.image,
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
    image: r.image,
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
    image: h.image,
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
    image: y.image,
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
  /** Each workspace row emits its enabled slices in `getRowSliceOrder` order so the page reflects author intent. */
  for (let wi = 0; wi < ws.sections.length; wi++) {
    const sec = ws.sections[wi]!;
    const sid = sec.id;
    const order = getRowSliceOrder(sec);

    for (const sliceKind of order) {
      if (sliceKind === "products" && sec.includeProducts && sec.productSlot) {
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
        } else if (slot === "tourism") {
          // Tourism & contacts are handled as notes — skip generating a contact_list section.
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
      } else if (sliceKind === "text" && sec.includeText) {
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
      } else if (sliceKind === "documents" && sec.includeDocuments) {
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
  }

  return out;
}

/** @deprecated Prefer {@link buildVirtualSectionsFromDestination}. */
export const buildLegacyVirtualSectionsFromDestination = buildVirtualSectionsFromDestination;

/** One sidebar nav entry per workspace row (groups together all its slices into a single card). */
export type DestinationRowAnchor = {
  /** Stable URL/DOM id for this row card (`section-row-<anchorId>`). */
  anchorId: string;
  /** Underlying workspace row index (for editor mutations). */
  workspaceIndex: number;
  /** Display label — author heading, else first slice's auto-title. */
  label: string;
  /** Lucide icon key from the row's first slice. */
  iconKey: string;
  /** Total item count across all enabled slices in the row. */
  count: number;
  /** Slice ids emitted by `buildVirtualSectionsFromDestination` for this row, in order. */
  sliceIds: string[];
};

/**
 * Builds one anchor per workspace row by re-using the virtual section builder and grouping by `editorRef.workspaceIndex`.
 * Empty rows (no enabled/visible slices) get a placeholder anchor so admins can still see them in the nav.
 */
export function buildDestinationRowAnchors(destination: Destination): DestinationRowAnchor[] {
  const d = mergeLegacyEditorTabLabels(destination);
  const ws = ensureEditorWorkspace(d);
  const sections = buildVirtualSectionsFromDestination(d);
  const slug = d.slug;

  const byRow = new Map<number, VirtualDestinationSection[]>();
  for (const s of sections) {
    if (s.editorRef?.kind !== "workspace") continue;
    const wi = s.editorRef.workspaceIndex;
    const list = byRow.get(wi) ?? [];
    list.push(s);
    byRow.set(wi, list);
  }

  const out: DestinationRowAnchor[] = [];
  for (let wi = 0; wi < ws.sections.length; wi++) {
    const row = ws.sections[wi]!;
    const slices = byRow.get(wi) ?? [];
    const first = slices[0];
    const anchor = rowAnchorId(slug, row);
    const heading = row.heading?.trim();
    const label = heading || first?.title || "Untitled section";
    const iconKey = first?.iconKey || "Folder";
    const count = slices.reduce((n, s) => n + s.count, 0);
    out.push({
      anchorId: anchor,
      workspaceIndex: wi,
      label,
      iconKey,
      count,
      sliceIds: slices.map((s) => s.id),
    });
  }
  return out;
}

/** Map every emitted slice id to its parent row anchor id (used for legacy `#section-<sliceId>` deep links). */
export function buildSliceToRowAnchorMap(destination: Destination): Map<string, string> {
  const anchors = buildDestinationRowAnchors(destination);
  const m = new Map<string, string>();
  for (const a of anchors) {
    for (const sid of a.sliceIds) m.set(sid, a.anchorId);
  }
  return m;
}

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
