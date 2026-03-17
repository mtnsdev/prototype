/**
 * Dev-only fake Itinerary data. 3 fully populated itineraries with day-by-day events.
 * Monaco Grand Prix (JC), Tuscany Wine & Culture (Eric), Maldives Family Retreat (Camille).
 */

import type { Itinerary, ItineraryDay, ItineraryEvent } from "@/types/itinerary";

const now = new Date();
const iso = (d: Date) => d.toISOString();

function ev(
  overrides: Partial<ItineraryEvent> & { id: string; event_type: ItineraryEvent["event_type"]; title: string }
): ItineraryEvent {
  return { status: "confirmed", ...overrides } as ItineraryEvent;
}

export const FAKE_ITINERARIES: Itinerary[] = [
  {
    id: "fake-it-1",
    agency_id: "agency-1",
    trip_name: "Monaco Grand Prix Weekend",
    description: "F1 weekend with luxury hotel, dining, and helicopter transfer.",
    primary_vic_id: "fake-vic-1",
    primary_vic_name: "Jean-Christophe Chopin",
    primary_advisor_id: "1",
    primary_advisor_name: "Marie Limousis",
    status: "confirmed",
    trip_start_date: "2026-05-23",
    trip_end_date: "2026-05-26",
    destinations: ["Monaco", "Nice, France"],
    traveler_count: 2,
    days: [
      {
        day_number: 1,
        date: "2026-05-23",
        title: "Arrival — Nice",
        location: "Nice",
        events: [
          ev({ id: "e1-1", event_type: "flight", title: "Arrival Nice Côte d'Azur", status: "confirmed" }),
          ev({
            id: "e1-2",
            event_type: "transfer",
            title: "Private helicopter transfer Nice → Monaco",
            start_time: "15:30",
            status: "confirmed",
            client_price: 2200,
            source_product_id: "fake-advisor-2",
            source_product_name: "Luxury Helicopter Transfers Monaco",
            source_product_category: "Transportation",
          }),
          ev({
            id: "e1-3",
            event_type: "stay",
            title: "Check-in Hôtel de Paris Monte-Carlo",
            start_time: "17:00",
            status: "confirmed",
            client_price: 4800,
            description: "3 nights",
          }),
          ev({
            id: "e1-4",
            event_type: "meal",
            title: "Dinner at Le Louis XV - Alain Ducasse",
            start_time: "20:00",
            status: "confirmed",
            client_price: 850,
          }),
        ],
      },
      {
        day_number: 2,
        date: "2026-05-24",
        title: "Grand Prix — Monaco",
        location: "Monaco",
        events: [
          ev({
            id: "e2-1",
            event_type: "experience",
            title: "Monaco Historic Grand Prix Paddock Tour",
            start_time: "10:00",
            status: "confirmed",
            client_price: 500,
          }),
          ev({
            id: "e2-2",
            event_type: "meal",
            title: "Lunch at Café de Paris",
            start_time: "13:00",
            status: "tentative",
            client_price: 280,
          }),
          ev({
            id: "e2-3",
            event_type: "activity",
            title: "Formula 1 Qualifying — Grandstand K",
            start_time: "15:00",
            status: "confirmed",
            client_price: 3500,
          }),
          ev({
            id: "e2-4",
            event_type: "meal",
            title: "Dinner at Nobu Matsuhisa Monte-Carlo",
            start_time: "20:30",
            status: "confirmed",
            client_price: 650,
            source_product_id: "fake-agency-4",
            source_product_name: "Nobu Matsuhisa Monaco",
            source_product_category: "Restaurant",
          }),
        ],
      },
      {
        day_number: 3,
        date: "2026-05-25",
        title: "Race Day — Monaco",
        location: "Monaco",
        events: [
          ev({ id: "e3-1", event_type: "free_time", title: "Morning at leisure / Pool & Spa", start_time: "09:00" }),
          ev({
            id: "e3-2",
            event_type: "activity",
            title: "Formula 1 Grand Prix Race Day — VIP Suite",
            start_time: "14:00",
            status: "confirmed",
            client_price: 8500,
          }),
          ev({
            id: "e3-3",
            event_type: "experience",
            title: "Victory Celebration Yacht Party",
            start_time: "19:00",
            status: "confirmed",
            client_price: 3200,
          }),
          ev({
            id: "e3-4",
            event_type: "experience",
            title: "Casino de Monte-Carlo — Private Salon",
            start_time: "22:00",
            status: "tentative",
            client_price: 1000,
          }),
        ],
      },
      {
        day_number: 4,
        date: "2026-05-26",
        title: "Departure — Monaco/Nice",
        location: "Monaco",
        events: [
          ev({ id: "e4-1", event_type: "free_time", title: "Morning at leisure", start_time: "10:00" }),
          ev({ id: "e4-2", event_type: "note", title: "Check-out Hôtel de Paris", start_time: "12:00" }),
          ev({
            id: "e4-3",
            event_type: "transfer",
            title: "Private transfer Monaco → Nice Airport",
            start_time: "13:00",
            status: "confirmed",
            client_price: 350,
          }),
          ev({ id: "e4-4", event_type: "flight", title: "Departure Nice Côte d'Azur", start_time: "15:30", status: "confirmed" }),
        ],
      },
    ],
    tags: ["vip", "motorsport", "luxury"],
    currency: "EUR",
    total_client_price: 28500,
    total_net_cost: 22000,
    total_margin: 6500,
    total_commission: 3200,
    data_ownership_level: "Advisor",
    created_by: "1",
    created_by_name: "Marie Limousis",
    created_at: iso(now),
    updated_at: iso(now),
  } as Itinerary,
  {
    id: "fake-it-2",
    agency_id: "agency-1",
    trip_name: "Tuscany Wine & Culture",
    description: "Six days in Florence, Siena, and Montepulciano.",
    primary_vic_id: "fake-vic-4",
    primary_vic_name: "Eric Tournier",
    primary_advisor_id: "1",
    primary_advisor_name: "Marie Limousis",
    status: "draft",
    destinations: ["Florence, Italy", "Siena, Italy", "Montepulciano, Italy"],
    traveler_count: 4,
    days: [
      {
        day_number: 1,
        title: "Florence",
        location: "Florence",
        events: [
          ev({ id: "t1-1", event_type: "stay", title: "Check-in Villa San Michele (Belmond)", status: "tentative", client_price: 3200 }),
          ev({ id: "t1-2", event_type: "meal", title: "Welcome dinner at Enoteca Pinchiorri", status: "tentative", client_price: 1400 }),
        ],
      },
      {
        day_number: 2,
        title: "Florence",
        location: "Florence",
        events: [
          ev({ id: "t2-1", event_type: "activity", title: "Private Uffizi Gallery Tour", status: "tentative", client_price: 600 }),
          ev({ id: "t2-2", event_type: "meal", title: "Lunch at Trattoria Mario", status: "tentative", client_price: 180 }),
          ev({ id: "t2-3", event_type: "experience", title: "Leather artisan workshop, Oltrarno", status: "tentative", client_price: 350 }),
          ev({ id: "t2-4", event_type: "meal", title: "Dinner at La Bottega del Buon Caffè", status: "tentative", client_price: 680 }),
        ],
      },
      {
        day_number: 3,
        title: "Chianti region",
        location: "Chianti",
        events: [
          ev({ id: "t3-1", event_type: "transfer", title: "Private car Florence → Chianti", status: "tentative", client_price: 280 }),
          ev({ id: "t3-2", event_type: "experience", title: "Antinori Chianti Classico winery tour + tasting", status: "tentative", client_price: 450 }),
          ev({ id: "t3-3", event_type: "meal", title: "Farm-to-table lunch at Castello di Ama", status: "tentative", client_price: 320 }),
          ev({ id: "t3-4", event_type: "experience", title: "Olive oil tasting at Laudemio estate", status: "tentative", client_price: 200 }),
        ],
      },
      {
        day_number: 4,
        title: "Siena",
        location: "Siena",
        events: [
          ev({ id: "t4-1", event_type: "transfer", title: "Private car Chianti → Siena", status: "tentative", client_price: 180 }),
          ev({ id: "t4-2", event_type: "activity", title: "Guided Siena walking tour — Piazza del Campo & Duomo", status: "tentative", client_price: 250 }),
          ev({ id: "t4-3", event_type: "stay", title: "Check-in Rosewood Castiglion del Bosco", status: "tentative", client_price: 2800 }),
          ev({ id: "t4-4", event_type: "meal", title: "Dinner at Campo del Drago (1 Michelin star)", status: "tentative", client_price: 520 }),
        ],
      },
      {
        day_number: 5,
        title: "Montepulciano / Val d'Orcia",
        location: "Val d'Orcia",
        events: [
          ev({ id: "t5-1", event_type: "experience", title: "Brunello di Montalcino private cellar tour", status: "tentative", client_price: 380 }),
          ev({ id: "t5-2", event_type: "activity", title: "Hot air balloon ride over Val d'Orcia", status: "tentative", client_price: 900, source_product_id: "fake-advisor-1", source_product_name: "Hot Air Balloon Cappadocia", source_product_category: "Activity" }),
          ev({ id: "t5-3", event_type: "meal", title: "Truffle hunting lunch experience", status: "tentative", client_price: 450 }),
        ],
      },
      {
        day_number: 6,
        title: "Departure",
        location: "Florence",
        events: [
          ev({ id: "t6-1", event_type: "free_time", title: "Morning at leisure — spa at Rosewood" }),
          ev({ id: "t6-2", event_type: "note", title: "Check-out Rosewood" }),
          ev({ id: "t6-3", event_type: "transfer", title: "Private transfer to Florence Airport", status: "tentative", client_price: 320 }),
        ],
      },
    ],
    tags: ["wine", "culture", "gastronomy"],
    currency: "EUR",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Itinerary,
  {
    id: "fake-it-3",
    agency_id: "agency-1",
    trip_name: "Maldives Family Retreat",
    description: "Eight nights at One&Only Reethi Rah.",
    primary_vic_id: "fake-vic-3",
    primary_vic_name: "Camille Signoles",
    primary_advisor_id: "1",
    primary_advisor_name: "Marie Limousis",
    status: "proposed",
    trip_start_date: "2026-07-15",
    trip_end_date: "2026-07-22",
    destinations: ["Malé, Maldives"],
    traveler_count: 5,
    days: [
      {
        day_number: 1,
        date: "2026-07-15",
        title: "Arrival",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m1-1", event_type: "flight", title: "Arrival Malé International", status: "confirmed" }),
          ev({ id: "m1-2", event_type: "transfer", title: "Speedboat transfer to One&Only Reethi Rah", status: "confirmed", client_price: 800 }),
          ev({
            id: "m1-3",
            event_type: "stay",
            title: "Check-in Grand Beach Villa with Pool",
            status: "confirmed",
            client_price: 28000,
            description: "7 nights",
            source_product_id: "fake-enable-3",
            source_product_name: "One&Only Reethi Rah",
            source_product_category: "Accommodation",
          }),
        ],
      },
      {
        day_number: 2,
        date: "2026-07-16",
        title: "Day 2",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m2-1", event_type: "activity", title: "Family snorkeling — House Reef", status: "tentative", client_price: 0 }),
          ev({ id: "m2-2", event_type: "experience", title: "Kids Club — Marine Biology Workshop", status: "tentative", client_price: 150 }),
          ev({ id: "m2-3", event_type: "meal", title: "Dinner at Tapasake (overwater Japanese)", status: "tentative", client_price: 650 }),
        ],
      },
      {
        day_number: 3,
        date: "2026-07-17",
        title: "Day 3",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m3-1", event_type: "activity", title: "Private dolphin sunset cruise", status: "tentative", client_price: 1200 }),
          ev({ id: "m3-2", event_type: "experience", title: "Couples spa — Overwater treatment suite", status: "tentative", client_price: 800 }),
          ev({ id: "m3-3", event_type: "free_time", title: "Afternoon at leisure — pool & beach" }),
        ],
      },
      {
        day_number: 4,
        date: "2026-07-18",
        title: "Day 4",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m4-1", event_type: "activity", title: "Family diving lesson (PADI Discover)", status: "tentative", client_price: 900 }),
          ev({ id: "m4-2", event_type: "meal", title: "Beach BBQ dinner — private sandbank", status: "confirmed", client_price: 1800 }),
        ],
      },
      {
        day_number: 5,
        date: "2026-07-19",
        title: "Day 5",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m5-1", event_type: "free_time", title: "Full day at leisure" }),
          ev({ id: "m5-2", event_type: "experience", title: "Sunset fishing trip", status: "tentative", client_price: 400 }),
        ],
      },
      {
        day_number: 6,
        date: "2026-07-20",
        title: "Day 6",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m6-1", event_type: "activity", title: "Jet ski tour of the atoll", status: "tentative", client_price: 600 }),
          ev({ id: "m6-2", event_type: "experience", title: "Maldivian cooking class", status: "tentative", client_price: 350 }),
          ev({ id: "m6-3", event_type: "meal", title: "Farewell dinner at Botanica", status: "tentative", client_price: 750 }),
        ],
      },
      {
        day_number: 7,
        date: "2026-07-21",
        title: "Day 7",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m7-1", event_type: "free_time", title: "Morning at leisure" }),
          ev({ id: "m7-2", event_type: "experience", title: "Professional family photo session", status: "tentative", client_price: 500 }),
        ],
      },
      {
        day_number: 8,
        date: "2026-07-22",
        title: "Departure",
        location: "Malé",
        events: [
          ev({ id: "m8-1", event_type: "note", title: "Check-out" }),
          ev({ id: "m8-2", event_type: "transfer", title: "Speedboat transfer to Malé", status: "confirmed", client_price: 800 }),
          ev({ id: "m8-3", event_type: "flight", title: "Departure Malé International", status: "confirmed" }),
        ],
      },
    ],
    tags: ["family", "beach", "wellness"],
    currency: "EUR",
    total_client_price: 42000,
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
  } as Itinerary,
];

