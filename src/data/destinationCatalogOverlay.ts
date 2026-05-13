import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import { TEAM_EVERYONE_ID } from "@/types/teams";

/**
 * Catalog rows keyed to match `productId` on destination guides so
 * `mergeDestinationWithCatalog` can hydrate DMC / restaurant / hotel / yacht
 * sections from the same Product Directory source of truth.
 *
 * Real partner data extracted from advisor-portal destination PDFs.
 * Appended by `resolveAdvisorCatalogFromStorage` when ids are not already
 * present (persisted catalog wins on conflicts).
 */

const DMC_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1601581875309-fafbf2a0a476?w=400&h=240&fit=crop";
const HOTEL_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop";
const REST_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop";
const YACHT_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400&h=300&fit=crop";

type ContactArg = {
  id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
};

function baseFields(args: {
  id: string;
  name: string;
  imageUrl?: string;
  website?: string;
  location: string;
  city?: string;
  country: string;
  region: string;
  types: DirectoryProductCategory[];
  description: string;
  collectionId: string;
  collectionName: string;
  contacts?: ContactArg[];
  latitude?: number;
  longitude?: number;
  defaultImage: string;
}): DirectoryProduct {
  return {
    id: args.id,
    name: args.name,
    imageUrl: args.imageUrl ?? args.defaultImage,
    website: args.website,
    location: args.location,
    city: args.city,
    country: args.country,
    types: args.types,
    region: args.region,
    description: args.description,
    latitude: args.latitude,
    longitude: args.longitude,
    scope: "agency",
    baseCommissionRate: null,
    effectiveCommissionRate: null,
    activeIncentive: null,
    commissionRate: null,
    partnerProgramCount: 0,
    collectionCount: 1,
    collectionIds: [args.collectionId],
    partnerPrograms: [],
    repFirmLinks: [],
    repFirmCount: 0,
    agencyContacts: (args.contacts ?? []).map((c, idx) => ({
      id: c.id ?? `${args.id}-contact-${idx}`,
      name: c.name,
      role: c.role ?? "Contact",
      email: c.email ?? "",
      phone: c.phone ?? "",
    })),
    collections: [{ id: args.collectionId, name: args.collectionName, scope: TEAM_EVERYONE_ID }],
  };
}

function dmc(
  id: string,
  args: {
    name: string;
    website?: string;
    imageUrl?: string;
    location: string;
    city?: string;
    country: string;
    region: string;
    description: string;
    collectionId: string;
    collectionName: string;
    contacts?: ContactArg[];
    generalEmail?: string;
    pricing?: string;
    payment?: string;
    commission?: string;
    afterHours?: string;
    reppedBy?: string;
    destinationsServed?: string;
    baseCommissionRate?: number | null;
    latitude?: number;
    longitude?: number;
  },
): DirectoryProduct {
  return {
    ...baseFields({
      id,
      name: args.name,
      imageUrl: args.imageUrl,
      website: args.website,
      location: args.location,
      city: args.city,
      country: args.country,
      region: args.region,
      types: ["dmc"],
      description: args.description,
      collectionId: args.collectionId,
      collectionName: args.collectionName,
      contacts: args.contacts,
      latitude: args.latitude,
      longitude: args.longitude,
      defaultImage: DMC_DEFAULT_IMAGE,
    }),
    baseCommissionRate: args.baseCommissionRate ?? null,
    effectiveCommissionRate: args.baseCommissionRate ?? null,
    commissionRate: args.baseCommissionRate ?? null,
    general_requests_email: args.generalEmail ?? null,
    pricing_model: args.pricing ?? null,
    payment_process: args.payment ?? null,
    commission_process: args.commission ?? null,
    after_hours_support: args.afterHours ?? null,
    repped_by: args.reppedBy ?? null,
    destinations_served: args.destinationsServed ?? null,
  };
}

function hotel(
  id: string,
  args: {
    name: string;
    website?: string;
    imageUrl?: string;
    location: string;
    city?: string;
    country: string;
    region: string;
    description: string;
    collectionId: string;
    collectionName: string;
    contacts?: ContactArg[];
    latitude?: number;
    longitude?: number;
  },
): DirectoryProduct {
  return baseFields({
    id,
    name: args.name,
    imageUrl: args.imageUrl,
    website: args.website,
    location: args.location,
    city: args.city,
    country: args.country,
    region: args.region,
    types: ["hotel"],
    description: args.description,
    collectionId: args.collectionId,
    collectionName: args.collectionName,
    contacts: args.contacts,
    latitude: args.latitude,
    longitude: args.longitude,
    defaultImage: HOTEL_DEFAULT_IMAGE,
  });
}

function restaurant(
  id: string,
  args: {
    name: string;
    website?: string;
    imageUrl?: string;
    location: string;
    city?: string;
    country: string;
    region: string;
    description: string;
    collectionId: string;
    collectionName: string;
    latitude?: number;
    longitude?: number;
  },
): DirectoryProduct {
  return baseFields({
    id,
    name: args.name,
    imageUrl: args.imageUrl,
    website: args.website,
    location: args.location,
    city: args.city,
    country: args.country,
    region: args.region,
    types: ["restaurant"],
    description: args.description,
    collectionId: args.collectionId,
    collectionName: args.collectionName,
    latitude: args.latitude,
    longitude: args.longitude,
    defaultImage: REST_DEFAULT_IMAGE,
  });
}

