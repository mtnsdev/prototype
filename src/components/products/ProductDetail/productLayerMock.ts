/**
 * Mock layered data (advisor notes, agency thread, partner programs) for product detail.
 * In production this would come from API per product + advisor.
 */

import { TEAM_EVERYONE_ID } from "@/types/teams";

export type AdvisorLayerMock = {
  contact: string;
  notes: string;
  personalRating: number;
};

export type AgencyNoteMock = {
  id: string;
  content: string;
  author: string;
  timeAgo: string;
  pinned?: boolean;
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

const GEORGE_V_AGENCY: AgencyNoteMock[] = [
  {
    id: "an-001",
    content:
      "Feels more like a 4-star despite the 5-star brochure rating. Rooms are beautiful but service is inconsistent — especially at dinner.",
    author: "Marco Pellegrini",
    timeAgo: "2 weeks ago",
  },
  {
    id: "an-002",
    content:
      "Partner program renewed for 2026. 15% commission on rack rate, complimentary upgrade on availability. Contact: partnerships@hotel.com",
    author: "Kristin Summers",
    timeAgo: "1 month ago",
    pinned: true,
  },
  {
    id: "an-003",
    content: "Great for honeymoons. Not ideal for families with young kids — no kids club.",
    author: "James Whitfield",
    timeAgo: "3 months ago",
  },
];

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

const DMC_BALI_AGENCY: AgencyNoteMock[] = [
  {
    id: "an-dmc-001",
    content:
      "Standard commission 12% on rack rate. 15% for bookings over $10k. Net 30 payment. Best DMC we work with in Bali — always recommend.",
    author: "Kristin Summers",
    timeAgo: "1 month ago",
    pinned: true,
  },
];

const EMPTY_ADVISOR: AdvisorLayerMock = { contact: "", notes: "", personalRating: 0 };

export function getProductLayerMock(productId: string): {
  advisorDefaults: AdvisorLayerMock;
  agencyNotes: AgencyNoteMock[];
  partnerPrograms: PartnerProgramMock[];
  pendingSuggestions: number;
} {
  if (productId === "prod-enable-001") {
    return {
      advisorDefaults: GEORGE_V_ADVISOR,
      agencyNotes: [...GEORGE_V_AGENCY],
      partnerPrograms: [...DEFAULT_PROGRAMS],
      pendingSuggestions: 2,
    };
  }
  if (productId === "prod-dmc-001") {
    return {
      advisorDefaults: DMC_BALI_ADVISOR,
      agencyNotes: [...DMC_BALI_AGENCY],
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
      agencyNotes: [
        {
          id: "an-prod001-1",
          content:
            "Strong FIT for honeymoon — request ocean-view upgrade language in proposals. Virtuoso breakfast always confirmed.",
          author: "Kristin Summers",
          timeAgo: "1 week ago",
          pinned: true,
        },
      ],
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }
  if (productId === "prod_005") {
    return {
      advisorDefaults: DMC_BALI_ADVISOR,
      agencyNotes: [...DMC_BALI_AGENCY],
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }
  if (productId === "prod-enable-003") {
    return {
      advisorDefaults: { ...EMPTY_ADVISOR, personalRating: 0 },
      agencyNotes: [
        {
          id: "an-oo-1",
          content: "Family-friendly; kids club is excellent. Book water villas early in peak season.",
          author: "Kristin Summers",
          timeAgo: "3 weeks ago",
        },
      ],
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
      agencyNotes: [
        {
          id: `ag-tip-${productId}`,
          content:
            "Verify rate and amenities on the latest partner sheet before quoting — property terms change seasonally.",
          author: "Agency catalog",
          timeAgo: "Tip",
        },
      ],
      partnerPrograms: [],
      pendingSuggestions: 0,
    };
  }
  return {
    advisorDefaults: { ...EMPTY_ADVISOR },
    agencyNotes: [],
    partnerPrograms: productId.startsWith("prod-enable") ? [DEFAULT_PROGRAMS[0]] : [],
    pendingSuggestions: productId === "prod-enable-005" ? 1 : 0,
  };
}
