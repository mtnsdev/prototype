/**
 * Static destination guide data for the VIC prototype.
 * Replace with API / Supabase fetch later — keep `getDestinationBySlug` / `listDestinationSummaries` as the boundary.
 */

export type DestinationDocument = {
  name: string;
  type: "pdf" | "docx" | "xlsx";
};

export type DMCPartner = {
  name: string;
  preferred: boolean;
  reppedBy?: string;
  website?: string;
  keyContact?: string;
  generalRequests?: string;
  pricing?: string;
  paymentProcess?: string;
  commissionProcess?: string;
  afterHours?: string;
  notes?: string;
  feedback?: string;
};

export type Restaurant = {
  name: string;
  url?: string;
  note?: string;
};

export type Hotel = {
  name: string;
  contact?: string;
  url?: string;
  note?: string;
  properties?: string[];
};

export type YachtCompany = {
  name: string;
  contact: string;
  url: string;
  destinations: string;
};

export type TourismRegion = {
  name: string;
  description?: string;
  links: { label: string; url: string }[];
};

export type Destination = {
  slug: string;
  name: string;
  tagline: string;
  heroImage: string;
  description: string;
  subRegions: string[];
  dmcPartners: DMCPartner[];
  restaurants: Record<string, Restaurant[]>;
  hotels: Record<string, Hotel[]>;
  yachtCompanies?: YachtCompany[];
  tourismRegions: TourismRegion[];
  documents: DestinationDocument[];
};

export type DestinationSummary = {
  slug: string;
  name: string;
  tagline: string;
  heroImage: string;
  description: string;
  dmcCount: number;
  hotelCount: number;
  restaurantCount: number;
};

function countHotels(h: Record<string, Hotel[]>) {
  return Object.values(h).reduce((n, list) => n + list.length, 0);
}

function countRestaurants(r: Record<string, Restaurant[]>) {
  return Object.values(r).reduce((n, list) => n + list.length, 0);
}

function stubDestination(slug: string, name: string, tagline: string): Destination {
  return {
    slug,
    name,
    tagline,
    heroImage: "",
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

/* ——— Full Greece dataset (prototype-quality) ——— */

const GREECE: Destination = {
  slug: "greece",
  name: "Greece",
  tagline: "Islands, history, and seamless land programs across the Aegean.",
  heroImage:
    "https://images.unsplash.com/photo-1533105075890-4560e29b4919?w=1600&q=80&auto=format&fit=crop",
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
      name: "Aegean Elite DMC",
      preferred: true,
      reppedBy: "TL Greece desk · advisor@example.com",
      website: "https://example.com/aegean-elite",
      keyContact: "Maria Konstantinou · +30 210 000 0000",
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
      name: "Hellenic Horizons",
      preferred: false,
      reppedBy: "Partner services",
      website: "https://example.com/hellenic",
      keyContact: "Nikos P. · groups@example.com",
      generalRequests: "hello@example.com",
      pricing: "Tiered net by season.",
      paymentProcess: "Deposit + balance 30 days.",
      commissionProcess: "Per program addendum.",
      afterHours: "Email-only weekends",
    },
  ],
  restaurants: {
    Athens: [
      { name: "Spondi", url: "https://example.com/spondi", note: "Two Michelin · advance booking" },
      { name: "Nolan", note: "Casual fine dining, Psiri" },
    ],
    "Athens Vicinity": [{ name: "Ithaki Vouliagmeni", note: "Seaside · Riviera" }],
    Santorini: [
      { name: "Selene", url: "https://example.com/selene", note: "Pyrgos" },
      { name: "Metaxy Mas", note: "Tavern · Megalochori" },
    ],
    Mykonos: [{ name: "Kiki's Tavern", note: "Agios Sostis · lunch only" }],
    Crete: [{ name: "Peskesi", note: "Heraklion region · Cretan cuisine" }],
    Paros: [{ name: "Barbarossa", note: "Naoussa harbour" }],
  },
  hotels: {
    Collections: [
      {
        name: "Mystique, a Luxury Collection Hotel",
        contact: "Reservations · reservations@example.com",
        url: "https://example.com/mystique",
        properties: ["Santorini"],
      },
    ],
    Mykonos: [
      {
        name: "Bill & Coo Suites",
        contact: "VIP desk",
        url: "https://example.com/billcoo",
        note: "Adults-oriented",
      },
    ],
    Santorini: [
      {
        name: "Canaves Oia Epitome",
        contact: "Sales",
        properties: ["Epitome", "Canaves suites"],
      },
    ],
    Athens: [
      {
        name: "Hotel Grande Bretagne",
        contact: "Luxury sales",
        url: "https://example.com/gb",
      },
    ],
    "Paros & Milos": [
      {
        name: "Parilio Hotel Paros",
        note: "Naoussa adjacency",
      },
    ],
  },
  yachtCompanies: [
    {
      name: "Ionian Charter Co.",
      contact: "charter@example.com · +30 210 111 2222",
      url: "https://example.com/ionian-charter",
      destinations: "Ionian & Saronic day charters",
    },
  ],
  tourismRegions: [
    {
      name: "National",
      description: "Visit Greece — country-level planning and campaigns.",
      links: [
        { label: "Visit Greece", url: "https://www.visitgreece.gr/" },
        { label: "GNTO", url: "https://www.gnto.gov.gr/" },
      ],
    },
    {
      name: "Cyclades",
      description: "Island hopping, ferries, and regional highlights.",
      links: [{ label: "Cyclades tourism", url: "https://example.com/cyclades" }],
    },
  ],
  documents: [
    { name: "Greece — advisor commission cheat sheet", type: "pdf" },
    { name: "Island ferry timing guidelines", type: "docx" },
    { name: "Peak season hotel release calendar", type: "xlsx" },
  ],
};