function yacht(
  id: string,
  args: {
    name: string;
    website?: string;
    imageUrl?: string;
    location: string;
    city?: string;
    country: string;
    region: string;
    description: string;
    collectionId: string;
    collectionName: string;
    contacts?: ContactArg[];
    destinationsServed?: string;
    latitude?: number;
    longitude?: number;
  },
): DirectoryProduct {
  return {
    ...baseFields({
      id,
      name: args.name,
      imageUrl: args.imageUrl,
      website: args.website,
      location: args.location,
      city: args.city,
      country: args.country,
      region: args.region,
      types: ["cruise"],
      description: args.description,
      collectionId: args.collectionId,
      collectionName: args.collectionName,
      contacts: args.contacts,
      latitude: args.latitude,
      longitude: args.longitude,
      defaultImage: YACHT_DEFAULT_IMAGE,
    }),
    destinations_served: args.destinationsServed ?? null,
    destinations: args.destinationsServed,
  };
}

/* ============================================================
 * GREECE
 * Source: advisor-portal Greece destination page (PDF export)
 * ============================================================ */

const GR_DMC_COLLECTION = { id: "col-dmc-gr", name: "Greece DMCs" };
const GR_HOTEL_COLLECTION = { id: "col-hotel-gr", name: "Greece Hotels" };
const GR_REST_COLLECTION = { id: "col-rest-gr", name: "Greece Restaurants" };
const GR_YACHT_COLLECTION = { id: "col-yacht-gr", name: "Greece Yacht Charters" };

