/**
 * Static destination guide data for the VIC prototype.
 * Replace with API / Supabase fetch later — keep `getDestinationBySlug` / `listDestinationSummaries` as the boundary.
 *
 * DMCs, yachts, restaurants, and hotels are all catalog products — see `flattenDestinationCatalogProducts` in
 * `@/lib/destinationUnifiedCatalog`. Bundled fields on `Destination` remain the persistence shape for the prototype.
 */

import { countDestinationCatalogProductRows } from "@/lib/destinationUnifiedCatalog";
import { stableDestinationUuid } from "@/lib/stableDestinationIds";
import { DESTINATION_HERO_IMAGE_URLS } from "./destinationHeroImages.generated";

export type DestinationDocument = {
  name: string;
  type: "pdf" | "docx" | "xlsx" | "pptx";
  /** Knowledge Vault document id — opens `url` from the vault catalog when set. */
  kvDocumentId?: string;
};

export type DMCPartner = {
  /** Catalog product id when this DMC exists in the Product Directory (single source of truth for ops fields). */
  productId?: string;
  /** Set when `productId` is set but the product no longer exists in the tenant catalog. */
  catalogUnavailable?: boolean;
  name: string;
  preferred: boolean;
  reppedBy?: string;
  website?: string;
  /** Hero/thumbnail image URL. */
  image?: string;
  keyContact?: string;
  generalRequests?: string;
  /** Handle or URL — surfaced on partner cards when present. */
  socialMedia?: string;
  pricing?: string;
  paymentProcess?: string;
  commissionProcess?: string;
  afterHours?: string;
  /** Responsible tourism partner — green badge on the card shell. */
  responsibleTourism?: boolean;
  notes?: string;
  /** Admin-only curation line on partner cards. */
  curationNote?: string;
  specialAmenity?: string;
  destinationsServed?: string;
  featuredRegions?: string;
  specializations?: string[];
  languages?: string[];
  proposalTurnaround?: string;
  minimumBooking?: string;
  serviceOptions?: string[];
  itineraryPlatforms?: string[];
  /** Map coverage (prototype). */
  latitude?: number;
  longitude?: number;
};

export type Restaurant = {
  /** Catalog Dining product id — name/url render from catalog in production. */
  productId?: string;
  catalogUnavailable?: boolean;
  name: string;
  url?: string;
  /** Hero/thumbnail image URL. */
  image?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
};

export type Hotel = {
  /** Catalog Accommodation product id. */
  productId?: string;
  catalogUnavailable?: boolean;
  name: string;
  contact?: string;
  /** Rep firm line from catalog (prototype: plain string). */
  repFirm?: string;
  url?: string;
  /** Hero/thumbnail image URL. */
  image?: string;
  /** Handle or URL — partner cards when expanded. */
  socialMedia?: string;
  note?: string;
  properties?: string[];
  latitude?: number;
  longitude?: number;
};

