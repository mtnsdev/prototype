import type { RepFirm, RepFirmProductLink } from "@/types/rep-firm";

export const MOCK_REP_FIRMS: RepFirm[] = [
  {
    id: "rf-dominique-debay",
    name: "Dominique Debay Collection",
    tagline: "Asia-Pacific luxury hotel & villa specialist",
    website: "https://www.dominiquedebay.com",
    regions: ["Asia Pacific", "Indian Ocean"],
    productTypes: ["hotel", "villa"],
    propertyCount: 35,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-lush-experiences",
    name: "LUSH Experiences",
    tagline: "Curate · Inspire · Influence",
    website: "https://www.lushexperiences.com",
    regions: ["Europe", "Middle East", "Caribbean"],
    productTypes: ["hotel", "villa", "restaurant"],
    propertyCount: 40,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-index-select",
    name: "Index Select",
    tagline: "Boutique global hospitality agency",
    website: "https://www.indexselect.com",
    regions: ["Americas", "Caribbean"],
    productTypes: ["hotel", "villa"],
    propertyCount: 22,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-the-dmc-collection",
    name: "The DMC Collection",
    tagline: "Premier destination management partnerships",
    regions: ["Europe", "Asia"],
    productTypes: ["dmc", "experience"],
    propertyCount: 45,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-cruise-specialists-international",
    name: "Cruise Specialists International",
    tagline: "Global luxury cruise representation",
    regions: ["Global"],
    productTypes: ["cruise"],
    propertyCount: 18,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-nota-bene-global",
    name: "Nota Bene Global",
    tagline: "Ultra-luxury bespoke travel for UHNW clients",
    website: "https://www.notabeneglobal.com",
    regions: ["Europe", "Americas"],
    productTypes: ["hotel", "villa"],
    propertyCount: 31,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-traveller-made",
    name: "Traveller Made",
    tagline: "Global luxury travel community & representation",
    website: "https://www.travellermade.com",
    regions: ["Global"],
    productTypes: ["hotel", "experience", "restaurant"],
    propertyCount: 55,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-beyond-green",
    name: "Beyond Green",
    tagline: "Eco-first prestigious luxury travel",
    website: "https://www.staybeyondgreen.com",
    regions: ["Global"],
    productTypes: ["hotel", "wellness"],
    propertyCount: 50,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-kiwi-collection",
    name: "Kiwi Collection",
    tagline: "Hand-picked luxury hotels worldwide",
    website: "https://www.kiwicollection.com",
    regions: ["Global"],
    productTypes: ["hotel", "villa"],
    propertyCount: 40,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-preferred-hotels-resorts",
    name: "Preferred Hotels & Resorts",
    tagline: "World's largest independent hotel brand",
    website: "https://www.preferredhotels.com",
    regions: ["Global"],
    productTypes: ["hotel"],
    propertyCount: 650,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-slh",
    name: "Small Luxury Hotels (SLH)",
    tagline: "Independently spirited luxury hotels",
    website: "https://www.slh.com",
    regions: ["Global"],
    productTypes: ["hotel"],
    propertyCount: 520,
    scope: "enable",
    status: "active",
  },
  {
    id: "rf-lhw",
    name: "Leading Hotels of the World (LHW)",
    tagline: "Uncommon luxury since 1928",
    website: "https://www.lhw.com",
    regions: ["Global"],
    productTypes: ["hotel"],
    propertyCount: 400,
    scope: "enable",
    status: "active",
  },
];