const ITALY: Destination = {
  slug: "italy",
  name: "Italy",
  tagline: "Regional specialists from the Dolomites to Sicily.",
  heroImage:
    "https://images.unsplash.com/photo-1523906834650-1170aa7efe7e?w=1600&q=80&auto=format&fit=crop",
  description: "Skeleton entry — expand with Claromentis parity.",
  subRegions: ["Rome", "Florence", "Amalfi", "Sicily"],
  dmcPartners: [
    {
      name: "Italia Curata DMC",
      preferred: true,
      reppedBy: "EU desk",
      website: "https://example.com/italia-curata",
      keyContact: "Giulia R.",
      generalRequests: "italy@example.com",
    },
  ],
  restaurants: {
    Rome: [{ name: "Roscioli", note: "Testaccio" }],
  },
  hotels: {
    Rome: [{ name: "Hotel de Russie", url: "https://example.com/russie" }],
  },
  tourismRegions: [
    {
      name: "National",
      links: [{ label: "Italia.it", url: "https://www.italia.it/en.html" }],
    },
  ],
  documents: [{ name: "Italy rail pass overview", type: "pdf" }],
};

const FRANCE: Destination = {
  slug: "france",
  name: "France",
  tagline: "City breaks, wine routes, and alpine escapes.",
  heroImage:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&auto=format&fit=crop",
  description: "Skeleton entry — expand with Claromentis parity.",
  subRegions: ["Paris", "Provence", "French Alps", "Loire"],
  dmcPartners: [
    {
      name: "Maison Routes DMC",
      preferred: false,
      website: "https://example.com/maison-routes",
      keyContact: "Claire D.",
    },
  ],
  restaurants: {
    Paris: [{ name: "Septime", note: "Book weeks ahead" }],
  },
  hotels: {
    Paris: [{ name: "Le Bristol Paris", url: "https://example.com/bristol" }],
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
  heroImage:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80&auto=format&fit=crop",
  description: "Skeleton entry — expand with Claromentis parity.",
  subRegions: ["Tokyo", "Kyoto", "Hokkaido", "Okinawa"],
  dmcPartners: [
    {
      name: "Nippon Pathways",
      preferred: true,
      keyContact: "Kenji M.",
      generalRequests: "jp@example.com",
    },
  ],
  restaurants: {
    Tokyo: [{ name: "Den", note: "Kanda · reservation lottery" }],
  },
  hotels: {
    Tokyo: [{ name: "Aman Tokyo", url: "https://example.com/aman-tokyo" }],
  },
  tourismRegions: [
    {
      name: "National",
      links: [{ label: "JNTO", url: "https://www.japan.travel/en/us/" }],
    },
  ],
  documents: [{ name: "JR pass quick reference", type: "pdf" }],
};

/** Remaining portal rows — minimal until curated. */
const OTHER_META: { slug: string; name: string; tagline: string }[] = [
  { slug: "africa", name: "Africa", tagline: "Safari, cities, and coastlines — content coming soon." },
  { slug: "argentina", name: "Argentina", tagline: "Patagonia to Buenos Aires." },
  { slug: "australia", name: "Australia", tagline: "Coastal cities and Outback." },
  { slug: "bhutan", name: "Bhutan", tagline: "Himalayan kingdom journeys." },
  { slug: "brazil", name: "Brazil", tagline: "Amazon to Rio." },
  { slug: "canada", name: "Canada", tagline: "Rockies, cities, and Maritimes." },
  { slug: "caribbean", name: "Caribbean", tagline: "Island hopping overview." },
  { slug: "chile", name: "Chile", tagline: "Atacama to Patagonia." },
  { slug: "colombia", name: "Colombia", tagline: "Cities and coffee country." },
  { slug: "croatia", name: "Croatia", tagline: "Adriatic coast & islands." },
  { slug: "cuba", name: "Cuba", tagline: "Cultural journeys." },
  { slug: "egypt", name: "Egypt", tagline: "Nile and Red Sea." },
  { slug: "germany", name: "Germany", tagline: "Cities, castles, and Rhine." },
  { slug: "india", name: "India", tagline: "Golden Triangle & beyond." },
  { slug: "korea", name: "Korea", tagline: "Seoul and countryside." },
  { slug: "maldives", name: "Maldives", tagline: "Resort islands." },
  { slug: "malta", name: "Malta", tagline: "Mediterranean heritage." },
  { slug: "mexico", name: "Mexico", tagline: "Colonial cities & coast." },
  { slug: "morocco", name: "Morocco", tagline: "Imperial cities & desert." },
  { slug: "netherlands", name: "Netherlands", tagline: "Canals & countryside." },
  { slug: "new-zealand", name: "New Zealand", tagline: "North & South Island." },
  { slug: "peru", name: "Peru", tagline: "Andes and Amazon." },
  { slug: "poland", name: "Poland", tagline: "Historic cities." },
  { slug: "slovenia", name: "Slovenia", tagline: "Alps & Adriatic." },
  { slug: "tahiti", name: "Tahiti", tagline: "French Polynesia escapes." },
  { slug: "the-nordics", name: "The Nordics", tagline: "Fjords, cities, and aurora." },
  { slug: "turkey", name: "Turkey", tagline: "Istanbul to Cappadocia." },
  { slug: "uruguay", name: "Uruguay", tagline: "Wine & coast." },
  { slug: "usa", name: "USA", tagline: "National parks & gateways." },
];

function buildStub(m: { slug: string; name: string; tagline: string }): Destination {
  return stubDestination(m.slug, m.name, m.tagline);
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

export function listDestinationSummaries(): DestinationSummary[] {
  return Object.values(BY_SLUG).map((d) => ({
    slug: d.slug,
    name: d.name,
    tagline: d.tagline,
    heroImage: d.heroImage,
    description: d.description,
    dmcCount: d.dmcPartners.length,
    hotelCount: countHotels(d.hotels),
    restaurantCount: countRestaurants(d.restaurants),
  }));
}

export function destinationHasYachtData(d: Destination): boolean {
  return (d.yachtCompanies?.length ?? 0) > 0;
}