const GREECE_PRODUCTS: DirectoryProduct[] = [
  // ----- DMCs -----
  dmc("cat-dmc-gr-001", {
    name: "Original Senses",
    website: "https://www.originalsenses.gr/",
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description:
      "Greek DMC offering itemization and pricing transparency, free basic concierge and enhanced services on request.",
    collectionId: GR_DMC_COLLECTION.id,
    collectionName: GR_DMC_COLLECTION.name,
    contacts: [
      { name: "Maria Konstantopoulou", role: "Key contact", email: "mariak@originalsenses.com" },
      { name: "Konstantina", role: "General requests", email: "konstantinak@originalsenses.com" },
      { name: "Christina", role: "General requests", email: "christinan@originalsenses.com" },
    ],
    generalEmail: "mariak@originalsenses.com",
    pricing: "Itemized breakdowns; believes in pricing transparency.",
    payment: "No credit-card fees. Basic concierge (restaurants, beach clubs) free; enhanced concierge billed on request.",
    commission:
      "Required by law to receive commission invoices. Group payments on the 15th and 30th of each month with proof of payment + analysis (project / client / dates / advisor).",
    afterHours:
      "Office hours 10:00–18:00 EET; team monitors email beyond hours. 24/7 emergency line for clients on the ground.",
    reppedBy: "JMAK · jon@jmak.com",
    destinationsServed: "Greece (mainland + islands)",
    latitude: 37.9838,
    longitude: 23.7275,
  }),
  dmc("cat-dmc-gr-002", {
    name: "Eclectic Greece",
    website: "https://eclecticgreece.com/",
    imageUrl: "https://images.unsplash.com/photo-1503152394-c571994fd383?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Boutique Greek DMC that also serves Turkey and Egypt. Itemized pricing model.",
    collectionId: GR_DMC_COLLECTION.id,
    collectionName: GR_DMC_COLLECTION.name,
    contacts: [
      { name: "Christos Kyvernitis", role: "Key contact", email: "c.kyvernitis@kyvernitis.gr" },
      { name: "Eva Saringala", role: "Sales director · general requests", email: "e.saringala@kyvernitis.gr" },
    ],
    pricing: "Itemization.",
    commission: "Commission can be sent via check.",
    afterHours: "24/7 emergency phone +30 6991636363.",
    reppedBy: "Dominique Debay · dominique@dominiquedebay.com",
    destinationsServed: "Greece, Turkey, Egypt",
    latitude: 37.9838,
    longitude: 23.7275,
  }),
  dmc("cat-dmc-gr-003", {
    name: "Myths & Muses",
    website: "https://mythsandmuses.com/",
    imageUrl: "https://images.unsplash.com/photo-1571406761758-9a3eed5338ef?w=600&h=400&fit=crop",
    location: "Athens, Greece (US office: Boston)",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description:
      "Smaller boutique DMC, founder based in Boston. 4★ / 5★ authentic experiences with strong value. Runs an ambassador program for advisors who refer business.",
    collectionId: GR_DMC_COLLECTION.id,
    collectionName: GR_DMC_COLLECTION.name,
    contacts: [
      { name: "Christina Papavlasopoulos", role: "Co-founder", email: "christina@mythsandmuses.com" },
      { name: "Nektaria Panagiotari", role: "Co-founder", email: "info@mythsandmuses.com" },
    ],
    generalEmail: "info@mythsandmuses.com",
    pricing: "Itemization possible; can pay 15% or higher commission depending on program.",
    commission: "Paid 2 weeks after clients return from trip.",
    reppedBy: "Tina Lyra · TL Portfolio",
    destinationsServed: "Greece",
    baseCommissionRate: 15,
    latitude: 37.9838,
    longitude: 23.7275,
  }),
  dmc("cat-dmc-gr-004", {
    name: "Greece a la Carte",
    website: "https://www.greecealacarte.gr/",
    imageUrl: "https://images.unsplash.com/photo-1601581875309-fafbf2a0a476?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description:
      "Itemized Greek DMC. Request 12% commission at the time of initial request.",
    collectionId: GR_DMC_COLLECTION.id,
    collectionName: GR_DMC_COLLECTION.name,
    contacts: [
      { name: "Kasi Turpin", role: "Owner", email: "kasiturpin@greecealacarte.gr" },
    ],
    generalEmail: "info@greecealacarte.gr",
    pricing: "Itemization — request 12% commission at the time of initial request.",
    commission: "Commission can be sent via check.",
    afterHours: "24/7 emergency phone +30 6991636363.",
    reppedBy: "Virtuoso",
    destinationsServed: "Greece",
    baseCommissionRate: 12,
    latitude: 37.9838,
    longitude: 23.7275,
  }),
  dmc("cat-dmc-gr-005", {
    name: "Curated Greece",
    website: "https://curatedgreece.com/",
    imageUrl: "https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description:
      "Experts across all of Greece. Can arrange yacht charters by the day to avoid ferries between Paros, Athens and Santorini — also charters of less than a week.",
    collectionId: GR_DMC_COLLECTION.id,
    collectionName: GR_DMC_COLLECTION.name,
    contacts: [
      { name: "Seetha Ramanathan", role: "Key contact", email: "seetha@curatedgreece.com" },
      { name: "Vasilis Sarmantas", role: "Key contact", email: "vasilis@curatedgreece.com" },
    ],
    generalEmail: "info@curatedgreece.com",
    pricing: "Entry 5★ from ~$758 pp/day; June from ~$800 pp/day with a few private experiences.",
    reppedBy: "Rebecca Recommends",
    destinationsServed: "Greece (mainland + islands)",
    latitude: 37.9838,
    longitude: 23.7275,
  }),
  dmc("cat-dmc-gr-006", {
    name: "OAG Greece (Our A Game)",
    website: "https://www.oag-greece.com/",
    imageUrl: "https://images.unsplash.com/photo-1602940659805-770d1b3b9911?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description:
      "Very boutique DMC with one-of-a-kind activities. Founder Alex also handles yacht arrangements.",
    collectionId: GR_DMC_COLLECTION.id,
    collectionName: GR_DMC_COLLECTION.name,
    destinationsServed: "Greece",
    latitude: 37.9838,
    longitude: 23.7275,
  }),

  // ----- Hotels (Athens) -----
  hotel("cat-hotel-gr-001", {
    name: "The Dolli at Acropolis",
    website: "https://thedolli.com/",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Luxury Acropolis-view hotel in the historical centre. Repped by Travellive.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.9719,
    longitude: 23.7253,
  }),
  hotel("cat-hotel-gr-002", {
    name: "Athens Capital Hotel — M Gallery",
    website: "https://athenscapitalhotel-mgallery.com/",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Very modern hotel in the M Gallery Collection.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.9784,
    longitude: 23.7341,
  }),
  hotel("cat-hotel-gr-003", {
    name: "Xenodocheio Milos",
    website: "https://www.xenodocheiomilos.com/",
    imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Boutique Athens hotel repped by Dominique Debay.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.9778,
    longitude: 23.7341,
  }),
  hotel("cat-hotel-gr-004", {
    name: "A77 Suites Athens",
    website: "https://www.a77suites.com/",
    imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Small Luxury Hotels of the World property with views of the Acropolis.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    contacts: [{ name: "Maria Papaconstantinou", role: "Sales", email: "maria@axiahospitality.com" }],
    latitude: 37.974,
    longitude: 23.728,
  }),
  hotel("cat-hotel-gr-005", {
    name: "New Hotel Athens",
    website: "https://www.yeshotels.gr/newhotel/",
    imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Funky, contemporary art-driven Athens hotel — part of Yes Hotels.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.9764,
    longitude: 23.7361,
  }),
  hotel("cat-hotel-gr-006", {
    name: "King George Athens — Luxury Collection",
    website:
      "https://www.marriott.com/en-us/hotels/athgl-king-george-a-luxury-collection-hotel-athens/overview/",
    imageUrl: "https://images.unsplash.com/photo-1570213489059-0aac6626d401?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Iconic Syntagma address; guests receive amenities of Grande Bretagne except the rooftop pool.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.9759,
    longitude: 23.7348,
  }),

  // ----- Hotels (Mykonos) -----
  hotel("cat-hotel-gr-010", {
    name: "Cali Mykonos",
    website: "https://www.calimykonos.com/",
    imageUrl: "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=600&h=400&fit=crop",
    location: "Mykonos, Greece",
    city: "Mykonos",
    country: "Greece",
    region: "Europe",
    description: "Mykonos beachfront resort.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    contacts: [
      { name: "Sophia Zachartos", role: "Sales", email: "sophia@calimykonos.com" },
      { name: "Angela Rojas", role: "Rep · MJL Select", email: "arojas@mjlselect.com" },
    ],
    latitude: 37.4467,
    longitude: 25.3289,
  }),
  hotel("cat-hotel-gr-011", {
    name: "Mykonos Blu — Grecotel",
    website: "https://www.grecotel.com/",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop",
    location: "Psarou Beach, Mykonos, Greece",
    city: "Mykonos",
    country: "Greece",
    region: "Europe",
    description: "Grecotel resort on Psarou Beach.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.4267,
    longitude: 25.3494,
  }),
  hotel("cat-hotel-gr-012", {
    name: "Mykonos Lolita — Grecotel",
    website: "https://www.grecotel.com/",
    imageUrl: "https://images.unsplash.com/photo-1561501878-aabd62634533?w=600&h=400&fit=crop",
    location: "Agios Sostis, Mykonos, Greece",
    city: "Mykonos",
    country: "Greece",
    region: "Europe",
    description: "Grecotel boutique resort on Agios Sostis beach.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.4831,
    longitude: 25.3636,
  }),

  // ----- Hotels (Santorini) -----
  hotel("cat-hotel-gr-020", {
    name: "Diamond Rock Villas",
    website: "https://thediamondrock.com/accommodation/",
    imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop",
    location: "Santorini, Greece",
    city: "Santorini",
    country: "Greece",
    region: "Europe",
    description: "Cliffside villa accommodation in Santorini.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 36.4618,
    longitude: 25.3753,
  }),
  hotel("cat-hotel-gr-021", {
    name: "Homeric Poems",
    website: "https://www.homericpoems.gr/",
    imageUrl: "https://images.unsplash.com/photo-1601581875309-fafbf2a0a476?w=600&h=400&fit=crop",
    location: "Santorini, Greece",
    city: "Santorini",
    country: "Greece",
    region: "Europe",
    description: "Boutique Santorini hotel with caldera-facing cave suites.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 36.4618,
    longitude: 25.3753,
  }),
  hotel("cat-hotel-gr-022", {
    name: "Nous Santorini — a Yes Hotel",
    website: "https://www.yeshotels.gr/nous-santorini/",
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop",
    location: "Santorini, Greece",
    city: "Santorini",
    country: "Greece",
    region: "Europe",
    description: "Adults-only Yes Hotels property on Santorini.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 36.3932,
    longitude: 25.4615,
  }),

  // ----- Hotels (Paros) -----
  hotel("cat-hotel-gr-030", {
    name: "Parilio Paros Design Hotel",
    website: "https://pariliohotelparos.com/",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    location: "Naoussa, Paros, Greece",
    city: "Paros",
    country: "Greece",
    region: "Europe",
    description: "Sleek design hotel on Paros.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.124,
    longitude: 25.237,
  }),
  hotel("cat-hotel-gr-031", {
    name: "Cosme Paros — Naxion Collection",
    website: "https://cosmehotelparos.com/",
    imageUrl: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=400&fit=crop",
    location: "Paros, Greece",
    city: "Paros",
    country: "Greece",
    region: "Europe",
    description: "Beachfront Naxion Collection hotel on Paros.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.072,
    longitude: 25.171,
  }),

  // ----- Hotels (Milos) -----
  hotel("cat-hotel-gr-040", {
    name: "Hotel Milos Sea Resort",
    website: "https://www.hotelmilosresort.com/",
    imageUrl: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&h=400&fit=crop",
    location: "Milos, Greece",
    city: "Milos",
    country: "Greece",
    region: "Europe",
    description: "Family-run sea resort on Milos.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 36.7404,
    longitude: 24.421,
  }),
  hotel("cat-hotel-gr-041", {
    name: "Domes White Coast Milos",
    website: "https://domesresorts.com/domeswhitecoastmilos/",
    imageUrl: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=400&fit=crop",
    location: "Milos, Greece",
    city: "Milos",
    country: "Greece",
    region: "Europe",
    description: "Adults-only Domes Resorts hideaway with pool suites on Milos.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 36.722,
    longitude: 24.451,
  }),
  hotel("cat-hotel-gr-042", {
    name: "Milos Breeze",
    website: "https://www.milosbreeze.gr/en/",
    imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=400&fit=crop",
    location: "Milos, Greece",
    city: "Milos",
    country: "Greece",
    region: "Europe",
    description: "Boutique Milos retreat with sweeping Aegean views.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 36.745,
    longitude: 24.43,
  }),

  // ----- Hotel collections (Grecotel, Domes, Yes Hotels, Naxion) -----
  hotel("cat-hotel-gr-050", {
    name: "Grecotel Hotels & Resorts",
    website: "https://www.grecotel.com/",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop",
    location: "Greece (multi-property)",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description:
      "All-Greece collection (LUXME all-inclusive brand). Key properties: The Dolli, Cape Sounio, The Roc Club, Pallas Athena, Amirandes, Caramel, LUXME White, Creta Palace, Marine Palace, Plaza Beach House, Casa Adele, Villa Oliva, Meli Palace, Mandola Rosa, La Riviera, LUXME Oasis, LUXME Palms, Casa Marron, Corfu Imperial, Eva Palace, LUXME Daphnila Bay, LUXME Costa Botanica, Filoxenia Kalamata, Astir Palace Alexandroupolis, Egnatia, Larissa Imperial, LUXME Kos, Casa Paradiso, Mykonos Blu, Mykonos Lolita, LUXME Dama Dama.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    contacts: [
      { name: "Sofia Grigoratou", role: "Sr Regional Manager USA", email: "sofia.grigoratou@grecotel.com" },
    ],
    latitude: 37.9838,
    longitude: 23.7275,
  }),
  hotel("cat-hotel-gr-051", {
    name: "Domes Resorts",
    website: "https://domesresorts.com/",
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
    location: "Greece (multi-property)",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Greek resort collection — Domes Zeen, Domes White Coast Milos, Domes of Corfu and more.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    contacts: [
      { name: "Angelique — Wanderlux Collection", role: "Rep firm", email: "angelique@wanderluxcollection.com" },
    ],
    latitude: 39.624,
    longitude: 19.922,
  }),
  hotel("cat-hotel-gr-052", {
    name: "Naxion Collection",
    website: "https://www.naxiancollection.com/en",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop",
    location: "Cyclades, Greece",
    city: "Naxos",
    country: "Greece",
    region: "Europe",
    description: "Cycladic boutique hotel group (Naxos + Paros via Cosme).",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.103,
    longitude: 25.379,
  }),
  hotel("cat-hotel-gr-053", {
    name: "Yes Hotels",
    website: "https://www.yeshotels.gr/our-hotels/",
    imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop",
    location: "Greece (multi-property)",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Greek design-driven hotel group: New Hotel Athens, Nous Santorini and more.",
    collectionId: GR_HOTEL_COLLECTION.id,
    collectionName: GR_HOTEL_COLLECTION.name,
    latitude: 37.9764,
    longitude: 23.7361,
  }),

  // ----- Restaurants (Athens) -----
  ...athensRestaurants(),
  // ----- Restaurants (Piraeus / Vouliagmeni / Delphi) -----
  ...nearAthensRestaurants(),
  // ----- Restaurants (Crete) -----
  ...creteRestaurants(),
  // ----- Restaurants (Mykonos) -----
  ...mykonosRestaurants(),
  // ----- Restaurants (Santorini) -----
  ...santoriniRestaurants(),
  // ----- Restaurants (Paros) -----
  ...parosRestaurants(),

  // ----- Yacht charter companies -----
  yacht("cat-yacht-gr-001", {
    name: "Blue BNC",
    website: "https://www.bluebnc.com/en-es/yacht-charter/greece",
    imageUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Pan-Mediterranean yacht charter brokerage.",
    collectionId: GR_YACHT_COLLECTION.id,
    collectionName: GR_YACHT_COLLECTION.name,
    contacts: [
      {
        name: "Morgane Candlot",
        role: "Area Manager",
        email: "morgane@bluebnc.com",
        phone: "+34 674 324 156",
      },
    ],
    destinationsServed:
      "Greece, Mallorca, Ibiza, Formentera & Balearic Islands, French Riviera & Monaco, Bahamas, St Barth",
    latitude: 37.9402,
    longitude: 23.6427,
  }),
  yacht("cat-yacht-gr-002", {
    name: "Roccabella Yachts",
    website: "https://roccabellayachts.com/",
    imageUrl: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600&h=400&fit=crop",
    location: "Athens, Greece",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    description: "Charter brokerage operating across the Greek Islands, Turkey, Italy and the wider Med.",
    collectionId: GR_YACHT_COLLECTION.id,
    collectionName: GR_YACHT_COLLECTION.name,
    contacts: [
      { name: "Lewis Bloor", role: "Charter manager", email: "lewis.bloor@roccabellayachts.com" },
    ],
    destinationsServed: "Greek Islands, Turkey, Italy and wider Mediterranean",
    latitude: 37.9402,
    longitude: 23.6427,
  }),
];