export type ItineraryFilters = {
  tab: "mine" | "agency";
  userId?: string;
  agencyId?: string;
  search?: string;
  status?: string;
  vic_id?: string;
  destination?: string;
  date_from?: string;
  date_to?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

function matchesSearch(it: Itinerary, q: string): boolean {
  if (!q?.trim()) return true;
  const lower = q.toLowerCase();
  const name = (it.trip_name ?? "").toLowerCase();
  const desc = (it.description ?? "").toLowerCase();
  const vic = (it.primary_vic_name ?? "").toLowerCase();
  const dest = (it.destinations ?? []).join(" ").toLowerCase();
  const tags = (it.tags ?? []).join(" ").toLowerCase();
  return name.includes(lower) || desc.includes(lower) || vic.includes(lower) || dest.includes(lower) || tags.includes(lower);
}

export function filterAndPaginateFakeItineraries(
  itineraries: Itinerary[],
  filters: ItineraryFilters
): { itineraries: Itinerary[]; total: number } {
  let list = [...itineraries];

  if (filters.tab === "mine") {
    list = list.filter((it) => it.primary_advisor_id === filters.userId);
  } else if (filters.tab === "agency") {
    list = list.filter((it) => (it.agency_id ?? "") === (filters.agencyId ?? ""));
  }

  if (filters.search) list = list.filter((it) => matchesSearch(it, filters.search!));
  if (filters.status) list = list.filter((it) => it.status === filters.status);
  if (filters.vic_id) list = list.filter((it) => it.primary_vic_id === filters.vic_id);
  if (filters.destination) {
    const q = (filters.destination ?? "").toLowerCase();
    list = list.filter((it) => (it.destinations ?? []).some((d) => d.toLowerCase().includes(q)));
  }
  if (filters.date_from) list = list.filter((it) => (it.trip_end_date ?? "") >= (filters.date_from ?? ""));
  if (filters.date_to) list = list.filter((it) => (it.trip_start_date ?? "") <= (filters.date_to ?? ""));

  const by = filters.sortBy ?? "updated_at";
  const order = filters.sortOrder ?? "desc";
  list.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[by];
    const bVal = (b as unknown as Record<string, unknown>)[by];
    const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { sensitivity: "base" });
    return order === "asc" ? cmp : -cmp;
  });

  const total = list.length;
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, filters.limit ?? 20);
  const start = (page - 1) * limit;
  list = list.slice(start, start + limit);

  return { itineraries: list, total };
}
