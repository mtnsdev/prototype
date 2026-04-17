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

export type FreshnessTone = "green" | "neutral" | "amber";

export type DestinationDocument = {
  name: string;
  type: "pdf" | "docx" | "xlsx";
  /** Knowledge Vault document id — opens `url` from the vault catalog when set. */
  kvDocumentId?: string;
};

export type DMCPartner = {
  /** Catalog product id when this DMC exists in the Product Directory (single source of truth for ops fields). */
  productId?: string;
  name: string;
  preferred: boolean;
  reppedBy?: string;
  website?: string;
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
  feedback?: string;
  /** Mock: product-level endorsements (display-only in prototype). */
  endorsementCount?: number;
  /** Mock: display-only freshness (Drop 2 computes from signals). */
  freshnessTone?: FreshnessTone;
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
  name: string;
  url?: string;
  note?: string;
  endorsementCount?: number;
  freshnessTone?: FreshnessTone;
  latitude?: number;
  longitude?: number;
};

export type Hotel = {
  /** Catalog Accommodation product id. */
  productId?: string;
  name: string;
  contact?: string;
  /** Rep firm line from catalog (prototype: plain string). */
  repFirm?: string;
  url?: string;
  note?: string;
  properties?: string[];
  endorsementCount?: number;
  freshnessTone?: FreshnessTone;
  latitude?: number;
  longitude?: number;
};