function r(
  id: string,
  name: string,
  city: string,
  description: string,
  lat: number,
  lng: number,
  website?: string,
  imageUrl?: string,
): DirectoryProduct {
  return restaurant(id, {
    name,
    website,
    imageUrl,
    location: `${city}, Greece`,
    city,
    country: "Greece",
    region: "Europe",
    description,
    collectionId: GR_REST_COLLECTION.id,
    collectionName: GR_REST_COLLECTION.name,
    latitude: lat,
    longitude: lng,
  });
}

function athensRestaurants(): DirectoryProduct[] {
  const c: [string, string, string, number, number, string?][] = [
    ["cat-rest-gr-001", "Balthazar", "Stylish all-day spot in Kolonaki.", 37.9777, 23.7444, "https://balthazar.gr/en/"],
    ["cat-rest-gr-002", "Cookoovaya", "Modern Greek cooking, six chefs.", 37.969, 23.7458, "https://cookoovaya.gr/"],
    ["cat-rest-gr-003", "Dionisos Acropolis", "Acropolis-view classic.", 37.9701, 23.7236, "https://dionysoszonars.gr/"],
    ["cat-rest-gr-004", "Ella", "Greek cooking class & restaurant.", 37.9784, 23.7341, "http://www.ellagreekcooking.gr/en/"],
    ["cat-rest-gr-005", "Ergon House", "All-day Greek food hall + hotel.", 37.9784, 23.7341, "https://house.ergonfoods.com/"],
    ["cat-rest-gr-006", "GB Roof Garden", "Acropolis roof at Grande Bretagne.", 37.9759, 23.7349, "https://www.gbroofgarden.gr/"],
    ["cat-rest-gr-007", "Kuzina", "Plaka rooftop, modern Greek.", 37.9747, 23.726, "https://www.kuzina.gr/en/home"],
    ["cat-rest-gr-008", "Papadakis", "Aegean seafood in Kolonaki.", 37.9787, 23.7439, "https://papadakisrestaurant.com/"],
    ["cat-rest-gr-009", "Strofi", "Acropolis-view rooftop classic.", 37.9696, 23.7222, "https://www.strofi.gr/en/"],
    ["cat-rest-gr-010", "Tzitzikas & Mermigas", "Mezze institution downtown.", 37.978, 23.7297, "https://www.tzitzikasmermigas.gr/en/"],
    ["cat-rest-gr-011", "Vezene", "Wood-fired steak and seafood.", 37.985, 23.755, "https://www.vezene.gr"],
    ["cat-rest-gr-012", "Malconi's", "Italian-leaning Kolonaki staple.", 37.9786, 23.7456, "https://www.malconis.gr/"],
    ["cat-rest-gr-013", "Zurbaran", "Spanish & Mediterranean wine bar.", 37.9777, 23.7396, "https://zurbaranathens.gr"],
    ["cat-rest-gr-014", "All Senses Gastronomy", "Greek tasting menu venue.", 37.978, 23.733, "https://www.foodhubs.eu/ASG.html"],
  ];
  return c.map(([id, name, desc, lat, lng, url]) => r(id, name, "Athens", desc, lat, lng, url));
}

