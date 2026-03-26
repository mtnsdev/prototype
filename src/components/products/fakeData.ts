/**
 * Dev-only fake Product data for list, filters, and detail when API is not ready.
 * 13 products: My Products (Advisor) = 2, Agency Library = 6 (incl. Bali DMC), Enable Directory = 5.
 *
 * Unified Product Directory mocks (4-type model): see `productDirectoryMock.ts`.
 */

import type { Product } from "@/types/product";
import { COUNTRY_NAMES } from "@/config/productCategoryConfig";

const now = new Date();
const iso = (d: Date) => d.toISOString();

/** Curated Unsplash hero images (w=600 h=400 fit=crop for cards) */
const IMG = {
  fourSeasons: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
  japanDmc: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
  belmond: "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=600&h=400&fit=crop",
  oneOnly: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=400&fit=crop",
  aKItaly: "https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=600&h=400&fit=crop",
  ponant: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&h=400&fit=crop",
  scottDunn: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
  cappadocia: "https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=600&h=400&fit=crop",
  leCinq: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
  nobu: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
  helicopter: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&h=400&fit=crop",
  tuscany: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop",
};

export const FAKE_PRODUCTS: Product[] = [
  // 1. Enable — Four Seasons George V
  {
    id: "fake-enable-1",
    name: "Four Seasons George V",
    description: "Iconic palace hotel on Avenue George V. Three Michelin-starred restaurants.",
    category: "accommodation",
    subcategory: "Hotel",
    status: "active",
    hero_image_url: IMG.fourSeasons,
    country: "FR",
    city: "Paris",
    region: "Île-de-France",
    address: "31 Avenue George V",
    latitude: 48.8683,
    longitude: 2.3014,
    star_rating: 5,
    room_count: 244,
    check_in_time: "15:00",
    amenities: ["spa", "pool", "michelin restaurant", "concierge"],
    price_range: "ultra_luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    last_verified: iso(now),
    data_ownership_level: "Enable",
    commission_rate: 12,
    tags: ["luxury", "paris", "palace"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 2. Enable — DMC (directory example)
  {
    id: "fake-enable-2",
    name: "Original Travel — Japan DMC",
    description: "Curated ground services across Japan: private guides, ryokan access, bullet-train logistics, and seasonal itineraries from Hokkaido to Okinawa.",
    category: "dmc",
    subcategory: "Incoming",
    status: "active",
    hero_image_url: IMG.japanDmc,
    country: "JP",
    city: "Tokyo",
    region: "Kantō",
    destinations_covered: ["Tokyo", "Kyoto", "Hakone", "Kanazawa", "Naoshima", "Nara", "Osaka", "Hokkaido", "Okinawa"],
    service_types: ["private tours", "transfers", "MICE", "rail passes", "cultural immersion"],
    price_range: "luxury",
    partnership_tier: "partner",
    verification_status: "verified",
    last_verified: iso(now),
    data_ownership_level: "Enable",
    commission_rate: 15,
    tags: ["dmc", "japan", "luxury", "culture"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 3. Agency — Belmond Hotel Caruso
  {
    id: "fake-agency-1",
    name: "Belmond Hotel Caruso",
    description: "11th-century palace perched above the Amalfi Coast.",
    category: "accommodation",
    subcategory: "Hotel",
    status: "active",
    hero_image_url: IMG.belmond,
    country: "IT",
    city: "Ravello",
    region: "Campania",
    star_rating: 5,
    room_count: 50,
    price_range: "ultra_luxury",
    partnership_tier: "standard",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    tags: ["luxury", "amalfi", "wedding"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 4. Enable — One&Only Reethi Rah
  {
    id: "fake-enable-3",
    name: "One&Only Reethi Rah",
    description: "Expansive private island with over 6km of coastline.",
    category: "accommodation",
    subcategory: "Resort",
    status: "active",
    hero_image_url: IMG.oneOnly,
    country: "MV",
    city: "North Malé Atoll",
    star_rating: 5,
    room_count: 122,
    price_range: "ultra_luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    data_ownership_level: "Enable",
    tags: ["luxury", "beach", "family", "overwater"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 5. Agency — Abercrombie & Kent Italy
  {
    id: "fake-agency-2",
    name: "Abercrombie & Kent Italy",
    description: "Premium ground handling across 12 Italian destinations.",
    category: "dmc",
    subcategory: "Incoming",
    status: "active",
    hero_image_url: IMG.aKItaly,
    country: "IT",
    city: "Rome",
    destinations_covered: ["Rome", "Florence", "Venice", "Amalfi", "Tuscany", "Sicily", "Lake Como", "Milan", "Naples", "Puglia", "Sardinia", "Dolomites"],
    service_types: ["private tours", "transfers", "events"],
    partnership_tier: "partner",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    tags: ["dmc", "italy", "luxury"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 6. Enable — Ponant Le Commandant Charcot
  {
    id: "fake-enable-4",
    name: "Ponant Le Commandant Charcot",
    description: "World's first luxury polar exploration vessel with hybrid-electric propulsion.",
    category: "cruise",
    subcategory: "Expedition",
    status: "active",
    hero_image_url: IMG.ponant,
    country: "FR",
    city: "Marseille",
    ship_name: "Le Commandant Charcot",
    cruise_line: "Ponant",
    departure_ports: ["Longyearbyen", "Ushuaia"],
    price_range: "ultra_luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    data_ownership_level: "Enable",
    tags: ["expedition", "arctic", "luxury"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 7. Agency — Scott Dunn Private
  {
    id: "fake-agency-3",
    name: "Scott Dunn Private",
    description: "Bespoke concierge and villa rental specialists.",
    category: "service_provider",
    subcategory: "Concierge",
    status: "active",
    hero_image_url: IMG.scottDunn,
    country: "GB",
    city: "London",
    service_types: ["concierge", "villa rental", "ski"],
    verification_status: "pending",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    tags: ["concierge", "luxury"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 8. Advisor — Hot Air Balloon Cappadocia (My Products)
  {
    id: "fake-advisor-1",
    name: "Hot Air Balloon Cappadocia",
    description: "Sunrise flight over fairy chimneys and ancient cave dwellings.",
    category: "activity",
    subcategory: "Experiences",
    status: "active",
    hero_image_url: IMG.cappadocia,
    country: "TR",
    city: "Göreme",
    region: "Cappadocia",
    duration: "90 min",
    difficulty_level: "easy",
    seasonality_notes: "Apr-Nov",
    price_range: "mid",
    verification_status: "verified",
    data_ownership_level: "Advisor",
    created_by: "1",
    tags: ["adventure", "unique", "turkey"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 9. Enable — Le Cinq (Four Seasons George V)
  {
    id: "fake-enable-5",
    name: "Le Cinq (Four Seasons George V)",
    description: "Three Michelin stars. Chef Christian Le Squer's contemporary French cuisine.",
    category: "restaurant",
    subcategory: "Fine dining",
    status: "active",
    hero_image_url: IMG.leCinq,
    country: "FR",
    city: "Paris",
    michelin_stars: 3,
    cuisine_type: "French haute",
    dietary_options: ["vegetarian", "gluten-free"],
    price_range: "ultra_luxury",
    verification_status: "verified",
    data_ownership_level: "Enable",
    tags: ["michelin", "paris", "gastronomy"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 10. Agency — Nobu Matsuhisa Monaco
  {
    id: "fake-agency-4",
    name: "Nobu Matsuhisa Monaco",
    description: "Japanese-Peruvian fusion overlooking Monte Carlo.",
    category: "restaurant",
    subcategory: "Fine dining",
    status: "active",
    hero_image_url: IMG.nobu,
    country: "MC",
    city: "Monaco",
    michelin_stars: 0,
    cuisine_type: "Japanese-Peruvian",
    price_range: "luxury",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    tags: ["japanese", "monaco", "celebrity"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 11. Advisor — Luxury Helicopter Transfers Monaco (My Products)
  {
    id: "fake-advisor-2",
    name: "Luxury Helicopter Transfers Monaco",
    description: "7-minute scenic transfers along the Côte d'Azur.",
    category: "transportation",
    subcategory: "Helicopter",
    status: "active",
    hero_image_url: IMG.helicopter,
    country: "MC",
    city: "Monaco",
    vehicle_types: ["helicopter"],
    routes: ["Nice-Monaco", "Monaco-Saint-Tropez"],
    capacity: 5,
    price_range: "ultra_luxury",
    verification_status: "verified",
    data_ownership_level: "Advisor",
    created_by: "1",
    tags: ["helicopter", "transfer", "riviera"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 12. Agency — Wine Tour Tuscany
  {
    id: "fake-agency-5",
    name: "Wine Tour Tuscany",
    description: "Private visits to Brunello and Chianti Classico estates.",
    category: "activity",
    subcategory: "Experiences",
    status: "active",
    hero_image_url: IMG.tuscany,
    country: "IT",
    city: "Florence",
    region: "Tuscany",
    duration: "full day",
    difficulty_level: "easy",
    seasonality_notes: "year-round",
    price_range: "mid",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    tags: ["wine", "tuscany", "culture"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // 13. Agency — Bali DMC (layered notes demo)
  {
    id: "prod-dmc-001",
    name: "Bali Luxury Concierge — Dima",
    description:
      "High-end destination management in Bali. Specializes in cliff-edge villas, private temple tours, and luxury wellness retreats.",
    category: "dmc",
    subcategory: "Incoming",
    status: "active",
    hero_image_url: IMG.bali,
    country: "ID",
    city: "Seminyak",
    region: "Bali",
    destinations_covered: ["Bali", "Nusa Penida", "Ubud", "Uluwatu"],
    service_types: ["villas", "private tours", "wellness", "MICE"],
    price_range: "ultra_luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    commission_rate: 12,
    tags: ["dmc", "bali", "luxury"],
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
];

export type ProductFilters = {
  tab: "mine" | "agency" | "enable";
  userId?: string;
  agencyId?: string;
  search?: string;
  category?: string;
  status?: string;
  country?: string;
  partnership_tier?: string;
  price_range?: string;
  verification?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

function matchesSearch(p: Product, q: string): boolean {
  if (!q || !q.trim()) return true;
  const lower = q.toLowerCase();
  const name = (p.name ?? "").toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  const city = (p.city ?? "").toLowerCase();
  const country = (p.country ?? "").toLowerCase();
  const tags = (p.tags ?? []).join(" ").toLowerCase();
  const cat = (p.category ?? "").toLowerCase();
  const sub = (p.subcategory ?? "").toLowerCase();
  const score =
    (name.includes(lower) ? 10 : 0) +
    (desc.includes(lower) ? 5 : 0) +
    (city.includes(lower) ? 3 : 0) +
    (country.includes(lower) ? 3 : 0) +
    (tags.includes(lower) ? 4 : 0) +
    (cat.includes(lower) ? 2 : 0) +
    (sub.includes(lower) ? 2 : 0);
  return score > 0;
}

export function filterAndPaginateFakeProducts(
  products: Product[],
  filters: ProductFilters
): { products: Product[]; total: number } {
  let list = [...products];

  if (filters.tab === "mine") {
    list = list.filter((p) => (p.data_ownership_level ?? "Advisor") === "Advisor" && p.created_by === filters.userId);
  } else if (filters.tab === "agency") {
    list = list.filter((p) => (p.data_ownership_level ?? "Agency") === "Agency" && (p.agency_id ?? "") === (filters.agencyId ?? ""));
  } else if (filters.tab === "enable") {
    list = list.filter((p) => (p.data_ownership_level ?? "Enable") === "Enable");
  }

  if (filters.search) list = list.filter((p) => matchesSearch(p, filters.search!));
  if (filters.category) list = list.filter((p) => p.category === filters.category);
  if (filters.status) list = list.filter((p) => p.status === filters.status);
  if (filters.country) {
    const q = (filters.country ?? "").toLowerCase();
    list = list.filter((p) => {
      const c = p.country ?? "";
      const name = c.length === 2 ? (COUNTRY_NAMES[c] ?? "").toLowerCase() : c.toLowerCase();
      return c.toLowerCase().includes(q) || name.includes(q);
    });
  }
  if (filters.partnership_tier) list = list.filter((p) => p.partnership_tier === filters.partnership_tier);
  if (filters.price_range) list = list.filter((p) => p.price_range === filters.price_range);
  if (filters.verification) list = list.filter((p) => p.verification_status === filters.verification);

  const by = filters.sortBy ?? "name";
  const order = filters.sortOrder ?? "asc";
  list.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[by];
    const bVal = (b as unknown as Record<string, unknown>)[by];
    if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
    const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { sensitivity: "base" });
    return order === "asc" ? cmp : -cmp;
  });

  const total = list.length;
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, filters.limit ?? 20);
  const start = (page - 1) * limit;
  list = list.slice(start, start + limit);

  return { products: list, total };
}

export {
  buildDirectoryCollectionRefs,
  cloneDirectoryProduct,
  DIRECTORY_REGION_PRESETS,
  MOCK_DIRECTORY_COLLECTIONS,
  MOCK_DIRECTORY_PRODUCTS,
  getDirectoryProductById,
} from "./productDirectoryMock";