export type YachtCompany = {
  productId?: string;
  name: string;
  /** Fallback single line (prototype). Prefer structured fields when set. */
  contact: string;
  url: string;
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

/**
 * One block inside a tab — any combination of products (catalog), text, and/or attached documents.
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
    countDestinationCatalogProductRows(d) +
    d.tourismRegions.length +
    d.documents.length +
    (d.tripReports?.length ?? 0);
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

/* ——— Full Greece dataset (Claromentis-parity prototype counts) ——— */

const GREECE: Destination = {
  slug: "greece",
  name: "Greece",
  tagline: "Islands, history, and seamless land programs across the Aegean.",
  heroImage: heroImageUrlForDestination("greece"),
  description:
    "Greece blends iconic island escapes with mainland culture and cuisine. Use this guide for DMC contacts, dining, hotels, and official tourism resources.",
  subRegions: [
    "Athens",
    "Santorini",
    "Mykonos",
    "Crete",
    "Paros",
    "Peloponnese",
    "Thessaloniki",
  ],
  dmcPartners: [
    {
      productId: "cat-dmc-greece-001",
      name: "Aegean Elite DMC",
      preferred: true,
      endorsementCount: 6,
      freshnessTone: "green",
      responsibleTourism: true,
      specialAmenity: "Virtuoso welcome amenity + handwritten island primer for Virtuoso guests.",
      destinationsServed: "Greece (mainland + islands)",
      featuredRegions: "Cyclades, Athens, Crete",
      specializations: ["Culinary Experiences", "Private Touring", "Yacht + villa combos"],
      languages: ["English", "Greek", "French"],
      proposalTurnaround: "48 Hours",
      minimumBooking: "€1,200/day FIT minimum peak season",
      serviceOptions: ["Itinerary integration", "White-label proposals"],
      itineraryPlatforms: ["Travefy", "AXUS"],
      latitude: 37.9838,
      longitude: 23.7275,
      socialMedia: "Instagram @AegeanEliteDMC",
      reppedBy: "TL Greece desk · advisor@example.com",
      website: "https://example.com/aegean-elite",
      keyContact: "Maria Konstantinou · maria.k@example.com",
      generalRequests: "greece.requests@example.com",
      pricing: "Net rates; FIT series on request.",
      paymentProcess: "Wire 21 days prior to arrival; CC with fee.",
      commissionProcess: "10–12% posted after travel; statement monthly.",
      afterHours: "WhatsApp line for active trips · +30 694 000 0000",
      notes: "Strong on Cyclades yacht + villa combos; prefer 7-night minimum July–Aug.",
      feedback:
        "Advisors report fast turnaround on bespoke island-hopping — highlight ferry buffer on tight same-day connections.",
    },
    {
      productId: "cat-dmc-greece-002",
      name: "Hellenic Horizons",
      preferred: false,
      endorsementCount: 2,
      freshnessTone: "neutral",
      latitude: 40.6401,
      longitude: 22.9444,
      reppedBy: "Partner services",
      website: "https://example.com/hellenic",
      keyContact: "Nikos Papadopoulos · groups@example.com",
      generalRequests: "hello@example.com",
      pricing: "Tiered net by season.",
      paymentProcess: "Deposit + balance 30 days.",
      commissionProcess: "Per program addendum.",
      afterHours: "Email-only weekends",
    },
    {
      productId: "cat-dmc-greece-003",
      name: "Eclectic Greece DMC",
      preferred: true,
      endorsementCount: 11,
      freshnessTone: "green",
      latitude: 37.9755,
      longitude: 23.7348,
      reppedBy: "Virtuoso Greece",
      website: "https://example.com/eclectic-greece",
      keyContact: "Elena V. · elena@example.com",
      generalRequests: "ops@eclecticgreece.example.com",
      pricing: "Itemized net; series contracts available.",
      paymentProcess: "Wire per confirmation; Amex with 4% surcharge.",
      commissionProcess: "11% net of DMC invoice; paid within 45 days of travel.",
      afterHours: "Duty mobile +30 697 000 1111 (active files)",
      notes: "Preferred for mainland + islands combo; strong archaeology guides.",
    },
    {
      productId: "cat-dmc-greece-004",
      name: "Mediterranean Pathways",
      preferred: false,
      freshnessTone: "amber",
      latitude: 35.3387,
      longitude: 25.1442,
      reppedBy: "EU inbound desk",
      website: "https://example.com/med-pathways",
      keyContact: "Dimitris S. · dimitris@example.com",
      generalRequests: "bookings@medpathways.example.com",
      pricing: "Package and FIT; min 4 nights high season.",
      paymentProcess: "Deposit 30% / balance 45 days pre-arrival.",
      commissionProcess: "10% posted on supplier statement.",
      afterHours: "Sat emergency email only",
    },
    {
      productId: "cat-dmc-greece-005",
      name: "Cyclades Concierge DMC",
      preferred: false,
      endorsementCount: 3,
      latitude: 37.4467,
      longitude: 25.3289,
      reppedBy: "Island programs",
      website: "https://example.com/cyclades-concierge",
      keyContact: "Yannis K. · yannis@example.com",
      generalRequests: "hello@cycladesconcierge.example.com",
      pricing: "Net island-hopping bundles.",
      paymentProcess: "Wire; EUR only.",
      commissionProcess: "9–11% depending on season.",
      afterHours: "WhatsApp group for active trips",
      feedback: "Excellent ferry rebooking during Meltemi delays last season.",
    },
    {
      productId: "cat-dmc-greece-006",
      name: "Ionian Select DMC",
      preferred: false,
      latitude: 39.6243,
      longitude: 19.9217,
      reppedBy: "West coast specialists",
      website: "https://example.com/ionian-select",
      keyContact: "Sofia M. · sofia@example.com",
      generalRequests: "requests@ionianselect.example.com",
      pricing: "Net villa + crewed charter bundles.",
      paymentProcess: "50/50 split deposit and pre-arrival.",
      commissionProcess: "Per charter addendum.",
      afterHours: "Local office 09:00–20:00 EET",
    },
  ],
  restaurants: {
    Athens: [
      {
        productId: "cat-rest-gr-001",
        name: "Spondi",
        url: "https://example.com/spondi",
        note: "Two Michelin · advance booking",
        endorsementCount: 5,
        freshnessTone: "green",
        latitude: 37.9842,
        longitude: 23.7413,
      },
      {
        productId: "cat-rest-gr-002",
        name: "Nolan",
        note: "Casual fine dining, Psiri",
        latitude: 37.9786,
        longitude: 23.7267,
      },
      {
        productId: "cat-rest-gr-003",
        name: "CTC",
        url: "https://example.com/ctc",
        note: "Contemporary tasting menu",
        latitude: 37.976,
        longitude: 23.725,
      },
      {
        productId: "cat-rest-gr-004",
        name: "Funky Gourmet",
        note: "Kerameikos · creative Greek",
        latitude: 37.972,
        longitude: 23.721,
      },
      {
        productId: "cat-rest-gr-005",
        name: "Varoulko Seaside",
        note: "Piraeus · seafood",
        latitude: 37.942,
        longitude: 23.646,
      },
      {
        productId: "cat-rest-gr-006",
        name: "Oinomageiremata",
        note: "Traditional · Mets",
        latitude: 37.968,
        longitude: 23.741,
      },
      {
        productId: "cat-rest-gr-007",
        name: "Soil",
        url: "https://example.com/soil",
        note: "Farm-to-table",
        latitude: 37.981,
        longitude: 23.738,
      },
      {
        productId: "cat-rest-gr-008",
        name: "Birdman",
        note: "Grill & wine · downtown",
        latitude: 37.979,
        longitude: 23.732,
      },
      {
        productId: "cat-rest-gr-009",
        name: "Hytra",
        note: "Acropolis views · rooftop",
        latitude: 37.978,
        longitude: 23.728,
      },
      {
        productId: "cat-rest-gr-010",
        name: "Dopios",
        note: "Neighborhood wine bar",
        latitude: 37.976,
        longitude: 23.731,
      },
    ],
    "Athens Vicinity": [
      {
        productId: "cat-rest-gr-011",
        name: "Ithaki Vouliagmeni",
        note: "Seaside · Riviera",
        latitude: 37.858,
        longitude: 23.754,
      },
      {
        productId: "cat-rest-gr-012",
        name: "Ark",
        note: "Voula · seafood",
        latitude: 37.842,
        longitude: 23.758,
      },
      {
        productId: "cat-rest-gr-013",
        name: "Matsuhisa Athens",
        note: "Astir · Japanese",
        latitude: 37.856,
        longitude: 23.753,
      },
      {
        productId: "cat-rest-gr-014",
        name: "Blue Fish Vouliagmeni",
        note: "Casual fish",
        latitude: 37.859,
        longitude: 23.751,
      },
    ],
    Santorini: [
      {
        productId: "cat-rest-gr-015",
        name: "Selene",
        url: "https://example.com/selene",
        note: "Pyrgos",
        endorsementCount: 8,
        freshnessTone: "green",
        latitude: 36.407,
        longitude: 25.432,
      },
      {
        productId: "cat-rest-gr-016",
        name: "Metaxy Mas",
        note: "Tavern · Megalochori",
        latitude: 36.423,
        longitude: 25.441,
      },
      {
        productId: "cat-rest-gr-017",
        name: "Katina",
        note: "Ammoudi · fish",
        latitude: 36.461,
        longitude: 25.374,
      },
      {
        productId: "cat-rest-gr-018",
        name: "Lycabettus Restaurant",
        note: "Oia · sunset",
        latitude: 36.462,
        longitude: 25.375,
      },
      {
        productId: "cat-rest-gr-019",
        name: "Aktaion",
        note: "Fira · classic",
        latitude: 36.42,
        longitude: 25.431,
      },
      {
        productId: "cat-rest-gr-020",
        name: "Panorama",
        note: "Firostefani views",
        latitude: 36.423,
        longitude: 25.433,
      },
      {
        productId: "cat-rest-gr-021",
        name: "Roka",
        note: "Oia · casual",
        latitude: 36.462,
        longitude: 25.376,
      },
    ],
    Mykonos: [
      {
        productId: "cat-rest-gr-022",
        name: "Kiki's Tavern",
        note: "Agios Sostis · lunch only",
        latitude: 37.449,
        longitude: 25.328,
      },
      {
        productId: "cat-rest-gr-023",
        name: "Nobu Mykonos",
        note: "Belvedere",
        latitude: 37.445,
        longitude: 25.329,
      },
      {
        productId: "cat-rest-gr-024",
        name: "Interni",
        note: "Garden dining",
        latitude: 37.446,
        longitude: 25.327,
      },
      {
        productId: "cat-rest-gr-025",
        name: "Matsuhisa Mykonos",
        note: "Sea views",
        latitude: 37.444,
        longitude: 25.33,
      },
      {
        productId: "cat-rest-gr-026",
        name: "Bakalo",
        note: "Chora · Greek",
        latitude: 37.447,
        longitude: 25.326,
      },
      {
        productId: "cat-rest-gr-027",
        name: "Scorpios",
        note: "Paraga · beach club",
        latitude: 37.431,
        longitude: 25.328,
      },
    ],
    Crete: [
      {
        productId: "cat-rest-gr-028",
        name: "Peskesi",
        note: "Heraklion region · Cretan cuisine",
        latitude: 35.338,
        longitude: 25.143,
      },
      {
        productId: "cat-rest-gr-029",
        name: "Chrisostomos",
        note: "Chania · wood oven",
        latitude: 35.513,
        longitude: 24.018,
      },
      {
        productId: "cat-rest-gr-030",
        name: "Salis",
        note: "Chania harbour",
        latitude: 35.517,
        longitude: 24.017,
      },
      {
        productId: "cat-rest-gr-031",
        name: "Dounias",
        note: "Drakona · slow food",
        latitude: 35.298,
        longitude: 24.201,
      },
      {
        productId: "cat-rest-gr-032",
        name: "Pleiades",
        note: "Elounda · fine dining",
        latitude: 35.256,
        longitude: 25.722,
      },
      {
        productId: "cat-rest-gr-033",
        name: "Ntounias",
        note: "Village cooking",
        latitude: 35.24,
        longitude: 24.12,
      },
    ],
    Paros: [
      {
        productId: "cat-rest-gr-034",
        name: "Barbarossa",
        note: "Naoussa harbour",
        latitude: 37.124,
        longitude: 25.237,
      },
      {
        productId: "cat-rest-gr-035",
        name: "Sigi Ikthios",
        note: "Naoussa · fish",
        latitude: 37.125,
        longitude: 25.236,
      },
      {
        productId: "cat-rest-gr-036",
        name: "Tsitsanis",
        note: "Lefkes · taverna",
        latitude: 37.045,
        longitude: 25.18,
      },
      {
        productId: "cat-rest-gr-037",
        name: "Soso",
        note: "Parikia · modern Greek",
        latitude: 37.086,
        longitude: 25.15,
      },
    ],
    Peloponnese: [
      {
        productId: "cat-rest-gr-038",
        name: "Tetramythos",
        note: "Achaia · winery restaurant",
        latitude: 38.246,
        longitude: 22.084,
      },
      {
        productId: "cat-rest-gr-039",
        name: "Kinsterna",
        note: "Monemvasia · estate",
        latitude: 36.687,
        longitude: 23.056,
      },
      {
        productId: "cat-rest-gr-040",
        name: "Yialos",
        note: "Nafplio · harbour",
        latitude: 37.563,
        longitude: 22.806,
      },
      {
        productId: "cat-rest-gr-041",
        name: "Maris",
        note: "Costa Navarino",
        latitude: 37.18,
        longitude: 21.68,
      },
    ],
    Thessaloniki: [
      {
        productId: "cat-rest-gr-042",
        name: "Duck Private Cheffing",
        note: "Tasting menus",
        latitude: 40.632,
        longitude: 22.942,
      },
      {
        productId: "cat-rest-gr-043",
        name: "Mavri Thalassa",
        note: "Seafood institution",
        latitude: 40.635,
        longitude: 22.945,
      },
      {
        productId: "cat-rest-gr-044",
        name: "Charoupi",
        note: "Modern Anatolian",
        latitude: 40.628,
        longitude: 22.951,
      },
      {
        productId: "cat-rest-gr-045",
        name: "Sebrico",
        note: "Wine bar · Ladadika",
        latitude: 40.636,
        longitude: 22.939,
      },
    ],
  },
  hotels: {
    Collections: [
      {
        productId: "cat-hotel-gr-001",
        name: "Mystique, a Luxury Collection Hotel",
        contact: "Reservations · reservations@example.com",
        repFirm: "Luxury Collection rep · NA desk",
        url: "https://example.com/mystique",
        properties: ["Santorini"],
        endorsementCount: 7,
        freshnessTone: "green",
        latitude: 36.462,
        longitude: 25.375,
      },
      {
        productId: "cat-hotel-gr-002",
        name: "Domes of Corfu, Autograph Collection",
        contact: "Sales · sales@example.com",
        repFirm: "Marriott Lux",
        url: "https://example.com/domes-corfu",
        properties: ["Domes White Coast (Milos)", "Domes Zeen (Corfu)"],
        latitude: 39.624,
        longitude: 19.922,
      },
      {
        productId: "cat-hotel-gr-003",
        name: "One&Only Aesthesis",
        contact: "Partner desk",
        repFirm: "O&O preferred",
        url: "https://example.com/oneonly-aesthesis",
        properties: ["Glyfada coast"],
        latitude: 37.858,
        longitude: 23.754,
      },
    ],
    Mykonos: [
      {
        productId: "cat-hotel-gr-004",
        name: "Bill & Coo Suites",
        contact: "VIP desk",
        repFirm: "Small Luxury Hotels",
        url: "https://example.com/billcoo",
        note: "Adults-oriented",
        latitude: 37.448,
        longitude: 25.327,
      },
      {
        productId: "cat-hotel-gr-005",
        name: "Cavo Tagoo",
        contact: "Reservations",
        url: "https://example.com/cavotagoo",
        latitude: 37.449,
        longitude: 25.33,
      },
      {
        productId: "cat-hotel-gr-006",
        name: "Myconian Ambassador",
        contact: "Groups",
        repFirm: "Relais & Châteaux liaison",
        note: "Platis Gialos",
        latitude: 37.441,
        longitude: 25.325,
      },
    ],
    Santorini: [
      {
        productId: "cat-hotel-gr-007",
        name: "Canaves Oia Epitome",
        contact: "Sales",
        repFirm: "Preferred portfolio",
        properties: ["Epitome", "Canaves suites"],
        latitude: 36.461,
        longitude: 25.376,
      },
      {
        productId: "cat-hotel-gr-008",
        name: "Grace Hotel Santorini",
        contact: "Luxury sales",
        url: "https://example.com/grace-santorini",
        latitude: 36.423,
        longitude: 25.431,
      },
      {
        productId: "cat-hotel-gr-009",
        name: "Katikies Santorini",
        contact: "Reservations",
        note: "Oia cliff",
        latitude: 36.462,
        longitude: 25.375,
      },
    ],
    Athens: [
      {
        productId: "cat-hotel-gr-010",
        name: "Hotel Grande Bretagne",
        contact: "Luxury sales",
        repFirm: "LHW",
        url: "https://example.com/gb",
        latitude: 37.976,
        longitude: 23.735,
      },
      {
        productId: "cat-hotel-gr-011",
        name: "Four Seasons Astir Palace",
        contact: "Partner services",
        url: "https://example.com/fs-astir",
        latitude: 37.858,
        longitude: 23.754,
      },
      {
        productId: "cat-hotel-gr-012",
        name: "King George",
        contact: "City desk",
        note: "Syntagma",
        latitude: 37.975,
        longitude: 23.734,
      },
    ],
    "Paros & Milos": [
      {
        productId: "cat-hotel-gr-013",
        name: "Parilio Hotel Paros",
        contact: "Bookings",
        repFirm: "Design hotels",
        note: "Naoussa adjacency",
        latitude: 37.123,
        longitude: 25.238,
      },
      {
        productId: "cat-hotel-gr-014",
        name: "White Coast Pool Suites",
        contact: "Sales",
        properties: ["Milos"],
        latitude: 36.722,
        longitude: 24.451,
      },
    ],
    Crete: [
      {
        productId: "cat-hotel-gr-015",
        name: "Blue Palace Elounda",
        contact: "Luxury desk",
        url: "https://example.com/blue-palace",
        latitude: 35.256,
        longitude: 25.722,
      },
      {
        productId: "cat-hotel-gr-016",
        name: "Domes Zeen Chania",
        contact: "Reservations",
        note: "Family-friendly",
        latitude: 35.518,
        longitude: 24.02,
      },
    ],
    Peloponnese: [
      {
        productId: "cat-hotel-gr-017",
        name: "The Westin Resort Costa Navarino",
        contact: "Golf & spa desk",
        repFirm: "Marriott STARS",
        url: "https://example.com/costa-navarino",
        latitude: 37.18,
        longitude: 21.68,
      },
    ],
  },
  yachtCompanies: [
    {
      productId: "cat-yacht-gr-001",
      name: "Ionian Charter Co.",
      contact: "charter@example.com · +30 210 111 2222",
      url: "https://example.com/ionian-charter",
      latitude: 37.9402,
      longitude: 23.6427,
      destinations: "Ionian & Saronic day charters",
      contactName: "Marina Ioannou",
      email: "charter@example.com",
      phone: "+30 210 111 2222",
    },
  ],
  tourismRegions: [
    {
      name: "National",
      description: "Visit Greece — country-level planning and campaigns.",
      contact: "GNTO North America · travel@gnto.example.com · +1 212 555 0199",
      links: [
        { label: "Visit Greece", url: "https://www.visitgreece.gr/" },
        { label: "GNTO", url: "https://www.gnto.gov.gr/" },
      ],
    },
    {
      name: "Cyclades",
      description: "Island hopping, ferries, and regional highlights.",
      contact: "Cyclades Prefecture tourism · info@cyclades.example.com",
      links: [{ label: "Cyclades tourism", url: "https://example.com/cyclades" }],
    },
  ],
  documents: [
    { name: "Greece — advisor commission cheat sheet", type: "pdf", kvDocumentId: "doc-kv-dest-gr-1" },
    { name: "Island ferry timing guidelines", type: "docx", kvDocumentId: "doc-kv-dest-gr-2" },
    { name: "Peak season hotel release calendar", type: "xlsx", kvDocumentId: "doc-kv-dest-gr-3" },
    { name: "GNTO marketing toolkit — Greece 2026", type: "pdf", kvDocumentId: "doc-kv-dest-gr-4" },
    { name: "Santorini & Mykonos vendor contacts", type: "docx", kvDocumentId: "doc-kv-dest-gr-5" },
    { name: "Mainland driving times & tolls", type: "pdf", kvDocumentId: "doc-kv-dest-gr-6" },
    { name: "Yacht charter terms & insurance checklist", type: "pdf", kvDocumentId: "doc-kv-dest-gr-7" },
  ],
  mapCenter: { lat: 37.9838, lng: 23.7275, zoom: 6 },
  tripReports: [
    {
      id: stableDestinationUuid("greece-trip-report-sarah-2026"),
      advisorId: "adv-demo-sarah",
      advisorName: "Sarah T.",
      travelDates: { start: "2026-03-08", end: "2026-03-15" },
      subRegionsVisited: ["Santorini", "Mykonos", "Athens"],
      productReferences: [
        { productId: "cat-dmc-greece-001", label: "Aegean Elite DMC" },
        { productId: "cat-hotel-gr-007", label: "Canaves Oia Epitome" },
      ],
      content:
        "**Just back** — Santorini ferries were smooth mid-week. Advise clients to book sunset tables 30+ days ahead in Oia. Aegean Elite reconfirmed drivers within 2 hours when winds shifted our hydrofoil.",
      helpfulCount: 14,
      createdAt: "2026-03-18T10:00:00.000Z",
    },
    {
      id: stableDestinationUuid("greece-trip-report-alex-2025"),
      advisorId: "adv-demo-alex",
      advisorName: "Alex Chambers",
      travelDates: { start: "2025-09-02", end: "2025-09-12" },
      subRegionsVisited: ["Crete", "Athens"],
      productReferences: [{ productId: "cat-rest-gr-028", label: "Peskesi" }],
      content:
        "Crete driving times are underestimated in most PDFs — pad 25% for mountain routes. Peskesi still a standout for foodie clients.",
      helpfulCount: 9,
      createdAt: "2025-09-15T14:20:00.000Z",
    },
  ],
};

const ITALY: Destination = {
  slug: "italy",
  name: "Italy",
  tagline: "Regional specialists from the Dolomites to Sicily.",
  heroImage: heroImageUrlForDestination("italy"),
  description: "Skeleton entry — expand with Claromentis parity.",
  subRegions: ["Rome", "Florence", "Amalfi", "Sicily"],
  dmcPartners: [
    {
      productId: "cat-dmc-it-001",
      name: "Italia Curata DMC",
      preferred: true,
      reppedBy: "EU desk",
      website: "https://example.com/italia-curata",
      keyContact: "Giulia R.",
      generalRequests: "italy@example.com",
    },
  ],
  restaurants: {
    Rome: [{ productId: "cat-rest-it-001", name: "Roscioli", note: "Testaccio" }],
  },
  hotels: {
    Rome: [{ productId: "cat-hotel-it-001", name: "Hotel de Russie", url: "https://example.com/russie" }],
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
  description: "Skeleton entry — expand with Claromentis parity.",
  subRegions: ["Paris", "Provence", "French Alps", "Loire"],
  dmcPartners: [
    {
      productId: "cat-dmc-fr-001",
      name: "Maison Routes DMC",
      preferred: false,
      website: "https://example.com/maison-routes",
      keyContact: "Claire D.",
    },
  ],
  restaurants: {
    Paris: [{ productId: "cat-rest-fr-001", name: "Septime", note: "Book weeks ahead" }],
  },
  hotels: {
    Paris: [{ productId: "cat-hotel-fr-001", name: "Le Bristol Paris", url: "https://example.com/bristol" }],
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
  description: "Skeleton entry — expand with Claromentis parity.",
  subRegions: ["Tokyo", "Kyoto", "Hokkaido", "Okinawa"],
  dmcPartners: [
    {
      productId: "cat-dmc-jp-001",
      name: "Nippon Pathways",
      preferred: true,
      keyContact: "Kenji M.",
      generalRequests: "jp@example.com",
    },
  ],
  restaurants: {
    Tokyo: [{ productId: "cat-rest-jp-001", name: "Den", note: "Kanda · reservation lottery" }],
  },
  hotels: {
    Tokyo: [{ productId: "cat-hotel-jp-001", name: "Aman Tokyo", url: "https://example.com/aman-tokyo" }],
  },
  tourismRegions: [
    {
      name: "National",
      links: [{ label: "JNTO", url: "https://www.japan.travel/en/us/" }],
    },
  ],
  documents: [{ name: "JR pass quick reference", type: "pdf" }],
};

/**
 * Canonical Claromentis-parity destination portals (stub until curated).
 * Slugs are stable — do not rename once published.
 */
const OTHER_META: { slug: string; name: string; tagline: string }[] = [
  { slug: "africa", name: "Africa", tagline: "Safari, cities, and coastlines — content coming soon." },
  { slug: "antarctica", name: "Antarctica", tagline: "Expedition planning — content coming soon." },
  { slug: "arctic", name: "Arctic", tagline: "Polar journeys — content coming soon." },
  { slug: "argentina", name: "Argentina", tagline: "Patagonia to Buenos Aires." },
  { slug: "australia", name: "Australia", tagline: "Coastal cities and Outback." },
  { slug: "austria", name: "Austria", tagline: "Alpine culture & cities — distinct from Switzerland." },
  { slug: "baltics", name: "The Baltics", tagline: "Estonia, Lithuania, Latvia." },
  { slug: "bermuda", name: "Bermuda", tagline: "Island escape — content coming soon." },
  { slug: "bhutan", name: "Bhutan", tagline: "Himalayan kingdom journeys." },
  { slug: "brazil", name: "Brazil", tagline: "Amazon to Rio." },
  { slug: "canada", name: "Canada", tagline: "Rockies, cities, and Maritimes." },
  { slug: "caribbean", name: "Caribbean", tagline: "Island hopping overview." },
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
  { slug: "tahiti", name: "Tahiti", tagline: "French Polynesia escapes." },
  { slug: "turkey", name: "Turkey", tagline: "Istanbul to Cappadocia." },
  { slug: "uae", name: "UAE", tagline: "Dubai, Abu Dhabi & desert." },
  { slug: "uruguay", name: "Uruguay", tagline: "Wine & coast." },
  { slug: "usa", name: "USA", tagline: "National parks & gateways." },
];

function buildStub(m: { slug: string; name: string; tagline: string }): Destination {
  return stubDestination(m.slug, m.name, m.tagline, heroImageUrlForDestination(m.slug));
}

const STUBS = OTHER_META.map(buildStub);

const BY_SLUG: Record<string, Destination> = Object.fromEntries(
  [GREECE, ITALY, FRANCE, JAPAN, ...STUBS].map((d) => [d.slug, d]),
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