function nearAthensRestaurants(): DirectoryProduct[] {
  const c: { id: string; name: string; city: string; description: string; lat: number; lng: number; url?: string }[] = [
    {
      id: "cat-rest-gr-020", name: "Varoulko Seaside", city: "Piraeus",
      description: "Michelin-starred seafood by Lefteris Lazarou.", lat: 37.94, lng: 23.646,
      url: "https://www.varoulko.gr/",
    },
    {
      id: "cat-rest-gr-021", name: "Margaro", city: "Piraeus",
      description: "Cash-only seafood institution by the naval academy.", lat: 37.943, lng: 23.652,
      url: "https://www.margaro-restaurant.com/",
    },
    {
      id: "cat-rest-gr-022", name: "Ithaki", city: "Vouliagmeni",
      description: "Athens Riviera seafront seafood.", lat: 37.815, lng: 23.78,
      url: "https://ithakirestaurantbar.gr",
    },
    {
      id: "cat-rest-gr-023", name: "Labros", city: "Vouliagmeni",
      description: "Classic seafood meze on the water.", lat: 37.821, lng: 23.781,
      url: "https://labrosrestaurant.gr/en/",
    },
    {
      id: "cat-rest-gr-024", name: "Panorama", city: "Vouliagmeni",
      description: "Sweeping Saronic Gulf views.", lat: 37.815, lng: 23.78,
      url: "http://www.panoramarestaurant.gr",
    },
    {
      id: "cat-rest-gr-025", name: "Pelagos", city: "Vouliagmeni",
      description: "Refined Greek seafood by the marina.", lat: 37.815, lng: 23.78,
      url: "https://www.pelagosathens.com",
    },
    {
      id: "cat-rest-gr-026", name: "Taverna 37 — Four Seasons", city: "Vouliagmeni",
      description: "Beachfront taverna at the Four Seasons Astir Palace.", lat: 37.818, lng: 23.785,
      url: "https://www.fourseasons.com/athens/dining/restaurants/taverna-37/",
    },
    {
      id: "cat-rest-gr-027", name: "To Patriko Mas", city: "Delphi",
      description: "Mountain taverna near Delphi.", lat: 38.4824, lng: 22.501,
      url: "https://www.facebook.com/to.patriko.mas.restaurant.delphi.greece/",
    },
  ];
  return c.map((x) =>
    restaurant(x.id, {
      name: x.name,
      website: x.url,
      location: `${x.city}, Greece`,
      city: x.city,
      country: "Greece",
      region: "Europe",
      description: x.description,
      collectionId: GR_REST_COLLECTION.id,
      collectionName: GR_REST_COLLECTION.name,
      latitude: x.lat,
      longitude: x.lng,
    }),
  );
}