export const MOCK_REP_FIRM_PRODUCT_LINKS: Record<string, RepFirmProductLink[]> = {
  prod_001: [
    {
      id: "rfl-prod-001-debay",
      repFirmId: "rf-dominique-debay",
      repFirmName: "Dominique Debay Collection",
      contactName: "Yuki Saito",
      contactEmail: "yuki.saito@dominiquedebay.com",
      contactPhone: "+81 3 1234 5678",
      scope: "enable",
      status: "active",
    },
  ],
  prod_002: [
    {
      id: "rfl-prod-002-lush",
      repFirmId: "rf-lush-experiences",
      repFirmName: "LUSH Experiences",
      contactName: "Camille Durand",
      contactEmail: "camille@lushexperiences.com",
      scope: "enable",
      status: "active",
    },
  ],
  prod_003: [
    {
      id: "rfl-prod-003-dmc",
      repFirmId: "rf-the-dmc-collection",
      repFirmName: "The DMC Collection",
      contactName: "James Okello",
      contactEmail: "safari@thedmccollection.com",
      scope: "enable",
      status: "active",
    },
  ],
  prod_004: [
    {
      id: "rfl-prod-004-debay",
      repFirmId: "rf-dominique-debay",
      repFirmName: "Dominique Debay Collection",
      contactName: "Marine Debay",
      contactEmail: "marine@dominiquedebay.com",
      notes: "Primary contact for Indian Ocean & ultra-luxury cruise fit.",
      scope: "enable",
      status: "active",
    },
  ],
  prod_005: [
    {
      id: "rfl-prod-005-nota-bene",
      repFirmId: "rf-nota-bene-global",
      repFirmName: "Nota Bene Global",
      contactName: "Alexandra Vaughn",
      contactEmail: "alexandra.v@notabeneglobal.com",
      scope: "enable",
      status: "active",
    },
  ],
  prod_006: [
    {
      id: "rfl-prod-006-lush",
      repFirmId: "rf-lush-experiences",
      repFirmName: "LUSH Experiences",
      contactName: "Sofia Mendez",
      contactEmail: "sofia@lushexperiences.com",
      scope: "enable",
      status: "active",
    },
    {
      id: "rfl-prod-006-nota-bene",
      repFirmId: "rf-nota-bene-global",
      repFirmName: "Nota Bene Global",
      contactName: "Isabel Grant",
      contactEmail: "isabel.g@notabeneglobal.com",
      notes: "Covers UHNW direct bookings; coordinate with LUSH for chain-wide rate loads.",
      scope: "enable",
      status: "active",
    },
  ],
  prod_008: [
    {
      id: "rfl-prod-008-csi",
      repFirmId: "rf-cruise-specialists-international",
      repFirmName: "Cruise Specialists International",
      contactName: "Michael Chen",
      contactEmail: "m.chen@cruisespecialists.example",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-villa-001": [
    {
      id: "rfl-prod-villa-kiwi",
      repFirmId: "rf-kiwi-collection",
      repFirmName: "Kiwi Collection",
      contactEmail: "trade@kiwicollection.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-rest-001": [
    {
      id: "rfl-prod-rest-traveller-made",
      repFirmId: "rf-traveller-made",
      repFirmName: "Traveller Made",
      contactName: "Reservation desk",
      contactEmail: "mice@travellermade.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-well-001": [
    {
      id: "rfl-prod-well-beyond-green",
      repFirmId: "rf-beyond-green",
      repFirmName: "Beyond Green",
      contactEmail: "wellness@staybeyondgreen.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-trans-001": [
    {
      id: "rfl-prod-trans-nota-bene",
      repFirmId: "rf-nota-bene-global",
      repFirmName: "Nota Bene Global",
      contactEmail: "aviation@notabeneglobal.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-amanvari": [
    {
      id: "rfl-prod-amanvari-preferred",
      repFirmId: "rf-preferred-hotels-resorts",
      repFirmName: "Preferred Hotels & Resorts",
      contactEmail: "luxury.sales@preferredhotels.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-waldorf-london": [
    {
      id: "rfl-prod-waldorf-slh",
      repFirmId: "rf-slh",
      repFirmName: "Small Luxury Hotels (SLH)",
      contactEmail: "traveltrade@slh.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-four-seasons-mykonos": [
    {
      id: "rfl-prod-fs-mykonos-lhw",
      repFirmId: "rf-lhw",
      repFirmName: "Leading Hotels of the World (LHW)",
      contactEmail: "advisors@lhw.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-six-senses-london": [
    {
      id: "rfl-prod-six-senses-slh",
      repFirmId: "rf-slh",
      repFirmName: "Small Luxury Hotels (SLH)",
      contactEmail: "traveltrade@slh.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-orient-express-venezia": [
    {
      id: "rfl-prod-orient-preferred",
      repFirmId: "rf-preferred-hotels-resorts",
      repFirmName: "Preferred Hotels & Resorts",
      contactEmail: "europe@preferredhotels.com",
      scope: "enable",
      status: "active",
    },
  ],
  "prod-seven-seas-prestige": [
    {
      id: "rfl-prod-seven-seas-csi",
      repFirmId: "rf-cruise-specialists-international",
      repFirmName: "Cruise Specialists International",
      contactName: "Regent desk",
      contactEmail: "regent@cruisespecialists.example",
      scope: "enable",
      status: "active",
    },
  ],
};

export function getRepFirmLinksForProduct(productId: string): RepFirmProductLink[] {
  return MOCK_REP_FIRM_PRODUCT_LINKS[productId] ?? [];
}

export function getRepFirmById(id: string): RepFirm | undefined {
  return MOCK_REP_FIRMS.find((f) => f.id === id);
}

/** Prefer live registry (Products / Settings); fall back to seed mock. */
export function getRepFirmByIdWithOverlay(id: string, overlay?: RepFirm[] | null): RepFirm | undefined {
  if (overlay?.length) {
    const hit = overlay.find((f) => f.id === id);
    if (hit) return hit;
  }
  return getRepFirmById(id);
}