export type YachtCompany = {
  productId?: string;
  catalogUnavailable?: boolean;
  name: string;
  /** Fallback single line (prototype). Prefer structured fields when set. */
  contact: string;
  url: string;
  /** Hero/thumbnail image URL. */
  image?: string;
  destinations: string;
  contactName?: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

export type TourismRegion = {
  name: string;
  description?: string;
  links: { label: string; url: string }[];
  /** Tourism board or regional office contact line. */
  contact?: string;
  /** When set, counted toward map coverage gate alongside catalog products. */
  latitude?: number;
  longitude?: number;
};

export type DestinationTripReport = {
  id: string;
  advisorId: string;
  advisorName: string;
  travelDates: { start: string; end: string };
  subRegionsVisited: string[];
  productReferences: { productId: string; label: string }[];
  content: string;
  helpfulCount: number;
  createdAt: string;
  latitude?: number;
  longitude?: number;
};

/** Keys for legacy bundled destinations → virtual sections (until first-class `DestinationSection` rows exist). */
export const DESTINATION_LEGACY_SECTION_KEYS = [
  "dmc",
  "restaurants",
  "hotels",
  "yacht",
  "tourism",
  "documents",
  "trip-reports",
  "overview",
] as const;

export type DestinationLegacySectionKey = (typeof DESTINATION_LEGACY_SECTION_KEYS)[number];

/** Left-nav tabs in the destination editor (content tabs — same buckets as curated lists). */
export const DESTINATION_EDITOR_TAB_IDS = [
  "overview",
  "dmc",
  "restaurants",
  "hotels",
  "yachts",
  "tourism",
  "documents",
] as const;

export type DestinationEditorTabId = (typeof DESTINATION_EDITOR_TAB_IDS)[number];

/** How each editor tab is used — drives the matching block on the public guide. */
export type EditorTabContentMode = "products" | "text" | "documents";

export type DestinationEditorTabSettings = {
  label?: string;
  contentMode?: EditorTabContentMode;
  textBody?: string;
  documentIndices?: number[];
};

/** Which catalog a products block edits (prototype: one pool per slot on `Destination`). */
export type EditorProductSlot = "dmc" | "restaurants" | "hotels" | "yachts" | "tourism" | "documents";

/** A composable content block inside a section row. Order is controlled by {@link EditorTabSection.sliceOrder}. */
export type EditorSliceKind = "products" | "text" | "documents";

/**
 * One guide section — authors compose text, catalog rows, and/or file attachments inside the same row;
 * flags turn on when content exists. Render order is controlled by {@link sliceOrder} (default: products → text → documents).
 */
export type EditorTabSection = {
  id: string;
  /** Optional subheading on the public guide for this block */
  heading?: string;
  includeProducts: boolean;
  includeText: boolean;
  includeDocuments: boolean;
  productSlot?: EditorProductSlot;
  textBody?: string;
  documentIndices?: number[];
  /** Files linked from Knowledge Vault for this block (preferred over {@link documentIndices}). */
  sectionFiles?: DestinationDocument[];
  /** Optional Lucide icon name for sidebar nav — overrides slot default when set. */
  navIconKey?: string;
  /** Author-controlled order in which the enabled slices stack inside this section card. */
  sliceOrder?: EditorSliceKind[];
  /**
   * When true, the section is treated as "draft / coming soon" on the published advisor view:
   * still rendered, but with a "Coming soon" badge and dimmed styling. Admins see the same
   * card with full editing affordances plus a "Hidden" badge.
   */
  hidden?: boolean;
};

/** @deprecated Legacy chapter-tab row; migrated to {@link EditorWorkspace.sections}. */
export type EditorWorkspaceTab = {
  id: string;
  label: string;
  sections: EditorTabSection[];
};

/** Flat ordered guide — one list of blocks, no nested chapter tabs. */
export type EditorWorkspace = {
  sections: EditorTabSection[];
  /** Optional advisor-facing label for the guide (sidebar). */
  guideLabel?: string;
};

/** Stored JSON may still use legacy `{ tabs }` until {@link ensureEditorWorkspace} runs. */
export type EditorWorkspacePersisted = EditorWorkspace | { tabs: EditorWorkspaceTab[] };

/**
 * Free-form destination tag — Notion-style pill. Each destination owns its own
 * property vocabulary (e.g. "Athens", "Party islands", "Quiet islands").
 * `productIds` lists which products in this destination carry the pill.
 */
export type DestinationProperty = {
  id: string;
  label: string;
  productIds: string[];
};

export type Destination = {
  slug: string;
  name: string;
  tagline: string;
  /** Cover image — HTTPS URL (e.g. CDN or Unsplash). Empty hides the photo band. */
  heroImage: string;
  description: string;
  subRegions: string[];
  dmcPartners: DMCPartner[];
  restaurants: Record<string, Restaurant[]>;
  hotels: Record<string, Hotel[]>;
  yachtCompanies?: YachtCompany[];
  tourismRegions: TourismRegion[];
  documents: DestinationDocument[];
  tripReports?: DestinationTripReport[];
  /** Mock map framing when map is enabled. */
  mapCenter?: { lat: number; lng: number; zoom?: number };
  /**
   * Destination-scoped pills (e.g. sub-region groupings, themes). Each pill is
   * a filter chip in the unified product list; admins manage them inline from
   * the hero.
   */
  properties?: DestinationProperty[];
  /**
   * Editor layout: ordered guide sections (products / text / documents per block).
   * @see `ensureEditorWorkspace` — migrates legacy `tabs[]` and `editorTabs` when absent.
   */
  editorWorkspace?: EditorWorkspacePersisted;
  /**
   * @deprecated Prefer `editorWorkspace`. Merged on load into workspace.
   */
  editorTabs?: Partial<Record<DestinationEditorTabId, DestinationEditorTabSettings>>;
  /**
   * When set, only advisors whose `user.agency_id` is listed can view this guide.
   * Omit or leave empty for agency-wide visibility (prototype client filter + detail gate).
   */
  visibleForAgencyIds?: string[];
};

export type DestinationSummary = {
  slug: string;
  name: string;
  tagline: string;
  heroImage: string;
  description: string;
  /** Tab count from virtual sections (sidebar); set when enriching from full destination. */
  sectionCount?: number;
  /** Sum of items across all configured sections (DMC + restaurants + hotels + …). */
  totalItemCount: number;
  dmcCount: number;
  hotelCount: number;
  restaurantCount: number;
  documentCount: number;
  tripReportCount: number;
  /** Mock label for portal list freshness (e.g. "Updated 2w ago"). */
  activityHint?: string;
};

function countHotels(h: Record<string, Hotel[]>) {
  return Object.values(h).reduce((n, list) => n + list.length, 0);
}

function countRestaurants(r: Record<string, Restaurant[]>) {
  return Object.values(r).reduce((n, list) => n + list.length, 0);
}

/**
 * Cover image URL from `destinationHeroImages.generated.ts` (spreadsheet overrides merged with
 * `destinationHeroCurated.json` at import time). Picsum only if a slug is missing from the bundle.
 */
function heroImageUrlForDestination(slug: string): string {
  const resolved = DESTINATION_HERO_IMAGE_URLS[slug]?.trim();
  if (resolved) return resolved;
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/1600/720`;
}

export function stubHeroImageForSlug(slug: string): string {
  return heroImageUrlForDestination(slug);
}

function stubDestination(slug: string, name: string, tagline: string, heroImage: string): Destination {
  return {
    slug,
    name,
    tagline,
    heroImage,
    description:
      "Destination guide content is being curated for this market. Check back as we expand partner coverage.",
    subRegions: [],
    dmcPartners: [],
    restaurants: {},
    hotels: {},
    tourismRegions: [],
    documents: [],
  };
}

/** Minimal valid destination for new guides (localStorage-backed custom slugs). */
export function createStubDestination(slug: string, name: string, tagline: string): Destination {
  return stubDestination(slug, name, tagline, stubHeroImageForSlug(slug));
}

/** Mirrors virtual section totals — catalog rows counted via unified catalog list. */
function totalDestinationItemCount(d: Destination): number {
  let n =
    countDestinationCatalogProductRows(d) + d.tourismRegions.length + d.documents.length;
  if (n === 0 && d.description.trim() !== "") return 1;
  return n;
}

export function destinationToSummary(d: Destination): DestinationSummary {
  return {
    slug: d.slug,
    name: d.name,
    tagline: d.tagline,
    heroImage: d.heroImage,
    description: d.description,
    totalItemCount: totalDestinationItemCount(d),
    dmcCount: d.dmcPartners.length,
    hotelCount: countHotels(d.hotels),
    restaurantCount: countRestaurants(d.restaurants),
    documentCount: d.documents.length,
    tripReportCount: d.tripReports?.length ?? 0,
    activityHint: d.slug === "greece" ? "Fresh intel · 3w ago" : undefined,
  };
}

/** Team/agency gate for destination guides (mirrors Product Directory agency scope in prototype). */
export function destinationIsVisibleForViewer(d: Destination, agencyId: string | null | undefined): boolean {
  const ids = d.visibleForAgencyIds;
  if (ids == null || ids.length === 0) return true;
  if (agencyId == null || agencyId === "") return false;
  return ids.includes(agencyId);
}

/* ——— Full Greece dataset — sourced from the advisor-portal Greece destination page ——— */

const GREECE: Destination = {
  slug: "greece",
  name: "Greece",
  tagline: "Islands, history, and seamless land programs across the Aegean.",
  heroImage: heroImageUrlForDestination("greece"),
  description:
    "Greece — from Athens and the Peloponnese to Crete and the Cyclades. The following partner, restaurant, hotel and yacht intel is sourced directly from the agency's destination page.",
  subRegions: [
    "Athens",
    "Athens Riviera",
    "Piraeus",
    "Delphi",
    "Peloponnese",
    "Thessaloniki",
    "Crete",
    "Cyclades — Mykonos",
    "Cyclades — Santorini",
    "Cyclades — Paros",
    "Cyclades — Milos",
    "Cyclades — Naxos",
    "Ionian — Corfu",
    "Ionian — Zakynthos",
    "Rhodes",
    "Northwest Greece (Epirus / Zagori)",
  ],
  dmcPartners: [
    {
      productId: "cat-dmc-gr-001",
      name: "Original Senses",
      preferred: true,
      responsibleTourism: true,
      destinationsServed: "Greece (mainland + islands)",
      featuredRegions: "Athens, Cyclades, Crete, Peloponnese",
      specializations: ["Itemized pricing", "Concierge services", "Cultural experiences"],
      languages: ["English", "Greek"],
      latitude: 37.9838,
      longitude: 23.7275,
      socialMedia: "Instagram @originalsenses",
      reppedBy: "JMAK · jon@jmak.com",
      website: "https://www.originalsenses.gr/",
      image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop",
      keyContact: "Maria Konstantopoulou · mariak@originalsenses.com",
      generalRequests:
        "Maria – mariak@originalsenses.com, Konstantina – konstantinak@originalsenses.com, Christina – christinan@originalsenses.com",
      pricing: "Itemized breakdowns; pricing transparency.",
      paymentProcess:
        "No credit-card fees. Basic concierge (restaurant + beach-club reservations) free. Enhanced concierge billed on request based on length of stay.",
      commissionProcess:
        "Required by law to receive commission invoices. Group commission payments to IATAs on the 15th and 30th of each month. Accounting sends proof of payment + analysis (project number / client / dates / advisor); advisors notified by email when payment is processed.",
      afterHours:
        "Office 10:00–18:00 EET; team monitors email beyond hours. 24/7 emergency line for clients on the ground.",
      notes: "Travel Designer point of contact for last-minute changes while clients are in market.",
    },
    {
      productId: "cat-dmc-gr-002",
      name: "Eclectic Greece",
      preferred: true,
      destinationsServed: "Greece, Turkey, Egypt",
      latitude: 37.9755,
      longitude: 23.7348,
      reppedBy: "Dominique Debay · dominique@dominiquedebay.com",
      website: "https://eclecticgreece.com/",
      image: "https://images.unsplash.com/photo-1503152394-c571994fd383?w=600&h=400&fit=crop",
      keyContact: "Christos Kyvernitis · c.kyvernitis@kyvernitis.gr",
      generalRequests: "Eva Saringala (sales director) · e.saringala@kyvernitis.gr",
      pricing: "Itemization.",
      commissionProcess: "Commission can be sent via check.",
      afterHours: "24/7 emergency phone +30 6991636363.",
      notes: "Also serving Turkey & Egypt. Recent feedback (8/7/25): some tour / experience descriptions did not match — verify itineraries.",
    },
    {
      productId: "cat-dmc-gr-003",
      name: "Myths & Muses",
      preferred: true,
      destinationsServed: "Greece",
      featuredRegions: "Mainland & islands",
      languages: ["English", "Greek"],
      latitude: 37.9838,
      longitude: 23.7275,
      reppedBy: "Tina Lyra · TL Portfolio",
      website: "https://mythsandmuses.com/",
      image: "https://images.unsplash.com/photo-1571406761758-9a3eed5338ef?w=600&h=400&fit=crop",
      keyContact:
        "Christina Papavlasopoulos & Nektaria Panagiotari (Co-Founders) · christina@mythsandmuses.com",
      generalRequests: "info@mythsandmuses.com",
      pricing: "Itemization possible; can pay 15% commission or more depending on program.",
      commissionProcess: "Paid 2 weeks after clients return from trip.",
      notes:
        "Smaller boutique DMC, founder based in Boston. 4★ / 5★ authentic, unique experiences with great value. Runs an ambassador program for advisors providing business and referrals.",
    },
    {
      productId: "cat-dmc-gr-004",
      name: "Greece a la Carte",
      preferred: false,
      destinationsServed: "Greece",
      latitude: 37.9838,
      longitude: 23.7275,
      socialMedia: "Facebook @Greekdestinationconsultant",
      reppedBy: "Virtuoso",
      website: "https://www.greecealacarte.gr/",
      image: "https://images.unsplash.com/photo-1601581875309-fafbf2a0a476?w=600&h=400&fit=crop",
      keyContact: "Kasi Turpin (Owner) · kasiturpin@greecealacarte.gr",
      generalRequests: "info@greecealacarte.gr · galacarte@hol.gr",
      pricing: "Itemization — please request 12% commission at the time of initial request.",
      commissionProcess: "Commission can be sent via check.",
      afterHours: "24/7 emergency phone +30 6991636363.",
    },
    {
      productId: "cat-dmc-gr-005",
      name: "Curated Greece",
      preferred: false,
      destinationsServed: "Greece (mainland + islands)",
      latitude: 37.9838,
      longitude: 23.7275,
      reppedBy: "Rebecca Recommends",
      image: "https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=600&h=400&fit=crop",
      keyContact: "Seetha Ramanathan · seetha@curatedgreece.com",
      generalRequests: "info@curatedgreece.com · Vasilis Sarmantas · vasilis@curatedgreece.com",
      pricing: "Entry 5★ from ~$758 pp/day; June from ~$800 pp/day with a few private experiences.",
      notes:
        "Experts in all of Greece. Can do yacht charters by the day to avoid ferries between Paros, Athens, Santorini — also charters shorter than a week.",
    },
    {
      productId: "cat-dmc-gr-006",
      name: "OAG Greece (Our A Game)",
      preferred: false,
      destinationsServed: "Greece",
      latitude: 37.9838,
      longitude: 23.7275,
      website: "https://www.oag-greece.com/",
      image: "https://images.unsplash.com/photo-1602940659805-770d1b3b9911?w=600&h=400&fit=crop",
      notes:
        "Very boutique DMC with one-of-a-kind activities. Founder Alex also arranges yachts; Elizabeth works with him often.",
    },
  ],
  restaurants: {
    Athens: [
      { productId: "cat-rest-gr-001", name: "Balthazar", note: "Stylish all-day spot in Kolonaki.", url: "https://balthazar.gr/en/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.9777, longitude: 23.7444 },
      { productId: "cat-rest-gr-002", name: "Cookoovaya", note: "Modern Greek cooking, six chefs.", url: "https://cookoovaya.gr/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: 37.969, longitude: 23.7458 },
      { productId: "cat-rest-gr-003", name: "Dionisos Acropolis", note: "Acropolis-view classic.", url: "https://dionysoszonars.gr/", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: 37.9701, longitude: 23.7236 },
      { productId: "cat-rest-gr-004", name: "Ella", note: "Greek cooking class & restaurant.", url: "http://www.ellagreekcooking.gr/en/", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: 37.9784, longitude: 23.7341 },
      { productId: "cat-rest-gr-005", name: "Ergon House", note: "All-day Greek food hall + hotel.", url: "https://house.ergonfoods.com/", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: 37.9784, longitude: 23.7341 },
      { productId: "cat-rest-gr-006", name: "GB Roof Garden", note: "Acropolis roof at Grande Bretagne.", url: "https://www.gbroofgarden.gr/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.9759, longitude: 23.7349 },
      { productId: "cat-rest-gr-007", name: "Kuzina", note: "Plaka rooftop, modern Greek.", url: "https://www.kuzina.gr/en/home", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: 37.9747, longitude: 23.726 },
      { productId: "cat-rest-gr-008", name: "Papadakis", note: "Aegean seafood in Kolonaki.", url: "https://papadakisrestaurant.com/", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", latitude: 37.9787, longitude: 23.7439 },
      { productId: "cat-rest-gr-009", name: "Strofi", note: "Acropolis-view rooftop classic.", url: "https://www.strofi.gr/en/", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop", latitude: 37.9696, longitude: 23.7222 },
      { productId: "cat-rest-gr-010", name: "Tzitzikas & Mermigas", note: "Mezze institution downtown.", url: "https://www.tzitzikasmermigas.gr/en/", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", latitude: 37.978, longitude: 23.7297 },
      { productId: "cat-rest-gr-011", name: "Vezene", note: "Wood-fired steak and seafood.", url: "https://www.vezene.gr", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.985, longitude: 23.755 },
      { productId: "cat-rest-gr-012", name: "Malconi's", note: "Italian-leaning Kolonaki staple.", url: "https://www.malconis.gr/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: 37.9786, longitude: 23.7456 },
      { productId: "cat-rest-gr-013", name: "Zurbaran", note: "Spanish & Mediterranean wine bar.", url: "https://zurbaranathens.gr", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: 37.9777, longitude: 23.7396 },
      { productId: "cat-rest-gr-014", name: "All Senses Gastronomy", note: "Greek tasting menu venue.", url: "https://www.foodhubs.eu/ASG.html", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: 37.978, longitude: 23.733 },
    ],
    Piraeus: [
      { productId: "cat-rest-gr-020", name: "Varoulko Seaside", note: "Michelin-starred seafood by Lefteris Lazarou.", url: "https://www.varoulko.gr/", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: 37.94, longitude: 23.646 },
      { productId: "cat-rest-gr-021", name: "Margaro", note: "Cash-only seafood institution by the naval academy.", url: "https://www.margaro-restaurant.com/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.943, longitude: 23.652 },
    ],
    Vouliagmeni: [
      { productId: "cat-rest-gr-022", name: "Ithaki", note: "Athens Riviera seafront seafood.", url: "https://ithakirestaurantbar.gr", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: 37.815, longitude: 23.78 },
      { productId: "cat-rest-gr-023", name: "Labros", note: "Classic seafood meze on the water.", url: "https://labrosrestaurant.gr/en/", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", latitude: 37.821, longitude: 23.781 },
      { productId: "cat-rest-gr-024", name: "Panorama", note: "Sweeping Saronic Gulf views.", url: "http://www.panoramarestaurant.gr", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop", latitude: 37.815, longitude: 23.78 },
      { productId: "cat-rest-gr-025", name: "Pelagos", note: "Refined Greek seafood by the marina.", url: "https://www.pelagosathens.com", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", latitude: 37.815, longitude: 23.78 },
      { productId: "cat-rest-gr-026", name: "Taverna 37 — Four Seasons", note: "Beachfront taverna at the Four Seasons Astir Palace.", url: "https://www.fourseasons.com/athens/dining/restaurants/taverna-37/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.818, longitude: 23.785 },
    ],
    Delphi: [
      { productId: "cat-rest-gr-027", name: "To Patriko Mas", note: "Mountain taverna near Delphi.", url: "https://www.facebook.com/to.patriko.mas.restaurant.delphi.greece/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: 38.4824, longitude: 22.501 },
    ],
    Crete: [
      { productId: "cat-rest-gr-040", name: "Ferryman Taverna (Elounda)", note: "Waterfront taverna in Elounda.", url: "https://www.facebook.com/FerrymanTaverna/", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: 35.262, longitude: 25.728 },
      { productId: "cat-rest-gr-041", name: "Lithos Taverna (Chania Town)", note: "Authentic Cretan in Chania Old Town.", url: "https://tavernalithos.gr/", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: 35.515, longitude: 24.019 },
      { productId: "cat-rest-gr-042", name: "Peskesi (Heraklion)", note: "Heritage Cretan cuisine.", url: "https://peskesicrete.gr/en", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: 35.338, longitude: 25.143 },
      { productId: "cat-rest-gr-043", name: "Portes (Neo Chora)", note: "Traditional Cretan cuisine with a modern twist.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 35.513, longitude: 24.012 },
      { productId: "cat-rest-gr-044", name: "Salis (Chania Town)", note: "Harbour-side dining.", url: "https://www.salischania.com/", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: 35.516, longitude: 24.018 },
    ],
    Mykonos: [
      { productId: "cat-rest-gr-060", name: "Buddha Bar Beach Mykonos", note: "Beach club at Santa Marina resort.", url: "https://santa-marina.gr/dining/buddha-bar-beach-mykonos/", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", latitude: 37.4506, longitude: 25.3625 },
      { productId: "cat-rest-gr-061", name: "Hippie Fish", note: "Agios Ioannis beachfront fish.", url: "https://hippiefish-mykonos.com/", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop", latitude: 37.4361, longitude: 25.3144 },
      { productId: "cat-rest-gr-062", name: "Scorpios", note: "Paraga Beach club, day-to-night dining.", url: "https://scorpios.com/", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", latitude: 37.4319, longitude: 25.3286 },
      { productId: "cat-rest-gr-063", name: "Interni", note: "Garden dining in Mykonos Town.", url: "https://internirestaurant.com/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.4456, longitude: 25.3289 },
    ],
    Santorini: [
      { productId: "cat-rest-gr-080", name: "Agaze Bistro Restaurant (Pyrgos)", note: "Diamond Rock cliffside bistro.", url: "https://thediamondrock.com/restaurants/agaze-restaurant/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: 36.404, longitude: 25.444 },
      { productId: "cat-rest-gr-081", name: "Petra (Canaves, Oia)", note: "Canaves Oia Suites flagship.", url: "https://canaves.com/canaves-oia-suites/dining/petra-restaurant/", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: 36.4618, longitude: 25.3753 },
      { productId: "cat-rest-gr-082", name: "Pyrgos (Pyrgos)", note: "Historic village taverna.", url: "https://www.pyrgos-santorini.com/", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: 36.404, longitude: 25.444 },
      { productId: "cat-rest-gr-083", name: "Elements (Canaves, Oia)", note: "Canaves Epitome signature dining.", url: "https://canaves.com/canaves-oia-epitome/dining/elements-restaurant/", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: 36.4618, longitude: 25.3753 },
      { productId: "cat-rest-gr-084", name: "Naos (Oia)", note: "Sunset-view modern Greek.", url: "https://naosoia.gr/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 36.4618, longitude: 25.3753 },
      { productId: "cat-rest-gr-085", name: "Lefkes (Finikia)", note: "Hidden village courtyard restaurant.", url: "https://lefkes.gr/lefkes-santorini/?lang=en", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: 36.4661, longitude: 25.3784 },
      { productId: "cat-rest-gr-086", name: "Fino", note: "Contemporary Greek with caldera views.", url: "https://finosantorini.gr/", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", latitude: 36.4173, longitude: 25.4316 },
      { productId: "cat-rest-gr-087", name: "Roka (Oia)", note: "Cycladic small plates.", url: "https://www.roka.gr/", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop", latitude: 36.4618, longitude: 25.3753 },
      { productId: "cat-rest-gr-088", name: "Selene (Pyrgos)", note: "Iconic Santorini fine-dining.", url: "https://selene.gr/", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", latitude: 36.4071, longitude: 25.4444 },
      { productId: "cat-rest-gr-089", name: "Armeni Fish Tavern", note: "Fishing-village taverna below Oia.", url: "https://armenisantorinirestaurant.gr/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 36.4625, longitude: 25.376 },
      { productId: "cat-rest-gr-090", name: "Ammoudi Fish Tavern", note: "Sea-spray seafood under Oia.", url: "https://ammoudisantorini.com/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: 36.464, longitude: 25.371 },
      { productId: "cat-rest-gr-091", name: "Sunset Ammoudi", note: "Sunset seafood mainstay.", url: "https://www.sunset-ammoudi.gr/", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: 36.464, longitude: 25.371 },
      { productId: "cat-rest-gr-092", name: "Kaliya", note: "Caldera-side modern Greek.", url: "https://www.kaliya-restaurant.com/", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: 36.435, longitude: 25.428 },
      { productId: "cat-rest-gr-093", name: "Aktaion (Firostefani)", note: "Traditional Greek with caldera views.", url: "https://www.aktaionsantorini.com/", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: 36.4275, longitude: 25.4324 },
      { productId: "cat-rest-gr-094", name: "Mama Thira (Firostefani)", note: "Family taverna with sea views.", url: "https://www.mamathira.gr/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 36.4275, longitude: 25.4324 },
      { productId: "cat-rest-gr-095", name: "Metaxi Mas (Exo Gonia)", note: "Hilltop favourite — book ahead.", url: "https://santorini-metaximas.gr/en", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: 36.402, longitude: 25.477 },
      { productId: "cat-rest-gr-096", name: "To Psaraki (Vlychada)", note: "Marina-side seafood.", url: "http://www.topsaraki.gr/joomla/", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", latitude: 36.353, longitude: 25.43 },
      { productId: "cat-rest-gr-097", name: "Theros Wave Bar (Vlychada)", note: "Beachfront wave bar.", url: "https://www.theroswavebar.gr/", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop", latitude: 36.351, longitude: 25.434 },
      { productId: "cat-rest-gr-098", name: "Seaside (Perissa)", note: "Casual seaside dining.", url: "https://www.luxuryrestaurantawards.com/restaurant/seaside-santorini/", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", latitude: 36.358, longitude: 25.473 },
      { productId: "cat-rest-gr-099", name: "Yalos", note: "Caldera waterline restaurant.", url: "https://www.yalos-santorini.com/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 36.4173, longitude: 25.4316 },
    ],
    Paros: [
      { productId: "cat-rest-gr-120", name: "Soso", note: "Refined home-style food, off-the-radar.", url: "https://travelfoodpeople.com/paros-refined-homey-food-at-the-quiet-restaurant-of-soso/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: 37.084, longitude: 25.151 },
      { productId: "cat-rest-gr-121", name: "Yemeni", note: "Modern Greek by Naoussa.", url: "https://www.yemeni.gr/", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: 37.124, longitude: 25.237 },
      { productId: "cat-rest-gr-122", name: "Barbarossa", note: "Naoussa harbour stalwart.", url: "https://www.barbarossarestaurant.com/", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: 37.124, longitude: 25.237 },
      { productId: "cat-rest-gr-123", name: "Bebop", note: "Beachside lounge & dining.", url: "https://www.bebopjoomla.gr/", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: 37.087, longitude: 25.158 },
      { productId: "cat-rest-gr-124", name: "Mario Restaurant", note: "Family-run Greek classics.", url: "https://www.mariorestaurantparos.com/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: 37.086, longitude: 25.15 },
      { productId: "cat-rest-gr-125", name: "Monastiri Beach Club", note: "Day-to-night beach club.", url: "https://www.monastiri-paros.gr/", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: 37.13, longitude: 25.213 },
    ],
  },
  hotels: {
    "Collections & Hotel Groups": [
      {
        productId: "cat-hotel-gr-050",
        name: "Grecotel Hotels & Resorts",
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop",
        contact: "Sofia Grigoratou (Sr Regional Manager USA) · sofia.grigoratou@grecotel.com",
        url: "https://www.grecotel.com/",
        properties: [
          "Athens & Riviera — The Dolli at Acropolis, Cape Sounio, The Roc Club, Grecotel Pallas Athena",
          "Crete — Amirandes, Caramel, LUXME White, Creta Palace, Marine Palace & Aqua Park, Plaza Beach House, Casa Adele, Villa Oliva, Meli Palace",
          "West Peloponnese — Mandola Rosa, La Riviera, LUXME Oasis, LUXME Palms, Casa Marron",
          "Corfu — Corfu Imperial, Eva Palace, LUXME Daphnila Bay, LUXME Costa Botanica",
          "Messinia — Filoxenia Kalamata",
          "Mainland — Astir Palace Alexandroupolis, Egnatia, Larissa Imperial",
          "Kos — LUXME Kos, Casa Paradiso",
          "Mykonos — Mykonos Blu (Psarou Beach), Mykonos Lolita (Agios Sostis)",
          "Rhodes — LUXME Dama Dama (Kallithea)",
        ],
        latitude: 37.9838,
        longitude: 23.7275,
        note: "Group-wide all-inclusive LUXME brand. Strong group / FIT distribution across Greece.",
      },
      {
        productId: "cat-hotel-gr-051",
        name: "Domes Resorts",
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
        contact: "Angelique · angelique@wanderluxcollection.com",
        repFirm: "Wanderlux Collection",
        url: "https://domesresorts.com/",
        properties: ["Domes White Coast Milos", "Domes Zeen Chania", "Domes of Corfu"],
        latitude: 39.624,
        longitude: 19.922,
      },
      {
        productId: "cat-hotel-gr-052",
        name: "Naxion Collection",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop",
        contact: "Naxion Collection sales",
        url: "https://www.naxiancollection.com/en",
        properties: ["Naxos", "Paros (Cosme Hotel Paros)"],
        latitude: 37.103,
        longitude: 25.379,
      },
      {
        productId: "cat-hotel-gr-053",
        name: "Yes Hotels",
        image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop",
        contact: "Yes Hotels group reservations",
        url: "https://www.yeshotels.gr/our-hotels/",
        properties: ["New Hotel Athens", "Nous Santorini"],
        latitude: 37.9764,
        longitude: 23.7361,
      },
    ],
    Athens: [
      { productId: "cat-hotel-gr-001", name: "The Dolli at Acropolis", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop", repFirm: "Travellive", url: "https://thedolli.com/", note: "Luxury Acropolis-view hotel in the historical centre.", latitude: 37.9719, longitude: 23.7253 },
      { productId: "cat-hotel-gr-002", name: "Athens Capital Hotel — M Gallery", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop", repFirm: "M Gallery Collection", url: "https://athenscapitalhotel-mgallery.com/", note: "Very modern.", latitude: 37.9784, longitude: 23.7341 },
      { productId: "cat-hotel-gr-003", name: "Xenodocheio Milos", image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop", repFirm: "Dominique Debay", url: "https://www.xenodocheiomilos.com/", latitude: 37.9778, longitude: 23.7341 },
      { productId: "cat-hotel-gr-004", name: "A77 Suites Athens", image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=400&fit=crop", contact: "Maria Papaconstantinou · maria@axiahospitality.com", repFirm: "Small Luxury Hotels of the World", url: "https://www.a77suites.com/", note: "Acropolis views.", latitude: 37.974, longitude: 23.728 },
      { productId: "cat-hotel-gr-005", name: "New Hotel Athens", image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop", repFirm: "Yes Hotels", url: "https://www.yeshotels.gr/newhotel/", note: "Funky, contemporary art.", latitude: 37.9764, longitude: 23.7361 },
      { productId: "cat-hotel-gr-006", name: "King George — Luxury Collection", image: "https://images.unsplash.com/photo-1570213489059-0aac6626d401?w=600&h=400&fit=crop", repFirm: "Marriott Luxury Collection", url: "https://www.marriott.com/en-us/hotels/athgl-king-george-a-luxury-collection-hotel-athens/overview/", note: "Guests receive amenities of Grande Bretagne except the rooftop pool.", latitude: 37.9759, longitude: 23.7348 },
    ],
    Mykonos: [
      { productId: "cat-hotel-gr-010", name: "Cali Mykonos", image: "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=600&h=400&fit=crop", contact: "Sophia Zachartos · sophia@calimykonos.com · Angela Rojas · arojas@mjlselect.com", url: "https://www.calimykonos.com/", latitude: 37.4467, longitude: 25.3289 },
      { productId: "cat-hotel-gr-011", name: "Mykonos Blu — Grecotel", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop", repFirm: "Grecotel", url: "https://www.grecotel.com/", note: "Psarou Beach.", latitude: 37.4267, longitude: 25.3494 },
      { productId: "cat-hotel-gr-012", name: "Mykonos Lolita — Grecotel", image: "https://images.unsplash.com/photo-1561501878-aabd62634533?w=600&h=400&fit=crop", repFirm: "Grecotel", url: "https://www.grecotel.com/", note: "Agios Sostis.", latitude: 37.4831, longitude: 25.3636 },
    ],
    Santorini: [
      { productId: "cat-hotel-gr-020", name: "Diamond Rock Villas", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop", url: "https://thediamondrock.com/accommodation/", note: "Cliffside villa accommodation.", latitude: 36.4618, longitude: 25.3753 },
      { productId: "cat-hotel-gr-021", name: "Homeric Poems", image: "https://images.unsplash.com/photo-1601581875309-fafbf2a0a476?w=600&h=400&fit=crop", url: "https://www.homericpoems.gr/", note: "Caldera-facing cave suites.", latitude: 36.4618, longitude: 25.3753 },
      { productId: "cat-hotel-gr-022", name: "Nous Santorini — a Yes Hotel", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop", repFirm: "Yes Hotels", url: "https://www.yeshotels.gr/nous-santorini/", note: "Adults-only.", latitude: 36.3932, longitude: 25.4615 },
    ],
    Paros: [
      { productId: "cat-hotel-gr-030", name: "Parilio Paros Design Hotel", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", url: "https://pariliohotelparos.com/", note: "Naoussa.", latitude: 37.124, longitude: 25.237 },
      { productId: "cat-hotel-gr-031", name: "Cosme Paros", image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=400&fit=crop", repFirm: "Naxion Collection", url: "https://cosmehotelparos.com/", note: "Naxion Collection.", latitude: 37.072, longitude: 25.171 },
    ],
    Milos: [
      { productId: "cat-hotel-gr-040", name: "Hotel Milos Sea Resort", image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&h=400&fit=crop", url: "https://www.hotelmilosresort.com/", latitude: 36.7404, longitude: 24.421 },
      { productId: "cat-hotel-gr-041", name: "Domes White Coast Milos", image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=400&fit=crop", repFirm: "Domes Resorts", url: "https://domesresorts.com/domeswhitecoastmilos/", note: "Adults-only pool suites.", latitude: 36.722, longitude: 24.451 },
      { productId: "cat-hotel-gr-042", name: "Milos Breeze", image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=400&fit=crop", url: "https://www.milosbreeze.gr/en/", note: "Sweeping Aegean views.", latitude: 36.745, longitude: 24.43 },
    ],
  },
  yachtCompanies: [
    {
      productId: "cat-yacht-gr-001",
      name: "Blue BNC",
      image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&h=400&fit=crop",
      contact: "Morgane Candlot (Area Manager) · morgane@bluebnc.com · +34 674 324 156",
      url: "https://www.bluebnc.com/en-es/yacht-charter/greece",
      latitude: 37.9402,
      longitude: 23.6427,
      destinations:
        "Greece, Mallorca, Ibiza, Formentera & Balearic Islands, French Riviera & Monaco, Bahamas, St Barth",
      contactName: "Morgane Candlot",
      email: "morgane@bluebnc.com",
      phone: "+34 674 324 156",
    },
    {
      productId: "cat-yacht-gr-002",
      name: "Roccabella Yachts",
      image: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600&h=400&fit=crop",
      contact: "Lewis Bloor · lewis.bloor@roccabellayachts.com",
      url: "https://roccabellayachts.com/",
      latitude: 37.9402,
      longitude: 23.6427,
      destinations: "Greek Islands, Turkey, Italy and wider Mediterranean",
      contactName: "Lewis Bloor",
      email: "lewis.bloor@roccabellayachts.com",
    },
  ],
  tourismRegions: [
    {
      name: "Greece — National",
      description: "Visit Greece, the Greek National Tourism Organization.",
      contact:
        "Mr Konstantinos Charokopos · Chief Officer, North America · +1 212 421 5777 ext. 306 · info@greektourism.com",
      links: [
        { label: "Visit Greece (GNTO)", url: "https://www.visitgreece.gr/" },
        { label: "GNTO contact", url: "https://www.gtp.gr/TDirectoryDetails.asp?ID=1425" },
        { label: "Greeka", url: "https://www.greeka.com/" },
        { label: "Travel agent portal (Greeka)", url: "https://www.greeka.com/travel-agents/" },
        { label: "UNESCO World Heritage Sites in Greece", url: "https://www.greeka.com/greece-history/world-heritage-sites/" },
      ],
      latitude: 37.9838,
      longitude: 23.7275,
    },
    {
      name: "Athens",
      description: "Athens & Attica region — Visit Athens / This Is Athens.",
      contact: "info@thisisathens.org",
      links: [
        { label: "Visit Athens (GNTO)", url: "https://www.visitgreece.gr/mainland/attica/athens/" },
        { label: "This Is Athens", url: "https://www.thisisathens.org/partners" },
        { label: "Contact form", url: "https://www.thisisathens.org/contact" },
      ],
      latitude: 37.9838,
      longitude: 23.7275,
    },
    {
      name: "Greek Islands — Overview",
      description: "Editorial round-ups and inspiration across the islands.",
      links: [
        { label: "Greek Islands (Greeka)", url: "https://www.greeka.com/greece-islands/" },
        { label: "Condé Nast Traveller — Best Greek Islands to Visit", url: "https://www.cntraveller.com/gallery/best-greek-islands-beaches" },
        { label: "The Greek Reporter — 20 Greek Islands", url: "https://greekreporter.com/2023/01/07/top-20-greek-islands-travel-greece/" },
      ],
      latitude: 37.5,
      longitude: 25.0,
    },
    {
      name: "Crete",
      description: "Incredible Crete — regional tourism body.",
      links: [
        { label: "Incredible Crete", url: "https://www.incrediblecrete.gr/en/" },
        { label: "Contact", url: "https://www.incrediblecrete.gr/en/contact/" },
      ],
      latitude: 35.2401,
      longitude: 24.8093,
    },
    {
      name: "Cyclades",
      description:
        "33 islands and islets (24 inhabited): Amorgos, Anafi, Andros, Antiparos, Donousa, Iraklia, Thirasia, Ios, Kea, Kimolos, Koufonisi, Kythnos, Milos, Mykonos, Naxos, Paros, Santorini, Serifos, Sikinos, Sifnos, Syros, Schinoussa, Tinos, Folegandros.",
      links: [
        { label: "Cyclades (GNTO)", url: "https://www.visitgreece.gr/islands/cyclades/" },
        { label: "Cyclades Chamber of Commerce — events, ferries, flights", url: "https://www.e-kyklades.gr/travel/?lang=en" },
        { label: "Milos", url: "https://www.milos-island.com/" },
        { label: "Mykonos", url: "https://www.mykonosgreece.com/" },
        { label: "Santorini", url: "https://www.santorini.gr/" },
        { label: "Naxos & the Small Cyclades", url: "https://www.naxos.gr/?lang=en" },
      ],
      latitude: 37.1,
      longitude: 25.37,
    },
    {
      name: "Ionian Islands",
      description: "Zakynthos, Ithaca, Corfu, Kefalonia, Lefkada, Paxos and Kythira.",
      links: [
        { label: "Ionian Islands (GNTO)", url: "https://www.visitgreece.gr/islands/ionian-islands/zakynthos/" },
        { label: "Visit Greece contact form", url: "https://www.visitgreece.gr/contact-form/" },
        { label: "Zakynthos Island", url: "https://www.zanteisland.com/en/information-zakynthos.php" },
      ],
      latitude: 38.4,
      longitude: 20.6,
    },
    {
      name: "Corfu",
      description: "Visit Corfu — regional tourism organisation.",
      contact: "info@corfu.gov.gr",
      links: [
        { label: "Visit Corfu", url: "https://visit.corfu.gr/" },
        { label: "Contact form", url: "https://visit.corfu.gr/contact/" },
      ],
      latitude: 39.6243,
      longitude: 19.9217,
    },
    {
      name: "Rhodes",
      description: "Rhodes Welcome — official tourist guide & contact info.",
      contact: "touristinfo@rhodes.gr",
      links: [
        { label: "Rhodes Welcome", url: "https://rhodeswelcome.gr/" },
        { label: "Tourist guide & contact", url: "https://www.rhodes.gr/tourist-guide/" },
      ],
      latitude: 36.4341,
      longitude: 28.2176,
    },
    {
      name: "Northwest Greece — Epirus & Zagori",
      description:
        "Region of Epirus / Zagori — dramatic terrain and 46 stone villages of Zagorohoria. Includes archaeological sites of Dodoni and Nekromanteion plus the Epirus coastline.",
      contact: "+30 2651 037017 · info@travelioannina.com · tourism@ioannina.gr",
      links: [
        { label: "Discover Zagori (Discover Greece)", url: "https://www.discovergreece.com/epirus/zagori" },
        { label: "Travel Ioannina — Ioannina, Mt Vikos, Zagorohoria", url: "https://www.travelioannina.com/" },
      ],
      latitude: 39.6675,
      longitude: 20.85,
    },
    {
      name: "Peloponnese",
      description:
        "Peloponnese Regional Tourism Office. Ancient Corinth, Temple of Apollo, Ancient Olympia, Corinthia, Kalamata, Nafplio, Epidaurus (UNESCO), Mystras (UNESCO), Sparta. Includes Porto Heli ('Peloponnesian Riviera') and Spetses Island.",
      contact: "info@topel.gr",
      links: [
        { label: "Peloponnese Regional Tourism Office", url: "https://topel.gr/pelonnese/" },
        { label: "Nafplio", url: "http://www.visitnafplio.com/" },
        { label: "Nafplio — useful info", url: "https://www.visitnafplio.com/really-useful-info/contact-and-disclaimer.html" },
        { label: "Argolis", url: "https://greekreporter.com/2022/08/26/greece-visit-argolis-peloponnese/" },
        { label: "Porto Heli", url: "https://www.greeka.com/peloponnese/porto-heli/" },
        { label: "Spetses Island", url: "https://www.visitgreece.gr/islands/saronic-islands/spetses/" },
      ],
      latitude: 37.563,
      longitude: 22.806,
    },
    {
      name: "Thessaloniki",
      description:
        "Greek capital of the Balkans — gastronomic and cultural capital; co-capital of the Byzantine Empire and modern Hellenic Republic.",
      contact: "welcome@thessaloniki.travel · info@thessalonikitourism.gr",
      links: [
        { label: "Thessaloniki Travel", url: "https://thessaloniki.travel/" },
        { label: "Contact", url: "https://thessaloniki.travel/contact/" },
        { label: "Thessaloniki Tourism", url: "https://www.thessalonikitourism.gr/index.php/en/" },
        { label: "Culture Trip — Awesome reasons", url: "https://theculturetrip.com/europe/greece/articles/10-awesome-reasons-thessaloniki-should-be-on-your-bucket-list/" },
      ],
      latitude: 40.6401,
      longitude: 22.9444,
    },
  ],
  documents: [
    { name: "Athens Dining Guide.docx", type: "docx", kvDocumentId: "doc-kv-dest-gr-1" },
    { name: "Athens, Greece.pdf", type: "pdf", kvDocumentId: "doc-kv-dest-gr-2" },
    { name: "Crete, Greece.pdf", type: "pdf", kvDocumentId: "doc-kv-dest-gr-3" },
    { name: "Greece Destination Guide.pdf", type: "pdf", kvDocumentId: "doc-kv-dest-gr-4" },
    { name: "Mykonos, Greece.pdf", type: "pdf", kvDocumentId: "doc-kv-dest-gr-5" },
    { name: "Paros Dining.docx", type: "docx", kvDocumentId: "doc-kv-dest-gr-6" },
    { name: "Santorini, Greece.pdf", type: "pdf", kvDocumentId: "doc-kv-dest-gr-7" },
  ],
  mapCenter: { lat: 37.9838, lng: 23.7275, zoom: 6 },
  tripReports: [
    {
      id: stableDestinationUuid("greece-trip-report-sarah-2026"),
      advisorId: "adv-demo-sarah",
      advisorName: "Sarah T.",
      travelDates: { start: "2026-03-08", end: "2026-03-15" },
      subRegionsVisited: ["Cyclades — Santorini", "Cyclades — Mykonos", "Athens"],
      productReferences: [
        { productId: "cat-dmc-gr-001", label: "Original Senses" },
        { productId: "cat-hotel-gr-022", label: "Nous Santorini" },
      ],
      content:
        "**Just back** — Santorini ferries were smooth mid-week. Advise clients to book sunset tables 30+ days ahead in Oia. Original Senses reconfirmed drivers within 2 hours when winds shifted our hydrofoil.",
      helpfulCount: 14,
      createdAt: "2026-03-18T10:00:00.000Z",
      latitude: 36.3932,
      longitude: 25.4615,
    },
    {
      id: stableDestinationUuid("greece-trip-report-alex-2025"),
      advisorId: "adv-demo-alex",
      advisorName: "Alex Chambers",
      travelDates: { start: "2025-09-02", end: "2025-09-12" },
      subRegionsVisited: ["Crete", "Athens"],
      productReferences: [{ productId: "cat-rest-gr-042", label: "Peskesi" }],
      content:
        "Crete driving times are underestimated in most PDFs — pad 25% for mountain routes. Peskesi (Heraklion) still a standout for foodie clients.",
      helpfulCount: 9,
      createdAt: "2025-09-15T14:20:00.000Z",
      latitude: 35.3387,
      longitude: 25.1442,
    },
  ],
};

const ITALY: Destination = {
  slug: "italy",
  name: "Italy",
  tagline: "Regional specialists from the Dolomites to Sicily.",
  heroImage: heroImageUrlForDestination("italy"),
  description: "",
  subRegions: ["Rome", "Florence", "Amalfi", "Sicily"],
  dmcPartners: [
    {
      productId: "cat-dmc-it-001",
      name: "Italia Curata DMC",
      image: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=400&h=300&fit=crop",
      preferred: true,
      reppedBy: "EU desk",
      website: "https://example.com/italia-curata",
      keyContact: "Giulia R.",
      generalRequests: "italy@example.com",
    },
  ],
  restaurants: {
    Rome: [{ productId: "cat-rest-it-001", name: "Roscioli", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", note: "Testaccio" }],
  },
  hotels: {
    Rome: [{ productId: "cat-hotel-it-001", name: "Hotel de Russie", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop", url: "https://example.com/russie" }],
  },
  tourismRegions: [
    {
      name: "National",
      contact: "ENIT · info@italia.example.com",
      links: [{ label: "Italia.it", url: "https://www.italia.it/en.html" }],
    },
  ],
  documents: [{ name: "Italy rail pass overview", type: "pdf" }],
};

const FRANCE: Destination = {
  slug: "france",
  name: "France",
  tagline: "City breaks, wine routes, and alpine escapes.",
  heroImage: heroImageUrlForDestination("france"),
  description: "",
  subRegions: ["Paris", "Provence", "French Alps", "Loire"],
  dmcPartners: [
    {
      productId: "cat-dmc-fr-001",
      name: "Maison Routes DMC",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
      preferred: false,
      website: "https://example.com/maison-routes",
      keyContact: "Claire D.",
    },
  ],
  restaurants: {
    Paris: [{ productId: "cat-rest-fr-001", name: "Septime", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", note: "Book weeks ahead" }],
  },
  hotels: {
    Paris: [{ productId: "cat-hotel-fr-001", name: "Le Bristol Paris", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop", url: "https://example.com/bristol" }],
  },
  tourismRegions: [
    {
      name: "National",
      links: [{ label: "France.fr", url: "https://us.france.fr/en" }],
    },
  ],
  documents: [],
};

const JAPAN: Destination = {
  slug: "japan",
  name: "Japan",
  tagline: "Urban energy, onsen retreats, and seasonal rail journeys.",
  heroImage: heroImageUrlForDestination("japan"),
  description: "",
  subRegions: ["Tokyo", "Kyoto", "Hokkaido", "Okinawa"],
  dmcPartners: [
    {
      productId: "cat-dmc-jp-001",
      name: "Nippon Pathways",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
      preferred: true,
      keyContact: "Kenji M.",
      generalRequests: "jp@example.com",
    },
  ],
  restaurants: {
    Tokyo: [{ productId: "cat-rest-jp-001", name: "Den", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", note: "Kanda · reservation lottery" }],
  },
  hotels: {
    Tokyo: [{ productId: "cat-hotel-jp-001", name: "Aman Tokyo", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop", url: "https://example.com/aman-tokyo" }],
  },
  tourismRegions: [
    {
      name: "National",
      links: [{ label: "JNTO", url: "https://www.japan.travel/en/us/" }],
    },
  ],
  documents: [{ name: "JR pass quick reference", type: "pdf" }],
};

/** Skeleton hub — multi-country; sub-regions organize countries (spec: Africa example). */
const AFRICA: Destination = {
  slug: "africa",
  name: "Africa",
  tagline: "Safari, cities, and coastlines — curated coverage growing.",
  heroImage: heroImageUrlForDestination("africa"),
  description: "",
  subRegions: ["South Africa", "Kenya", "Botswana", "Tanzania"],
  dmcPartners: [
    {
      productId: "cat-dmc-af-001",
      name: "Exeter Safari Collection",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop",
      preferred: true,
      reppedBy: "Safari desk",
      website: "https://example.com/exeter-safari",
      keyContact: "Sarah M. · safaris@example.com",
      generalRequests: "safari.ops@example.com",
      specializations: ["Safari", "Family travel", "Photography"],
      languages: ["English", "Afrikaans"],
      proposalTurnaround: "48 hours",
      minimumBooking: "$2,500 per booking",
    },
    {
      productId: "cat-dmc-af-002",
      name: "Giltedge Africa",
      image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop",
      preferred: false,
      website: "https://example.com/giltedge",
      keyContact: "team@giltedge.example.com",
      specializations: ["Luxury safari", "Cape Town"],
      languages: ["English"],
    },
  ],
  restaurants: {
    "Cape Town": [
      { productId: "cat-rest-af-001", name: "Test Kitchen", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", note: "Woodstock · book early" },
    ],
    Nairobi: [{ productId: "cat-rest-af-002", name: "Carnivore", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", note: "Classic grill" }],
  },
  hotels: {
    "South Africa": [
      {
        productId: "cat-hotel-af-001",
        name: "Singita Lebombo",
        image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop",
        url: "https://example.com/singita",
        note: "Kruger",
        repFirm: "EU consortium",
      },
    ],
    Kenya: [
      {
        productId: "cat-hotel-af-002",
        name: "Giraffe Manor",
        image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop",
        url: "https://example.com/giraffe",
        note: "Nairobi",
      },
    ],
  },
  tourismRegions: [
    {
      name: "South Africa Tourism",
      description: "Trade marketing & toolkit",
      links: [{ label: "South Africa Tourism", url: "https://www.southafrica.net/" }],
      contact: "trade@southafrica.example.com",
    },
    {
      name: "Kenya Tourism Board",
      links: [{ label: "Magical Kenya", url: "https://www.magicalkenya.com/" }],
    },
  ],
  documents: [
    { name: "East Africa visa & eTA checklist", type: "pdf" },
    { name: "Safari packing & tipping guide", type: "pdf" },
  ],
};

/** Skeleton hub — multi-island; sub-regions organize islands (spec: Caribbean example). */
const CARIBBEAN: Destination = {
  slug: "caribbean",
  name: "Caribbean",
  tagline: "Island hopping — DMCs, dining, and yacht partners.",
  heroImage: heroImageUrlForDestination("caribbean"),
  description: "",
  subRegions: ["Anguilla", "Antigua", "Aruba", "St. Barth", "Turks & Caicos"],
  dmcPartners: [
    {
      productId: "cat-dmc-cb-001",
      name: "Hummingbird Travel",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
      preferred: true,
      website: "https://example.com/hummingbird",
      keyContact: "charters@hummingbird.example.com",
      specializations: ["Yachts", "Island transfers"],
      languages: ["English", "French"],
    },
    {
      productId: "cat-dmc-cb-002",
      name: "Caribbean Excursionist",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
      preferred: false,
      website: "https://example.com/excursionist",
      keyContact: "hello@excursionist.example.com",
    },
  ],
  restaurants: {
    Anguilla: [{ productId: "cat-rest-cb-001", name: "Blanchards", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", note: "Meads Bay" }],
    "St. Barth": [{ productId: "cat-rest-cb-002", name: "Bonito", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", note: "Gustavia harbor" }],
    Aruba: [{ productId: "cat-rest-cb-003", name: "Passions on the Beach", image: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=400&h=300&fit=crop", note: "Eagle Beach" }],
  },
  hotels: {
    "Grand Cayman": [
      {
        productId: "cat-hotel-cb-001",
        name: "Ritz-Carlton Grand Cayman",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop",
        url: "https://example.com/ritz-gc",
        note: "Seven Mile Beach",
      },
    ],
    "St Lucia": [
      {
        productId: "cat-hotel-cb-002",
        name: "Jade Mountain",
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
        url: "https://example.com/jade",
        note: "Pitons views",
      },
    ],
  },
  tourismRegions: [
    {
      name: "Barbados Tourism",
      links: [{ label: "Visit Barbados", url: "https://www.visitbarbados.org/" }],
    },
    {
      name: "Anguilla Tourist Board",
      links: [{ label: "I Love Anguilla", url: "https://www.ivisitanguilla.com/" }],
    },
  ],
  documents: [{ name: "Caribbean island-hopping primer", type: "pdf" }],
};

/* ——— Argentina dataset — sourced from the advisor-portal Argentina destination page ——— */

const ARGENTINA: Destination = {
  slug: "argentina",
  name: "Argentina",
  tagline: "Patagonia to Buenos Aires.",
  heroImage: heroImageUrlForDestination("argentina"),
  description:
    "Argentina — partner intel sourced from the agency's destination page. Meals happen later in Buenos Aires: dinner usually starts around 10pm and can run into the early hours.",
  subRegions: ["Buenos Aires", "Patagonia", "Mendoza", "Iguazú", "Salta"],
  dmcPartners: [
    {
      productId: "cat-dmc-ar-001",
      name: "Abercrombie & Kent Argentina",
      preferred: true,
      destinationsServed: "Argentina, Europe, France · Global DMC",
      featuredRegions: "Buenos Aires, Patagonia, Mendoza",
      latitude: -34.6037,
      longitude: -58.3816,
      website: "https://www.abercrombiekent.com/",
      image: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop",
      keyContact: "Sonja Stoerr · Sales Director, NY & Northeast USA · +1 (630) 725-3400 x521",
      generalRequests: "Abercrombie & Kent USA, LLC",
      paymentProcess:
        "General TL agent log-in: hello@travellustre.com (PW: Travel44!). Advisors can also self-register at abercrombiekent.com/agent-services/registration.",
      notes: "Global DMC — A&K Europe / France desk in New York.",
    },
    {
      productId: "cat-dmc-ar-002",
      name: "Garcia Fernandez Turismo",
      preferred: false,
      destinationsServed: "Argentina, Latin America",
      latitude: -34.6037,
      longitude: -58.3816,
      reppedBy: "Virtuoso",
      website: "http://www.gft.com.ar",
      image: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop",
      generalRequests: "garcia.fernandez@gft.com.ar · +54 011 5263 9969",
      afterHours: "Office hours 09:30–18:30 ART · +54 011 5263 9969",
      notes:
        "Customised luxury trips, cruises, tourism from abroad, passenger transportation, travel experiences, business trips, incentive groups and luxury Central America. Also specialises in ski itineraries.",
    },
  ],
  restaurants: {
    "Buenos Aires": [
      { productId: "cat-rest-ar-001", name: "Alvear Grill", note: "Hotel grill room with a great roof bar.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: -34.5895, longitude: -58.3868 },
      { productId: "cat-rest-ar-002", name: "Aramburu", note: "Fine dining 18-course tasting menu.", url: "https://www.arambururesto.com.ar/", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: -34.595, longitude: -58.391 },
      { productId: "cat-rest-ar-003", name: "Aramburu Bis", note: "Relaxed sister bistro across the street from Aramburu.", url: "https://www.bisresto.com.ar/", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: -34.595, longitude: -58.391 },
      { productId: "cat-rest-ar-004", name: "Birkin", note: "Great Buenos Aires breakfast spot.", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: -34.585, longitude: -58.395 },
      { productId: "cat-rest-ar-005", name: "Cadore", note: "Best ice cream downtown — craft Argentinian flavours with Italian roots since 1957.", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: -34.6075, longitude: -58.3786 },
      { productId: "cat-rest-ar-006", name: "Cafe Rivas", note: "Old-world Argentinian comfort food, serious wine list, live piano weekends and Sunday brunch.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: -34.617, longitude: -58.371 },
      { productId: "cat-rest-ar-007", name: "Casa Cavia", note: "Palermo hideaway: bookshop, florist & restaurant.", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: -34.575, longitude: -58.42 },
      { productId: "cat-rest-ar-008", name: "Cucina Paradiso", note: "Amazing homemade pasta in Palermo.", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", latitude: -34.583, longitude: -58.426 },
      { productId: "cat-rest-ar-009", name: "Cuervo", note: "Great breakfast and coffee.", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop", latitude: -34.586, longitude: -58.426 },
      { productId: "cat-rest-ar-010", name: "Don Julio", note: "Probably the most famous restaurant in all of Buenos Aires — parrilla.", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", latitude: -34.586, longitude: -58.428 },
      { productId: "cat-rest-ar-011", name: "El Burladero", note: "Spanish-leaning Recoleta classic.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: -34.589, longitude: -58.39 },
      { productId: "cat-rest-ar-012", name: "El Pobre Luís", note: "Beloved Belgrano parrilla.", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", latitude: -34.557, longitude: -58.456 },
      { productId: "cat-rest-ar-013", name: "Duque", note: "Modern Argentinian dining.", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop", latitude: -34.585, longitude: -58.426 },
      { productId: "cat-rest-ar-014", name: "Mishiguene", note: "Israeli & Jewish classics reimagined.", url: "https://www.facebook.com/mishiguene/", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", latitude: -34.581, longitude: -58.428 },
      { productId: "cat-rest-ar-015", name: "Rapa Nui", note: "Best ice cream and chocolates.", url: "https://rapanui.com.ar/", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop", latitude: -34.6, longitude: -58.4 },
      { productId: "cat-rest-ar-016", name: "Salvaje Bakery", note: "Casual bakery: homemade breads, sandwiches, pastries.", url: "https://www.salvajebakery.com.ar/", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop", latitude: -34.59, longitude: -58.43 },
      { productId: "cat-rest-ar-017", name: "Tanta", note: "Peruvian by Gastón Acurio in Buenos Aires.", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", latitude: -34.586, longitude: -58.426 },
    ],
  },
  hotels: {},
  tourismRegions: [
    {
      name: "Argentina — National",
      description: "Tourism Board section to be expanded as content is provided.",
      links: [],
      latitude: -34.6037,
      longitude: -58.3816,
    },
  ],
  documents: [],
  mapCenter: { lat: -34.6037, lng: -58.3816, zoom: 4 },
};

/**
 * Stub destination portals (curated entries above: Greece, Italy, France, Japan, Africa, Caribbean, Argentina).
 * Replace rows from Claromentis export when `Claromentis_Destination_Data.xlsx` is wired into the build.
 */
const OTHER_META: { slug: string; name: string; tagline: string }[] = [
  { slug: "antarctica", name: "Antarctica", tagline: "Expedition planning — content coming soon." },
  { slug: "arctic", name: "Arctic", tagline: "Polar journeys — content coming soon." },
  { slug: "australia", name: "Australia", tagline: "Coastal cities and Outback." },
  { slug: "austria", name: "Austria", tagline: "Alpine culture & cities — distinct from Switzerland." },
  { slug: "baltics", name: "The Baltics", tagline: "Estonia, Lithuania, Latvia." },
  { slug: "bermuda", name: "Bermuda", tagline: "Island escape — content coming soon." },
  { slug: "bhutan", name: "Bhutan", tagline: "Himalayan kingdom journeys." },
  { slug: "brazil", name: "Brazil", tagline: "Amazon to Rio." },
  { slug: "canada", name: "Canada", tagline: "Rockies, cities, and Maritimes." },
  { slug: "chile", name: "Chile", tagline: "Atacama to Patagonia." },
  { slug: "colombia", name: "Colombia", tagline: "Cities and coffee country." },
  { slug: "costa-rica", name: "Costa Rica", tagline: "Rainforest & coast." },
  { slug: "croatia", name: "Croatia", tagline: "Adriatic coast & islands." },
  { slug: "egypt", name: "Egypt", tagline: "Nile and Red Sea." },
  { slug: "germany", name: "Germany", tagline: "Cities, castles, and Rhine." },
  { slug: "india", name: "India", tagline: "Golden Triangle & beyond." },
  { slug: "jordan-israel", name: "Jordan & Israel", tagline: "Combined hub — sub-regions split countries." },
  { slug: "korea", name: "Korea", tagline: "Seoul and countryside." },
  { slug: "maldives", name: "Maldives", tagline: "Resort islands." },
  { slug: "malta", name: "Malta", tagline: "Mediterranean heritage." },
  { slug: "mexico", name: "Mexico", tagline: "Colonial cities & coast." },
  { slug: "morocco", name: "Morocco", tagline: "Imperial cities & desert." },
  { slug: "netherlands", name: "Netherlands", tagline: "Canals & countryside." },
  { slug: "new-zealand", name: "New Zealand", tagline: "North & South Island." },
  { slug: "nordics", name: "The Nordics", tagline: "Norway, Sweden, Denmark, Finland, Iceland." },
  { slug: "panama", name: "Panama", tagline: "Canal & coast." },
  { slug: "peru", name: "Peru", tagline: "Andes and Amazon." },
  { slug: "poland", name: "Poland", tagline: "Historic cities." },
  { slug: "uk-ireland", name: "Scotland, Ireland, Wales & UK", tagline: "British Isles hub — sub-regions per country." },
  { slug: "slovenia", name: "Slovenia", tagline: "Alps & Adriatic." },
  { slug: "southeast-asia", name: "Southeast Asia", tagline: "Thailand, Vietnam, Cambodia, and neighbors." },
  { slug: "spain-portugal", name: "Spain & Portugal", tagline: "Iberian hub — sub-regions per country." },
  { slug: "switzerland", name: "Switzerland", tagline: "Alpine rail & lakes — distinct from Austria." },
  { slug: "tahiti", name: "Tahiti", tagline: "French Polynesia overwater villas." },
  { slug: "turkey", name: "Turkey", tagline: "Istanbul to Cappadocia & Aegean coast." },
  { slug: "uruguay", name: "Uruguay", tagline: "Wine country & Punta del Este." },
  { slug: "usa", name: "USA", tagline: "Coast to coast — sub-regions per state/area." },
];

function buildStub(m: { slug: string; name: string; tagline: string }): Destination {
  return stubDestination(m.slug, m.name, m.tagline, heroImageUrlForDestination(m.slug));
}

const STUBS = OTHER_META.map(buildStub);

const BY_SLUG: Record<string, Destination> = Object.fromEntries(
  [GREECE, ITALY, FRANCE, JAPAN, AFRICA, CARIBBEAN, ARGENTINA, ...STUBS].map((d) => [d.slug, d]),
);

export function listDestinationSlugs(): string[] {
  return Object.keys(BY_SLUG);
}

export function getDestinationBySlug(slug: string): Destination | undefined {
  return BY_SLUG[slug];
}

export function listDestinationSummaries(agencyId?: string | null): DestinationSummary[] {
  return Object.values(BY_SLUG)
    .filter((d) => destinationIsVisibleForViewer(d, agencyId))
    .map(destinationToSummary)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function destinationHasYachtData(d: Destination): boolean {
  return (d.yachtCompanies?.length ?? 0) > 0;
}