function creteRestaurants(): DirectoryProduct[] {
  const c: [string, string, string, number, number, string?][] = [
    ["cat-rest-gr-040", "Ferryman Taverna", "Waterfront taverna in Elounda.", 35.262, 25.728, "https://www.facebook.com/FerrymanTaverna/"],
    ["cat-rest-gr-041", "Lithos Taverna", "Authentic Cretan in Chania Old Town.", 35.515, 24.019, "https://tavernalithos.gr/"],
    ["cat-rest-gr-042", "Peskesi", "Heritage Cretan cuisine in Heraklion.", 35.338, 25.143, "https://peskesicrete.gr/en"],
    ["cat-rest-gr-043", "Portes", "Traditional Cretan with a modern twist (Neo Chora).", 35.513, 24.012, undefined],
    ["cat-rest-gr-044", "Salis", "Harbour-side dining in Chania Town.", 35.516, 24.018, "https://www.salischania.com/"],
  ];
  const cityFor = (id: string) => (id === "cat-rest-gr-040" ? "Elounda" : id === "cat-rest-gr-042" ? "Heraklion" : "Chania");
  return c.map(([id, name, desc, lat, lng, url]) => r(id, name, cityFor(id), desc, lat, lng, url));
}

function mykonosRestaurants(): DirectoryProduct[] {
  const c: [string, string, string, number, number, string?][] = [
    ["cat-rest-gr-060", "Buddha Bar Beach Mykonos", "Beach club at Santa Marina resort.", 37.4506, 25.3625, "https://santa-marina.gr/dining/buddha-bar-beach-mykonos/"],
    ["cat-rest-gr-061", "Hippie Fish", "Agios Ioannis beachfront fish.", 37.4361, 25.3144, "https://hippiefish-mykonos.com/"],
    ["cat-rest-gr-062", "Scorpios", "Paraga Beach club & day-to-night dining.", 37.4319, 25.3286, "https://scorpios.com/"],
    ["cat-rest-gr-063", "Interni", "Garden dining in Mykonos Town.", 37.4456, 25.3289, "https://internirestaurant.com/"],
  ];
  return c.map(([id, name, desc, lat, lng, url]) => r(id, name, "Mykonos", desc, lat, lng, url));
}

