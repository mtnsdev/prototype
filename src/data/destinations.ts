/**
 * Static destination guide data for the VIC prototype.
 * Replace with API / Supabase fetch later — keep `getDestinationBySlug` / `listDestinationSummaries` as the boundary.
 *
 * Hotels, restaurants, DMCs, and yachts include optional `productId` to mirror catalog-linked production joins.
 */

export type DestinationDocument = {
  name: string;
  type: "pdf" | "docx" | "xlsx";
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
  pricing?: string;
  paymentProcess?: string;
  commissionProcess?: string;
  afterHours?: string;
  notes?: string;
  feedback?: string;
};

export type Restaurant = {
  /** Catalog Dining product id — name/url render from catalog in production. */
  productId?: string;
  name: string;
  url?: string;
  note?: string;
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
};

export type TourismRegion = {
  name: string;
  description?: string;
  links: { label: string; url: string }[];
  /** Tourism board or regional office contact line. */
  contact?: string;
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
  documentCount: number;
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

/* ——— Full Greece dataset (Claromentis-parity prototype counts) ——— */

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
      productId: "cat-dmc-greece-001",
      name: "Aegean Elite DMC",
      preferred: true,
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
      },
      { productId: "cat-rest-gr-002", name: "Nolan", note: "Casual fine dining, Psiri" },
      { productId: "cat-rest-gr-003", name: "CTC", url: "https://example.com/ctc", note: "Contemporary tasting menu" },
      { productId: "cat-rest-gr-004", name: "Funky Gourmet", note: "Kerameikos · creative Greek" },
      { productId: "cat-rest-gr-005", name: "Varoulko Seaside", note: "Piraeus · seafood" },
      { productId: "cat-rest-gr-006", name: "Oinomageiremata", note: "Traditional · Mets" },
      { productId: "cat-rest-gr-007", name: "Soil", url: "https://example.com/soil", note: "Farm-to-table" },
      { productId: "cat-rest-gr-008", name: "Birdman", note: "Grill & wine · downtown" },
      { productId: "cat-rest-gr-009", name: "Hytra", note: "Acropolis views · rooftop" },
      { productId: "cat-rest-gr-010", name: "Dopios", note: "Neighborhood wine bar" },
    ],
    "Athens Vicinity": [
      { productId: "cat-rest-gr-011", name: "Ithaki Vouliagmeni", note: "Seaside · Riviera" },
      { productId: "cat-rest-gr-012", name: "Ark", note: "Voula · seafood" },
      { productId: "cat-rest-gr-013", name: "Matsuhisa Athens", note: "Astir · Japanese" },
      { productId: "cat-rest-gr-014", name: "Blue Fish Vouliagmeni", note: "Casual fish" },
    ],
    Santorini: [
      { productId: "cat-rest-gr-015", name: "Selene", url: "https://example.com/selene", note: "Pyrgos" },
      { productId: "cat-rest-gr-016", name: "Metaxy Mas", note: "Tavern · Megalochori" },
      { productId: "cat-rest-gr-017", name: "Katina", note: "Ammoudi · fish" },
      { productId: "cat-rest-gr-018", name: "Lycabettus Restaurant", note: "Oia · sunset" },
      { productId: "cat-rest-gr-019", name: "Aktaion", note: "Fira · classic" },
      { productId: "cat-rest-gr-020", name: "Panorama", note: "Firostefani views" },
      { productId: "cat-rest-gr-021", name: "Roka", note: "Oia · casual" },
    ],
    Mykonos: [
      { productId: "cat-rest-gr-022", name: "Kiki's Tavern", note: "Agios Sostis · lunch only" },
      { productId: "cat-rest-gr-023", name: "Nobu Mykonos", note: "Belvedere" },
      { productId: "cat-rest-gr-024", name: "Interni", note: "Garden dining" },
      { productId: "cat-rest-gr-025", name: "Matsuhisa Mykonos", note: "Sea views" },
      { productId: "cat-rest-gr-026", name: "Bakalo", note: "Chora · Greek" },
      { productId: "cat-rest-gr-027", name: "Scorpios", note: "Paraga · beach club" },
    ],
    Crete: [
      { productId: "cat-rest-gr-028", name: "Peskesi", note: "Heraklion region · Cretan cuisine" },
      { productId: "cat-rest-gr-029", name: "Chrisostomos", note: "Chania · wood oven" },
      { productId: "cat-rest-gr-030", name: "Salis", note: "Chania harbour" },
      { productId: "cat-rest-gr-031", name: "Dounias", note: "Drakona · slow food" },
      { productId: "cat-rest-gr-032", name: "Pleiades", note: "Elounda · fine dining" },
      { productId: "cat-rest-gr-033", name: "Ntounias", note: "Village cooking" },
    ],
    Paros: [
      { productId: "cat-rest-gr-034", name: "Barbarossa", note: "Naoussa harbour" },
      { productId: "cat-rest-gr-035", name: "Sigi Ikthios", note: "Naoussa · fish" },
      { productId: "cat-rest-gr-036", name: "Tsitsanis", note: "Lefkes · taverna" },
      { productId: "cat-rest-gr-037", name: "Soso", note: "Parikia · modern Greek" },
    ],
    Peloponnese: [
      { productId: "cat-rest-gr-038", name: "Tetramythos", note: "Achaia · winery restaurant" },
      { productId: "cat-rest-gr-039", name: "Kinsterna", note: "Monemvasia · estate" },
      { productId: "cat-rest-gr-040", name: "Yialos", note: "Nafplio · harbour" },
      { productId: "cat-rest-gr-041", name: "Maris", note: "Costa Navarino" },
    ],
    Thessaloniki: [
      { productId: "cat-rest-gr-042", name: "Duck Private Cheffing", note: "Tasting menus" },
      { productId: "cat-rest-gr-043", name: "Mavri Thalassa", note: "Seafood institution" },
      { productId: "cat-rest-gr-044", name: "Charoupi", note: "Modern Anatolian" },
      { productId: "cat-rest-gr-045", name: "Sebrico", note: "Wine bar · Ladadika" },
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
      },
      {
        productId: "cat-hotel-gr-002",
        name: "Domes of Corfu, Autograph Collection",
        contact: "Sales · sales@example.com",
        repFirm: "Marriott Lux",
        url: "https://example.com/domes-corfu",
        properties: ["Domes White Coast (Milos)", "Domes Zeen (Corfu)"],
      },
      {
        productId: "cat-hotel-gr-003",
        name: "One&Only Aesthesis",
        contact: "Partner desk",
        repFirm: "O&O preferred",
        url: "https://example.com/oneonly-aesthesis",
        properties: ["Glyfada coast"],
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
      },
      {
        productId: "cat-hotel-gr-005",
        name: "Cavo Tagoo",
        contact: "Reservations",
        url: "https://example.com/cavotagoo",
      },
      {
        productId: "cat-hotel-gr-006",
        name: "Myconian Ambassador",
        contact: "Groups",
        repFirm: "Relais & Châteaux liaison",
        note: "Platis Gialos",
      },
    ],
    Santorini: [
      {
        productId: "cat-hotel-gr-007",
        name: "Canaves Oia Epitome",
        contact: "Sales",
        repFirm: "Preferred portfolio",
        properties: ["Epitome", "Canaves suites"],
      },
      {
        productId: "cat-hotel-gr-008",
        name: "Grace Hotel Santorini",
        contact: "Luxury sales",
        url: "https://example.com/grace-santorini",
      },
      {
        productId: "cat-hotel-gr-009",
        name: "Katikies Santorini",
        contact: "Reservations",
        note: "Oia cliff",
      },
    ],
    Athens: [
      {
        productId: "cat-hotel-gr-010",
        name: "Hotel Grande Bretagne",
        contact: "Luxury sales",
        repFirm: "LHW",
        url: "https://example.com/gb",
      },
      {
        productId: "cat-hotel-gr-011",
        name: "Four Seasons Astir Palace",
        contact: "Partner services",
        url: "https://example.com/fs-astir",
      },
      {
        productId: "cat-hotel-gr-012",
        name: "King George",
        contact: "City desk",
        note: "Syntagma",
      },
    ],
    "Paros & Milos": [
      {
        productId: "cat-hotel-gr-013",
        name: "Parilio Hotel Paros",
        contact: "Bookings",
        repFirm: "Design hotels",
        note: "Naoussa adjacency",
      },
      {
        productId: "cat-hotel-gr-014",
        name: "White Coast Pool Suites",
        contact: "Sales",
        properties: ["Milos"],
      },
    ],
    Crete: [
      {
        productId: "cat-hotel-gr-015",
        name: "Blue Palace Elounda",
        contact: "Luxury desk",
        url: "https://example.com/blue-palace",
      },
      {
        productId: "cat-hotel-gr-016",
        name: "Domes Zeen Chania",
        contact: "Reservations",
        note: "Family-friendly",
      },
    ],
    Peloponnese: [
      {
        productId: "cat-hotel-gr-017",
        name: "The Westin Resort Costa Navarino",
        contact: "Golf & spa desk",
        repFirm: "Marriott STARS",
        url: "https://example.com/costa-navarino",
      },
    ],
  },
  yachtCompanies: [
    {
      productId: "cat-yacht-gr-001",
      name: "Ionian Charter Co.",
      contact: "charter@example.com · +30 210 111 2222",
      url: "https://example.com/ionian-charter",
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
    { name: "Greece — advisor commission cheat sheet", type: "pdf" },
    { name: "Island ferry timing guidelines", type: "docx" },
    { name: "Peak season hotel release calendar", type: "xlsx" },
    { name: "GNTO marketing toolkit — Greece 2026", type: "pdf" },
    { name: "Santorini & Mykonos vendor contacts", type: "docx" },
    { name: "Mainland driving times & tolls", type: "pdf" },
    { name: "Yacht charter terms & insurance checklist", type: "pdf" },
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
  heroImage:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&auto=format&fit=crop",
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
  heroImage:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80&auto=format&fit=crop",
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
    documentCount: d.documents.length,
  }));
}

export function destinationHasYachtData(d: Destination): boolean {
  return (d.yachtCompanies?.length ?? 0) > 0;
}
