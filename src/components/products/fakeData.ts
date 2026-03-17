/**
 * Dev-only fake Product data for list, filters, and detail when API is not ready.
 * 12 products across all 7 categories; 4 My Products (Advisor), 4 Agency Library (Agency), 4 Enable Directory (Enable).
 */

import type { Product } from "@/types/product";
import { COUNTRY_NAMES } from "@/config/productCategoryConfig";

const now = new Date();
const iso = (d: Date) => d.toISOString();

export const FAKE_PRODUCTS: Product[] = [
  // ─── Enable Directory (4) ─────────────────────────────────────────────────
  {
    id: "fake-enable-1",
    name: "Four Seasons George V",
    description: "Legendary palace hotel on Avenue George V.",
    category: "accommodation",
    subcategory: "Hotel",
    status: "active",
    country: "FR",
    city: "Paris",
    region: "Île-de-France",
    address: "31 Avenue George V",
    latitude: 48.8683,
    longitude: 2.3014,
    star_rating: 5,
    room_count: 244,
    check_in_time: "15:00",
    amenities: ["Spa", "Pool", "Restaurant", "Bar", "Concierge"],
    price_range: "luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    last_verified: iso(now),
    data_ownership_level: "Enable",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-enable-2",
    name: "Aman Tokyo",
    description: "Urban sanctuary in Otemachi.",
    category: "accommodation",
    subcategory: "Hotel",
    status: "active",
    country: "JP",
    city: "Tokyo",
    region: "Chiyoda",
    star_rating: 5,
    room_count: 84,
    price_range: "luxury",
    partnership_tier: "partner",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-enable-3",
    name: "One&Only Reethi Rah",
    description: "Private island resort in the Maldives.",
    category: "accommodation",
    subcategory: "Resort",
    status: "active",
    country: "MV",
    city: "North Malé Atoll",
    star_rating: 5,
    room_count: 130,
    price_range: "ultra_luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    data_ownership_level: "Enable",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-enable-4",
    name: "Ponant Le Commandant Charcot",
    description: "Icebreaker expedition ship for polar voyages.",
    category: "cruise",
    subcategory: "Expedition",
    status: "active",
    country: "FR",
    city: "Marseille",
    ship_name: "Le Commandant Charcot",
    cruise_line: "Ponant",
    departure_ports: ["Marseille", "Reykjavik", "Ushuaia"],
    price_range: "luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    data_ownership_level: "Enable",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // ─── Agency Library (4) ───────────────────────────────────────────────────
  {
    id: "fake-agency-1",
    name: "Belmond Hotel Caruso",
    description: "Cliff-top palazzo in Ravello with iconic infinity pool.",
    category: "accommodation",
    subcategory: "Hotel",
    status: "active",
    country: "IT",
    city: "Ravello",
    region: "Campania",
    star_rating: 5,
    room_count: 50,
    price_range: "luxury",
    partnership_tier: "standard",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-agency-2",
    name: "Abercrombie & Kent Italy",
    description: "Luxury DMC for Italy and the Mediterranean.",
    category: "dmc",
    subcategory: "Incoming",
    status: "active",
    country: "IT",
    city: "Milan",
    destinations_covered: ["Rome", "Florence", "Venice", "Amalfi", "Tuscany", "Sicily", "Lake Como", "Milan", "Naples", "Puglia", "Sardinia", "Dolomites"],
    price_range: "premium",
    partnership_tier: "partner",
    verification_status: "verified",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-agency-3",
    name: "Scott Dunn Private",
    description: "Concierge and travel design for ultra-high-net-worth clients.",
    category: "service_provider",
    subcategory: "Concierge",
    status: "active",
    country: "GB",
    city: "London",
    service_types: ["Concierge", "Travel design", "Villa rental", "Private aviation"],
    verification_status: "pending",
    data_ownership_level: "Agency",
    agency_id: "agency-1",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-agency-4",
    name: "Nobu Matsuhisa Monaco",
    description: "Japanese-Peruvian fine dining at Hotel Metropole.",
    category: "restaurant",
    subcategory: "Fine dining",
    status: "active",
    country: "MC",
    city: "Monaco",
    cuisine_type: "Japanese",
    michelin_stars: 0,
    price_range: "premium",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  // ─── My Products / Advisor (4) ─────────────────────────────────────────────
  {
    id: "fake-advisor-1",
    name: "Hot Air Balloon Cappadocia",
    description: "Sunrise balloon flight over fairy chimneys.",
    category: "activity",
    subcategory: "Experiences",
    status: "active",
    country: "TR",
    city: "Göreme",
    region: "Cappadocia",
    duration: "90 min",
    difficulty_level: "Easy",
    price_range: "mid",
    partnership_tier: "standard",
    verification_status: "verified",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-advisor-2",
    name: "Luxury Helicopter Transfers Monaco",
    description: "Helicopter transfers between Nice and Monaco.",
    category: "transportation",
    subcategory: "Helicopter",
    status: "active",
    country: "MC",
    city: "Monaco",
    vehicle_types: ["Helicopter"],
    capacity: 5,
    price_range: "luxury",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-advisor-3",
    name: "Wine Tour Tuscany",
    description: "Full-day private wine tour with tastings and lunch.",
    category: "activity",
    subcategory: "Experiences",
    status: "active",
    country: "IT",
    city: "Florence",
    region: "Tuscany",
    duration: "Full day",
    price_range: "premium",
    verification_status: "verified",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Product,
  {
    id: "fake-advisor-4",
    name: "Le Cinq (Four Seasons George V)",
    description: "Three-Michelin-starred French cuisine at Four Seasons George V.",
    category: "restaurant",
    subcategory: "Fine dining",
    status: "active",
    country: "FR",
    city: "Paris",
    michelin_stars: 3,
    cuisine_type: "French",
    dining_style: "Fine dining",
    price_range: "luxury",
    partnership_tier: "preferred",
    verification_status: "verified",
    data_ownership_level: "Enable",
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