function santoriniRestaurants(): DirectoryProduct[] {
  const c: [string, string, string, string, number, number, string?][] = [
    ["cat-rest-gr-080", "Agaze Bistro Restaurant", "Pyrgos", "Diamond Rock cliffside bistro.", 36.404, 25.444, "https://thediamondrock.com/restaurants/agaze-restaurant/"],
    ["cat-rest-gr-081", "Petra — Canaves Oia", "Oia", "Canaves Oia Suites flagship.", 36.4618, 25.3753, "https://canaves.com/canaves-oia-suites/dining/petra-restaurant/"],
    ["cat-rest-gr-082", "Pyrgos", "Pyrgos", "Historic village taverna.", 36.404, 25.444, "https://www.pyrgos-santorini.com/"],
    ["cat-rest-gr-083", "Elements — Canaves Oia Epitome", "Oia", "Canaves Epitome signature dining.", 36.4618, 25.3753, "https://canaves.com/canaves-oia-epitome/dining/elements-restaurant/"],
    ["cat-rest-gr-084", "Naos", "Oia", "Sunset-view modern Greek.", 36.4618, 25.3753, "https://naosoia.gr/"],
    ["cat-rest-gr-085", "Lefkes", "Finikia", "Hidden village courtyard restaurant.", 36.4661, 25.3784, "https://lefkes.gr/lefkes-santorini/?lang=en"],
    ["cat-rest-gr-086", "Fino", "Fira", "Contemporary Greek with caldera views.", 36.4173, 25.4316, "https://finosantorini.gr/"],
    ["cat-rest-gr-087", "Roka", "Oia", "Cycladic small plates.", 36.4618, 25.3753, "https://www.roka.gr/"],
    ["cat-rest-gr-088", "Selene", "Pyrgos", "Iconic Santorini fine-dining.", 36.4071, 25.4444, "https://selene.gr/"],
    ["cat-rest-gr-089", "Armeni Fish Tavern", "Oia", "Fishing-village taverna below Oia.", 36.4625, 25.376, "https://armenisantorinirestaurant.gr/"],
    ["cat-rest-gr-090", "Ammoudi Fish Tavern", "Ammoudi", "Sea-spray seafood under Oia.", 36.464, 25.371, "https://ammoudisantorini.com/"],
    ["cat-rest-gr-091", "Sunset Ammoudi", "Ammoudi", "Sunset seafood mainstay.", 36.464, 25.371, "https://www.sunset-ammoudi.gr/"],
    ["cat-rest-gr-092", "Kaliya", "Imerovigli", "Caldera-side modern Greek.", 36.435, 25.428, "https://www.kaliya-restaurant.com/"],
    ["cat-rest-gr-093", "Aktaion", "Firostefani", "Traditional Greek with caldera views.", 36.4275, 25.4324, "https://www.aktaionsantorini.com/"],
    ["cat-rest-gr-094", "Mama Thira", "Firostefani", "Family taverna with sea views.", 36.4275, 25.4324, "https://www.mamathira.gr/"],
    ["cat-rest-gr-095", "Metaxi Mas", "Exo Gonia", "Hilltop favourite — book ahead.", 36.402, 25.477, "https://santorini-metaximas.gr/en"],
    ["cat-rest-gr-096", "To Psaraki", "Vlychada", "Marina-side seafood.", 36.353, 25.43, "http://www.topsaraki.gr/joomla/"],
    ["cat-rest-gr-097", "Theros Wave Bar", "Vlychada", "Beachfront wave bar.", 36.351, 25.434, "https://www.theroswavebar.gr/"],
    ["cat-rest-gr-098", "Seaside", "Perissa", "Casual seaside dining.", 36.358, 25.473, "https://www.luxuryrestaurantawards.com/restaurant/seaside-santorini/"],
    ["cat-rest-gr-099", "Yalos", "Caldera", "Caldera waterline restaurant.", 36.4173, 25.4316, "https://www.yalos-santorini.com/"],
  ];
  return c.map(([id, name, city, desc, lat, lng, url]) => r(id, name, `Santorini · ${city}`, desc, lat, lng, url));
}

function parosRestaurants(): DirectoryProduct[] {
  const c: [string, string, string, number, number, string?][] = [
    ["cat-rest-gr-120", "Soso", "Refined home-style food, off-the-radar.", 37.084, 25.151, "https://travelfoodpeople.com/paros-refined-homey-food-at-the-quiet-restaurant-of-soso/"],
    ["cat-rest-gr-121", "Yemeni", "Modern Greek by Naoussa.", 37.124, 25.237, "https://www.yemeni.gr/"],
    ["cat-rest-gr-122", "Barbarossa", "Naoussa harbour stalwart.", 37.124, 25.237, "https://www.barbarossarestaurant.com/"],
    ["cat-rest-gr-123", "Bebop", "Beachside lounge & dining.", 37.087, 25.158, "https://www.bebopjoomla.gr/"],
    ["cat-rest-gr-124", "Mario Restaurant", "Family-run Greek classics.", 37.086, 25.15, "https://www.mariorestaurantparos.com/"],
    ["cat-rest-gr-125", "Monastiri Beach Club", "Day-to-night beach club.", 37.13, 25.213, "https://www.monastiri-paros.gr/"],
  ];
  return c.map(([id, name, desc, lat, lng, url]) => r(id, name, "Paros", desc, lat, lng, url));
}

/* ============================================================
 * ARGENTINA
 * Source: advisor-portal Argentina destination page (PDF export)
 * ============================================================ */

const AR_DMC_COLLECTION = { id: "col-dmc-ar", name: "Argentina DMCs" };
const AR_REST_COLLECTION = { id: "col-rest-ar", name: "Argentina Restaurants" };

