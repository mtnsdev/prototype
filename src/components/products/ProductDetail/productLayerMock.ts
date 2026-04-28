/**
 * Mock layered data (advisor notes, partner programs) for product detail.
 * In production this would come from API per product + advisor.
 */

import { TEAM_EVERYONE_ID } from "@/types/teams";

export type AdvisorLayerMock = {
  contact: string;
  notes: string;
  personalRating: number;
};

export type PartnerProgramMock = {
  id: string;
  name: string;
  benefits: string;
  commission?: string;
  /** Enable-curated vs team-scoped */
  scope: "enable" | string;
  expires: string | null;
  commissionContact?: { name: string; email: string } | null;
};

const GEORGE_V_ADVISOR: AdvisorLayerMock = {
  contact: "Marc (GM) — marc.dubois@fourseasons.com — mention you are with TravelLustre",
  notes:
    "Pool area can get crowded in August. Request rooms in the east wing for quieter experience. Spa is world-class — always book the hammam for VICs.",
  personalRating: 4,
};

const DEFAULT_PROGRAMS: PartnerProgramMock[] = [
  {
    id: "pp-001",
    name: "Virtuoso Preferred",
    benefits:
      "Room upgrade on availability, daily breakfast for 2, $100 hotel credit, early check-in / late check-out.",
    commission: "10% on rack rate",
    scope: TEAM_EVERYONE_ID,
    expires: "2026-12-31",
    commissionContact: { name: "Rebecca Torres", email: "rtorres@virtuoso.com" },
  },
  {
    id: "pp-002",
    name: "Four Seasons Preferred Partner",
    benefits: "Complimentary 3rd night, airport transfers, welcome amenity, VIP treatment.",
    commission: "12% net",
    scope: TEAM_EVERYONE_ID,
    expires: null,
    commissionContact: null,
  },
];

const DMC_BALI_ADVISOR: AdvisorLayerMock = {
  contact: "Dima direct — dima@baliluxury.com — WhatsApp +62 812 xxxx",
  notes: "Very responsive. Always gives us priority. Prefers WhatsApp over email.",
  personalRating: 5,
};

const EMPTY_ADVISOR: AdvisorLayerMock = { contact: "", notes: "", personalRating: 0 };

export function getProductLayerMock(productId: string): {
  advisorDefaults: AdvisorLayerMock;
  partnerPrograms: PartnerProgramMock[];
  pendingSuggestions: number;
} {
  if (productId === "prod-enable-001") {
    return {
      advisorDefaults: GEORGE_V_ADVISOR,
      partnerPrograms: [...DEFAULT_PROGRAMS],
      pendingSuggestions: 2,
    };
  }
  if (productId === "prod-dmc-001") {
    return {
      advisorDefaults: DMC_BALI_ADVISOR,
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }

  /** Directory catalog ids (`productDirectoryMock`) — layered notes for any product. */
  if (productId === "prod_001") {
    return {
      advisorDefaults: {
        contact: "Yuki — yuki@aman.com",
        notes: "Request high floors for city views. Onsen books out — reserve at booking.",
        personalRating: 5,
      },
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }
  if (productId === "prod_005") {
    return {
      advisorDefaults: DMC_BALI_ADVISOR,
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }
  if (productId === "prod-enable-003") {
    return {
      advisorDefaults: { ...EMPTY_ADVISOR, personalRating: 0 },
      partnerPrograms: [
        {
          id: "pp-oo-1",
          name: "Virtuoso Preferred",
          benefits: "Breakfast, resort credit, upgrade subject to availability.",
          commission: "10%",
          scope: "enable",
          expires: null,
        },
      ],
      pendingSuggestions: 0,
    };
  }
  /** Directory catalog ids (`productDirectoryMock`) — exclude API fake `prod-enable-*` so they use the default branch below. */
  if (productId.startsWith("prod_") || (productId.startsWith("prod-") && !productId.startsWith("prod-enable-"))) {
    return {
      advisorDefaults: { ...EMPTY_ADVISOR },
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }
  return {
    advisorDefaults: { ...EMPTY_ADVISOR },
    partnerPrograms: productId.startsWith("prod-enable") ? [DEFAULT_PROGRAMS[0]] : [],
    pendingSuggestions: productId === "prod-enable-005" ? 1 : 0,
  };
}
