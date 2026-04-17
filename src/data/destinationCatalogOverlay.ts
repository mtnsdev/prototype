import type { DirectoryProduct } from "@/types/product-directory";
import { TEAM_EVERYONE_ID } from "@/types/teams";

/**
 * Catalog rows keyed to match `productId` on destination guides so
 * `mergeDestinationWithCatalog` can hydrate DMC/restaurant/hotel/yacht sections
 * from the same Product Directory source of truth.
 *
 * Appended by `resolveAdvisorCatalogFromStorage` when ids are not already present
 * (persisted catalog wins on conflicts).
 */
function dmc(
  id: string,
  args: {
    name: string;
    website?: string;
    keyName: string;
    keyEmail: string;
    generalEmail: string;
    pricing: string;
    payment: string;
    commission: string;
    afterHours: string;
    reppedBy: string;
  }
): DirectoryProduct {
  return {
    id,
    name: args.name,
    imageUrl: "https://images.unsplash.com/photo-1601581875309-fafbf2a0a476?w=400&h=240&fit=crop",
    website: args.website,
    location: "Greece",
    city: "Athens",
    country: "Greece",
    types: ["dmc"],
    region: "Europe",
    description: "Destination management company — catalog overlay for Greece guides.",
    scope: "agency",
    baseCommissionRate: 11,
    effectiveCommissionRate: 11,
    activeIncentive: null,
    commissionRate: 11,
    partnerProgramCount: 0,
    collectionCount: 0,
    collectionIds: [],
    partnerPrograms: [],
    repFirmLinks: [],
    repFirmCount: 0,
    agencyContacts: [
      {
        id: `${id}-contact`,
        name: args.keyName,
        role: "Key contact",
        email: args.keyEmail,
        phone: "",
      },
    ],
    collections: [{ id: "col-dmc-gr", name: "Greece DMCs", scope: TEAM_EVERYONE_ID }],
    general_requests_email: args.generalEmail,
    pricing_model: args.pricing,
    payment_process: args.payment,
    commission_process: args.commission,
    after_hours_support: args.afterHours,
    repped_by: args.reppedBy,
  };
}

/** Greece DMC pins — ids align with `src/data/destinations.ts` GREECE.dmcPartners[].productId */
export const DESTINATION_CATALOG_OVERLAY_PRODUCTS: DirectoryProduct[] = [
  dmc("cat-dmc-greece-001", {
    name: "Aegean Elite DMC",
    website: "https://example.com/aegean-elite",
    keyName: "Maria Konstantinou",
    keyEmail: "maria.k@example.com",
    generalEmail: "greece.requests@example.com",
    pricing: "Net rates; FIT series on request (catalog).",
    payment: "Wire 21 days prior to arrival; CC with fee.",
    commission: "10–12% posted after travel; statement monthly.",
    afterHours: "WhatsApp line for active trips · +30 694 000 0000",
    reppedBy: "TL Greece desk · advisor@example.com",
  }),
  dmc("cat-dmc-greece-002", {
    name: "Hellenic Horizons",
    website: "https://example.com/hellenic",
    keyName: "Nikos Papadopoulos",
    keyEmail: "groups@example.com",
    generalEmail: "hello@example.com",
    pricing: "Tiered net by season (catalog).",
    payment: "Deposit + balance 30 days.",
    commission: "Per program addendum.",
    afterHours: "Email-only weekends",
    reppedBy: "Partner services",
  }),
  dmc("cat-dmc-greece-003", {
    name: "Eclectic Greece DMC",
    website: "https://example.com/eclectic-greece",
    keyName: "Elena V.",
    keyEmail: "elena@example.com",
    generalEmail: "ops@eclecticgreece.example.com",
    pricing: "Itemized net; series contracts available (catalog).",
    payment: "Wire per confirmation; Amex with 4% surcharge.",
    commission: "11% net of DMC invoice; paid within 45 days of travel.",
    afterHours: "Duty mobile +30 697 000 1111 (active files)",
    reppedBy: "Virtuoso Greece",
  }),
  dmc("cat-dmc-greece-004", {
    name: "Mediterranean Pathways",
    website: "https://example.com/med-pathways",
    keyName: "Dimitris S.",
    keyEmail: "dimitris@example.com",
    generalEmail: "bookings@medpathways.example.com",
    pricing: "Package and FIT; min 4 nights high season.",
    payment: "Deposit 30% / balance 45 days pre-arrival.",
    commission: "10% posted on supplier statement.",
    afterHours: "Sat emergency email only",
    reppedBy: "EU inbound desk",
  }),
  dmc("cat-dmc-greece-005", {
    name: "Cyclades Concierge DMC",
    website: "https://example.com/cyclades-concierge",
    keyName: "Yannis K.",
    keyEmail: "yannis@example.com",
    generalEmail: "hello@cycladesconcierge.example.com",
    pricing: "Net island-hopping bundles.",
    payment: "Wire; EUR only.",
    commission: "9–11% depending on season.",
    afterHours: "WhatsApp group for active trips",
    reppedBy: "Island programs",
  }),
  dmc("cat-dmc-greece-006", {
    name: "Ionian Select DMC",
    website: "https://example.com/ionian-select",
    keyName: "Sofia M.",
    keyEmail: "sofia@example.com",
    generalEmail: "requests@ionianselect.example.com",
    pricing: "Net villa + crewed charter bundles.",
    payment: "50/50 split deposit and pre-arrival.",
    commission: "Per charter addendum.",
    afterHours: "Local office 09:00–20:00 EET",
    reppedBy: "West coast specialists",
  }),
];