const ARGENTINA_PRODUCTS: DirectoryProduct[] = [
  dmc("cat-dmc-ar-001", {
    name: "Abercrombie & Kent Argentina",
    website: "https://www.abercrombiekent.com/",
    imageUrl: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop",
    location: "Buenos Aires, Argentina",
    city: "Buenos Aires",
    country: "Argentina",
    region: "South America",
    description: "Global DMC servicing Argentina (and Europe / France) — Abercrombie & Kent USA, LLC.",
    collectionId: AR_DMC_COLLECTION.id,
    collectionName: AR_DMC_COLLECTION.name,
    contacts: [
      {
        name: "Sonja Stoerr",
        role: "Sales Director, NY & Northeast USA",
        phone: "+1 (630) 725-3400 x521",
      },
    ],
    payment:
      "General TL agent log-in: hello@travellustre.com (PW: Travel44!). Advisors can also self-register at abercrombiekent.com/agent-services/registration.",
    destinationsServed: "Argentina, Europe, France · Global DMC",
    latitude: -34.6037,
    longitude: -58.3816,
  }),
  dmc("cat-dmc-ar-002", {
    name: "Garcia Fernandez Turismo",
    website: "http://www.gft.com.ar",
    imageUrl: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop",
    location: "Buenos Aires, Argentina",
    city: "Buenos Aires",
    country: "Argentina",
    region: "South America",
    description:
      "Customised luxury trips, cruises, passenger transportation, business trips, incentive groups, luxury Central America and ski itineraries.",
    collectionId: AR_DMC_COLLECTION.id,
    collectionName: AR_DMC_COLLECTION.name,
    generalEmail: "garcia.fernandez@gft.com.ar",
    afterHours: "Office hours 09:30–18:30 ART · +54 011 5263 9969",
    reppedBy: "Virtuoso",
    destinationsServed: "Argentina, Latin America",
    latitude: -34.6037,
    longitude: -58.3816,
  }),

  // ----- Buenos Aires restaurants -----
  ...buenosAiresRestaurants(),
];

function ba(
  id: string,
  name: string,
  description: string,
  lat: number,
  lng: number,
  website?: string,
): DirectoryProduct {
  return restaurant(id, {
    name,
    website,
    location: "Buenos Aires, Argentina",
    city: "Buenos Aires",
    country: "Argentina",
    region: "South America",
    description,
    collectionId: AR_REST_COLLECTION.id,
    collectionName: AR_REST_COLLECTION.name,
    latitude: lat,
    longitude: lng,
  });
}

function buenosAiresRestaurants(): DirectoryProduct[] {
  return [
    ba("cat-rest-ar-001", "Alvear Grill", "Hotel grill room with a great roof bar.", -34.5895, -58.3868),
    ba("cat-rest-ar-002", "Aramburu", "Fine dining 18-course tasting menu.", -34.595, -58.391, "https://www.arambururesto.com.ar/"),
    ba("cat-rest-ar-003", "Aramburu Bis", "Relaxed sister bistro across the street from Aramburu.", -34.595, -58.391, "https://www.bisresto.com.ar/"),
    ba("cat-rest-ar-004", "Birkin", "Great Buenos Aires breakfast spot.", -34.585, -58.395),
    ba("cat-rest-ar-005", "Cadore", "Best ice-cream downtown — craft Argentinian flavours with Italian roots since 1957.", -34.6075, -58.3786),
    ba("cat-rest-ar-006", "Cafe Rivas", "Old-world Argentinian comfort food, serious wine list, live piano weekends and Sunday brunch.", -34.617, -58.371),
    ba("cat-rest-ar-007", "Casa Cavia", "Palermo hideaway: bookshop, florist & restaurant.", -34.575, -58.42),
    ba("cat-rest-ar-008", "Cucina Paradiso", "Amazing homemade pasta in Palermo.", -34.583, -58.426),
    ba("cat-rest-ar-009", "Cuervo", "Great breakfast and coffee.", -34.586, -58.426),
    ba("cat-rest-ar-010", "Don Julio", "Probably the most famous restaurant in all of Buenos Aires — parrilla.", -34.586, -58.428),
    ba("cat-rest-ar-011", "El Burladero", "Spanish-leaning Recoleta classic.", -34.589, -58.39),
    ba("cat-rest-ar-012", "El Pobre Luís", "Beloved Belgrano parrilla.", -34.557, -58.456),
    ba("cat-rest-ar-013", "Duque", "Modern Argentinian dining.", -34.585, -58.426),
    ba("cat-rest-ar-014", "Mishiguene", "Israeli & Jewish classics reimagined.", -34.581, -58.428, "https://www.facebook.com/mishiguene/"),
    ba("cat-rest-ar-015", "Rapa Nui", "Best ice cream and chocolates.", -34.6, -58.4, "https://rapanui.com.ar/"),
    ba("cat-rest-ar-016", "Salvaje Bakery", "Casual bakery: homemade breads, sandwiches, pastries.", -34.59, -58.43, "https://www.salvajebakery.com.ar/"),
    ba("cat-rest-ar-017", "Tanta", "Peruvian by Gastón Acurio in Buenos Aires.", -34.586, -58.426),
  ];
}

/** Catalog rows for destination guides — exported as a flat list. */
export const DESTINATION_CATALOG_OVERLAY_PRODUCTS: DirectoryProduct[] = [
  ...GREECE_PRODUCTS,
  ...ARGENTINA_PRODUCTS,
];
