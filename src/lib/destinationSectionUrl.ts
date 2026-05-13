import { stableSectionId } from "@/lib/stableDestinationIds";

/** Legacy `?section=` keys from older bookmarks — map to deterministic section UUIDs per destination. */
const LEGACY_QUERY_KEYS = [
  "dmc",
  "restaurants",
  "hotels",
  "yacht",
  "tourism",
  "documents",
  "overview",
  "trip-reports",
] as const;

function legacyQueryToSectionId(destinationSlug: string, raw: string): string | null {
  const v = raw.toLowerCase().trim();
  if (!LEGACY_QUERY_KEYS.includes(v as (typeof LEGACY_QUERY_KEYS)[number])) return null;
  return stableSectionId(destinationSlug, v);
}

const SECTION_HASH = /^#section-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const ITEM_HASH = /^#item-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export type DestinationHashParse = {
  sectionId: string | null;
  itemId: string | null;
};

export function parseDestinationHash(hash: string | null | undefined): DestinationHashParse {
  const h = (hash ?? "").trim();
  if (!h.startsWith("#")) return { sectionId: null, itemId: null };
  const s = SECTION_HASH.exec(h);
  if (s) return { sectionId: s[1]!, itemId: null };
  const i = ITEM_HASH.exec(h);
  if (i) return { sectionId: null, itemId: i[1]! };
  return { sectionId: null, itemId: null };
}

/**
 * Resolve active section id from `?section=`, `#section-uuid`, or legacy query aliases.
 *
 * `validSectionIds` are now row-anchor ids (one per section card). Legacy `#section-<sliceId>`
 * bookmarks resolve via `sliceToSection` (slice → owning row anchor).
 */
export function resolveDestinationSectionId(args: {
  destinationSlug: string;
  querySection: string | null;
  hash: string | null;
  validSectionIds: string[];
  /** When hash is `#item-…`, resolves parent row. */
  itemToSection?: Map<string, string>;
  /** Legacy `#section-<sliceId>` bookmarks → owning row anchor id. */
  sliceToSection?: Map<string, string>;
}): string {
  const { destinationSlug, querySection, hash, validSectionIds, itemToSection, sliceToSection } = args;
  const { sectionId: hashSection, itemId } = parseDestinationHash(hash);
  if (hashSection && validSectionIds.includes(hashSection)) return hashSection;
  if (hashSection && sliceToSection?.has(hashSection)) {
    const mapped = sliceToSection.get(hashSection)!;
    if (validSectionIds.includes(mapped)) return mapped;
  }

  const q = (querySection ?? "").trim();
  if (q && validSectionIds.includes(q)) return q;
  const legacy = legacyQueryToSectionId(destinationSlug, q);
  if (legacy && validSectionIds.includes(legacy)) return legacy;
  if (legacy && sliceToSection?.has(legacy)) {
    const mapped = sliceToSection.get(legacy)!;
    if (validSectionIds.includes(mapped)) return mapped;
  }

  if (itemId && itemToSection?.has(itemId)) {
    return itemToSection.get(itemId)!;
  }

  return validSectionIds[0] ?? "";
}

export function resolveDestinationItemIdFromHash(hash: string | null | undefined): string | null {
  return parseDestinationHash(hash).itemId;
}
