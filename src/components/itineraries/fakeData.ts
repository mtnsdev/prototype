/**
 * Dev-only fake Itinerary data. 3 fully populated itineraries with day-by-day events.
 * Monaco Grand Prix (JC), Tuscany Wine & Culture (Eric), Maldives Family Retreat (Camille).
 */

import { itineraryMatchesDestinationCountries } from "@/components/products/locationGroups";
import type {
  Itinerary,
  ItineraryDay,
  ItineraryEvent,
  ItineraryTripOption,
  PipelineEvent,
  PipelineStage,
} from "@/types/itinerary";

const LUXURY_TUSCANY_OPTION: ItineraryTripOption = {
  id: "luxury",
  name: "Luxury Tuscany",
  total_vic_price: 35000,
  days: [
    {
      day_number: 1,
      title: "Florence",
      location: "Florence",
      events: [
        ev({ id: "lx1-1", event_type: "transfer", title: "Helicopter Florence Airport → Rosewood Castiglion", vic_price: 2800, status: "tentative" }),
        ev({ id: "lx1-2", event_type: "stay", title: "Rosewood Castiglion del Bosco — Estate Villa (6 nights)", vic_price: 18500, status: "tentative" }),
        ev({ id: "lx1-3", event_type: "meal", title: "Private chef welcome dinner — villa", vic_price: 2200, status: "tentative" }),
      ],
    },
    {
      day_number: 2,
      title: "Florence",
      location: "Florence",
      events: [
        ev({ id: "lx2-1", event_type: "activity", title: "Private Uffizi before-hours tour", vic_price: 1200, status: "tentative" }),
        ev({ id: "lx2-2", event_type: "transfer", title: "Helicopter Florence → Chianti estates", vic_price: 3200, status: "tentative" }),
        ev({ id: "lx2-3", event_type: "meal", title: "Private chef lunch — vineyard pavilion", vic_price: 1800, status: "tentative" }),
        ev({ id: "lx2-4", event_type: "meal", title: "Michelin private dining — closed restaurant buyout", vic_price: 4500, status: "tentative" }),
      ],
    },
    {
      day_number: 3,
      title: "Chianti",
      location: "Chianti",
      events: [
        ev({ id: "lx3-1", event_type: "experience", title: "Helicopter Antinori + exclusive cellar + vertical tasting", vic_price: 5500, status: "tentative" }),
        ev({ id: "lx3-2", event_type: "meal", title: "Private chef farm lunch — organic estate", vic_price: 1600, status: "tentative" }),
      ],
    },
    {
      day_number: 4,
      title: "Siena",
      location: "Siena",
      events: [
        ev({ id: "lx4-1", event_type: "transfer", title: "Helicopter Chianti → Siena", vic_price: 2400, status: "tentative" }),
        ev({ id: "lx4-2", event_type: "activity", title: "Private Palazzo + Duomo rooftop experience", vic_price: 900, status: "tentative" }),
        ev({ id: "lx4-3", event_type: "meal", title: "Private chef dinner — Rosewood terrace", vic_price: 2100, status: "tentative" }),
      ],
    },
    {
      day_number: 5,
      title: "Val d'Orcia",
      location: "Val d'Orcia",
      events: [
        ev({ id: "lx5-1", event_type: "activity", title: "Hot air balloon + helicopter Brunello circuit", vic_price: 4800, status: "tentative" }),
        ev({ id: "lx5-2", event_type: "meal", title: "Truffle hunt + private chef lunch", vic_price: 2200, status: "tentative" }),
      ],
    },
    {
      day_number: 6,
      title: "Departure",
      location: "Florence",
      events: [
        ev({ id: "lx6-1", event_type: "free_time", title: "Spa morning — Rosewood" }),
        ev({ id: "lx6-2", event_type: "transfer", title: "Helicopter Rosewood → Florence Airport", vic_price: 2200, status: "tentative" }),
      ],
    },
  ],
};

const now = new Date();
const iso = (d: Date) => d.toISOString();

/** Hero images for itinerary detail (1200×400) */
const HERO = {
  monaco: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=400&fit=crop",
  tuscany: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&h=400&fit=crop",
  maldives: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&h=400&fit=crop",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=400&fit=crop",
  lyon: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=400&fit=crop",
};

/** Event thumbnails (Unsplash) */
const THUMB = {
  helicopter: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=200&h=200&fit=crop",
  hotel: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&h=200&fit=crop",
  dining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop",
  f1: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=200&h=200&fit=crop",
  yacht: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop",
  cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  nobu: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=200&h=200&fit=crop",
  transfer: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&h=200&fit=crop",
  villa: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop",
  maldivesVilla: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=200&h=200&fit=crop",
  snorkel: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop",
  wine: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
};

function ev(
  overrides: Partial<ItineraryEvent> & { id: string; event_type: ItineraryEvent["event_type"]; title: string }
): ItineraryEvent {
  return { status: "confirmed", ...overrides } as ItineraryEvent;
}

export const FAKE_ITINERARIES: Itinerary[] = [
  {
    id: "itin-001",
    agency_id: "agency-1",
    trip_name: "Monaco Grand Prix Weekend",
    description: "F1 weekend with luxury hotel, dining, and helicopter transfer.",
    hero_image_url: HERO.monaco,
    primary_vic_id: "vic-001",
    primary_vic_name: "Jean-Christophe Chopin",
    primary_advisor_id: "1",
    primary_advisor_name: "Marco Pellegrini",
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
            vic_price: 2200,
            thumbnail_url: THUMB.helicopter,
            description: "7-minute scenic flight along the Côte d'Azur coastline. VIP arrival at Monaco helipad with private car transfer to hotel.",
            source_product_id: "prod-advisor-002",
            source_product_name: "Luxury Helicopter Transfers Monaco",
            source_product_category: "Transportation",
            confirmation_number: "HTLDP-2026-7834",
          }),
          ev({
            id: "e1-3",
            event_type: "stay",
            title: "Check-in Hôtel de Paris Monte-Carlo",
            start_time: "17:00",
            status: "confirmed",
            vic_price: 4800,
            thumbnail_url: THUMB.hotel,
            description: "Junior Suite with Casino Square view. Welcome amenities arranged. Late checkout confirmed for Day 4.",
            custom_notes: "Confirmed with helipad team. VIP arrival protocol.",
            source_product_id: "prod_001",
            source_product_name: "Aman Tokyo",
            source_product_category: "hotel",
          }),
          ev({
            id: "e1-4",
            event_type: "meal",
            title: "Dinner at Le Louis XV - Alain Ducasse",
            start_time: "20:00",
            status: "confirmed",
            vic_price: 850,
            thumbnail_url: THUMB.dining,
            description: "Alain Ducasse's three Michelin star restaurant. Chef's tasting menu reserved. Window table confirmed.",
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
            vic_price: 500,
          }),
          ev({
            id: "e2-2",
            event_type: "meal",
            title: "Lunch at Café de Paris",
            start_time: "13:00",
            status: "tentative",
            vic_price: 280,
          }),
          ev({
            id: "e2-3",
            event_type: "activity",
            title: "Formula 1 Qualifying — Grandstand K",
            start_time: "15:00",
            status: "confirmed",
            vic_price: 3500,
          }),
          ev({
            id: "e2-4",
            event_type: "meal",
            title: "Dinner at Nobu Matsuhisa Monte-Carlo",
            start_time: "20:30",
            status: "confirmed",
            vic_price: 650,
            thumbnail_url: THUMB.nobu,
            source_product_id: "prod-agency-004",
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
            vic_price: 8500,
            thumbnail_url: THUMB.f1,
            description: "Paddock Club Suite with open bar, gourmet lunch, and pit lane access. Seats 71-72, Turn 1 view.",
          }),
          ev({
            id: "e3-3",
            event_type: "experience",
            title: "Victory Celebration Yacht Party",
            start_time: "19:00",
            status: "confirmed",
            vic_price: 3200,
            source_product_id: "prod_006",
            source_product_name: "Rosewood Mayakoba",
            source_product_category: "hotel",
          }),
          ev({
            id: "e3-4",
            event_type: "experience",
            title: "Casino de Monte-Carlo — Private Salon",
            start_time: "22:00",
            status: "tentative",
            vic_price: 1000,
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
            vic_price: 350,
          }),
          ev({ id: "e4-4", event_type: "flight", title: "Departure Nice Côte d'Azur", start_time: "15:30", status: "confirmed" }),
        ],
      },
    ],
    tags: ["vip", "motorsport", "luxury"],
    currency: "EUR",
    total_vic_price: 28500,
    total_net_cost: 22000,
    total_margin: 6500,
    total_commission: 3200,
    data_ownership_level: "Advisor",
    created_by: "1",
    created_by_name: "Marco Pellegrini",
    created_at: iso(now),
    updated_at: iso(now),
    publish_state: "published_clean",
    published_version: 2,
    last_published_at: iso(new Date(Date.now() - 3 * 86400000)),
    pipeline_stage: "final_review",
    pipeline_history: [
      { from_stage: "lead", to_stage: "discovery", changed_at: "2026-01-05T09:00:00Z", changed_by: "Manon L.", note: "F1 weekend inquiry" },
      { from_stage: "discovery", to_stage: "proposal", changed_at: "2026-01-12T14:00:00Z", changed_by: "Manon L." },
      { from_stage: "proposal", to_stage: "committed", changed_at: "2026-01-20T11:00:00Z", changed_by: "Manon L.", note: "Deposit received — grandstand K confirmed" },
      { from_stage: "committed", to_stage: "preparing", changed_at: "2026-02-01T09:00:00Z", changed_by: "Manon L." },
      { from_stage: "preparing", to_stage: "final_review", changed_at: "2026-03-01T10:00:00Z", changed_by: "Manon L.", note: "Re-confirmed hotel & helicopter" },
    ] satisfies PipelineEvent[],
  } as Itinerary,
  {
    id: "itin-002",
    agency_id: "agency-1",
    trip_name: "Tuscany Wine & Culture",
    description: "Six days in Florence, Siena, and Montepulciano.",
    hero_image_url: HERO.tuscany,
    primary_vic_id: "vic-002",
    primary_vic_name: "Dominique Sarraute",
    primary_advisor_id: "1",
    primary_advisor_name: "Marco Pellegrini",
    status: "draft",
    destinations: ["Florence, Italy", "Siena, Italy", "Montepulciano, Italy"],
    traveler_count: 4,
    days: [
      {
        day_number: 1,
        title: "Florence",
        location: "Florence",
        events: [
          ev({
            id: "t1-1",
            event_type: "stay",
            title: "Check-in Villa San Michele (Belmond)",
            status: "tentative",
            vic_price: 3200,
            source_product_id: "prod-villa-001",
            source_product_name: "Villa Treville — Positano",
            source_product_category: "villa",
          }),
          ev({
            id: "t1-2",
            event_type: "meal",
            title: "Welcome dinner at Enoteca Pinchiorri",
            status: "tentative",
            vic_price: 1400,
            source_product_id: "prod-rest-001",
            source_product_name: "Mirazur — Menton",
            source_product_category: "restaurant",
          }),
        ],
      },
      {
        day_number: 2,
        title: "Florence",
        location: "Florence",
        events: [
          ev({ id: "t2-1", event_type: "activity", title: "Private Uffizi Gallery Tour", status: "tentative", vic_price: 600 }),
          ev({ id: "t2-2", event_type: "meal", title: "Lunch at Trattoria Mario", status: "tentative", vic_price: 180 }),
          ev({ id: "t2-3", event_type: "experience", title: "Leather artisan workshop, Oltrarno", status: "tentative", vic_price: 350 }),
          ev({ id: "t2-4", event_type: "meal", title: "Dinner at La Bottega del Buon Caffè", status: "tentative", vic_price: 680 }),
        ],
      },
      {
        day_number: 3,
        title: "Chianti region",
        location: "Chianti",
        events: [
          ev({ id: "t3-1", event_type: "transfer", title: "Private car Florence → Chianti", status: "tentative", vic_price: 280 }),
          ev({ id: "t3-2", event_type: "experience", title: "Antinori Chianti Classico winery tour + tasting", status: "tentative", vic_price: 450 }),
          ev({ id: "t3-3", event_type: "meal", title: "Farm-to-table lunch at Castello di Ama", status: "tentative", vic_price: 320 }),
          ev({ id: "t3-4", event_type: "experience", title: "Olive oil tasting at Laudemio estate", status: "tentative", vic_price: 200 }),
        ],
      },
      {
        day_number: 4,
        title: "Siena",
        location: "Siena",
        events: [
          ev({ id: "t4-1", event_type: "transfer", title: "Private car Chianti → Siena", status: "tentative", vic_price: 180 }),
          ev({ id: "t4-2", event_type: "activity", title: "Guided Siena walking tour — Piazza del Campo & Duomo", status: "tentative", vic_price: 250 }),
          ev({ id: "t4-3", event_type: "stay", title: "Check-in Rosewood Castiglion del Bosco", status: "tentative", vic_price: 2800 }),
          ev({ id: "t4-4", event_type: "meal", title: "Dinner at Campo del Drago (1 Michelin star)", status: "tentative", vic_price: 520 }),
        ],
      },
      {
        day_number: 5,
        title: "Montepulciano / Val d'Orcia",
        location: "Val d'Orcia",
        events: [
          ev({ id: "t5-1", event_type: "experience", title: "Brunello di Montalcino private cellar tour", status: "tentative", vic_price: 380 }),
          ev({ id: "t5-2", event_type: "activity", title: "Hot air balloon ride over Val d'Orcia", status: "tentative", vic_price: 900, source_product_id: "prod-agency-005", source_product_name: "Wine Tour Tuscany", source_product_category: "Activity" }),
          ev({ id: "t5-3", event_type: "meal", title: "Truffle hunting lunch experience", status: "tentative", vic_price: 450 }),
        ],
      },
      {
        day_number: 6,
        title: "Departure",
        location: "Florence",
        events: [
          ev({ id: "t6-1", event_type: "free_time", title: "Morning at leisure — spa at Rosewood" }),
          ev({ id: "t6-2", event_type: "note", title: "Check-out Rosewood" }),
          ev({ id: "t6-3", event_type: "transfer", title: "Private transfer to Florence Airport", status: "tentative", vic_price: 320 }),
        ],
      },
    ],
    tags: ["wine", "culture", "gastronomy"],
    currency: "EUR",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
    publish_state: "never",
    trip_options: [LUXURY_TUSCANY_OPTION],
    pipeline_stage: "post_travel",
    pipeline_history: [
      { from_stage: "lead", to_stage: "discovery", changed_at: "2025-09-01T09:00:00Z", changed_by: "Manon L." },
      { from_stage: "discovery", to_stage: "proposal", changed_at: "2025-09-10T14:00:00Z", changed_by: "Manon L." },
      { from_stage: "proposal", to_stage: "committed", changed_at: "2025-09-20T11:00:00Z", changed_by: "Manon L." },
      { from_stage: "committed", to_stage: "preparing", changed_at: "2025-10-01T09:00:00Z", changed_by: "Manon L." },
      { from_stage: "preparing", to_stage: "final_review", changed_at: "2025-10-25T09:00:00Z", changed_by: "Manon L." },
      { from_stage: "final_review", to_stage: "traveling", changed_at: "2025-11-01T06:00:00Z", changed_by: "Manon L." },
      {
        from_stage: "traveling",
        to_stage: "post_travel",
        changed_at: "2025-11-15T18:00:00Z",
        changed_by: "Manon L.",
        note: "Welcome home email sent — VICs loved it",
      },
    ] satisfies PipelineEvent[],
  } as Itinerary,
  {
    id: "itin-003",
    agency_id: "agency-1",
    trip_name: "Maldives Family Retreat",
    description: "Eight nights at One&Only Reethi Rah.",
    hero_image_url: HERO.maldives,
    primary_vic_id: "vic-003",
    primary_vic_name: "Camille Signoles",
    primary_advisor_id: "1",
    primary_advisor_name: "Marco Pellegrini",
    status: "proposed",
    trip_start_date: "2026-07-15",
    trip_end_date: "2026-07-22",
    destinations: ["Malé, Maldives"],
    traveler_count: 5,
    publish_state: "unpublished_changes",
    published_version: 1,
    last_published_at: iso(new Date(Date.now() - 14 * 86400000)),
    days: [
      {
        day_number: 1,
        date: "2026-07-15",
        title: "Arrival",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m1-1", event_type: "flight", title: "Arrival Malé International", status: "confirmed" }),
          ev({ id: "m1-2", event_type: "transfer", title: "Speedboat transfer to One&Only Reethi Rah", status: "confirmed", vic_price: 800 }),
          ev({
            id: "m1-3",
            event_type: "stay",
            title: "Check-in Grand Beach Villa with Pool",
            status: "confirmed",
            vic_price: 28000,
            description: "7 nights",
            source_product_id: "prod_002",
            source_product_name: "Four Seasons Bora Bora",
            source_product_category: "hotel",
          }),
        ],
      },
      {
        day_number: 2,
        date: "2026-07-16",
        title: "Day 2",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m2-1", event_type: "activity", title: "Family snorkeling — House Reef", status: "tentative", vic_price: 0 }),
          ev({ id: "m2-2", event_type: "experience", title: "Kids Club — Marine Biology Workshop", status: "tentative", vic_price: 150 }),
          ev({ id: "m2-3", event_type: "meal", title: "Dinner at Tapasake (overwater Japanese)", status: "tentative", vic_price: 650 }),
        ],
      },
      {
        day_number: 3,
        date: "2026-07-17",
        title: "Day 3",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m3-1", event_type: "activity", title: "Private dolphin sunset cruise", status: "tentative", vic_price: 1200 }),
          ev({ id: "m3-2", event_type: "experience", title: "Couples spa — Overwater treatment suite", status: "tentative", vic_price: 800 }),
          ev({ id: "m3-3", event_type: "free_time", title: "Afternoon at leisure — pool & beach" }),
        ],
      },
      {
        day_number: 4,
        date: "2026-07-18",
        title: "Day 4",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m4-1", event_type: "activity", title: "Family diving lesson (PADI Discover)", status: "tentative", vic_price: 900 }),
          ev({ id: "m4-2", event_type: "meal", title: "Beach BBQ dinner — private sandbank", status: "confirmed", vic_price: 1800 }),
        ],
      },
      {
        day_number: 5,
        date: "2026-07-19",
        title: "Day 5",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m5-1", event_type: "free_time", title: "Full day at leisure" }),
          ev({ id: "m5-2", event_type: "experience", title: "Sunset fishing trip", status: "tentative", vic_price: 400 }),
        ],
      },
      {
        day_number: 6,
        date: "2026-07-20",
        title: "Day 6",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m6-1", event_type: "activity", title: "Jet ski tour of the atoll", status: "tentative", vic_price: 600 }),
          ev({ id: "m6-2", event_type: "experience", title: "Maldivian cooking class", status: "tentative", vic_price: 350 }),
          ev({ id: "m6-3", event_type: "meal", title: "Farewell dinner at Botanica", status: "tentative", vic_price: 750 }),
        ],
      },
      {
        day_number: 7,
        date: "2026-07-21",
        title: "Day 7",
        location: "North Malé Atoll",
        events: [
          ev({ id: "m7-1", event_type: "free_time", title: "Morning at leisure" }),
          ev({ id: "m7-2", event_type: "experience", title: "Professional family photo session", status: "tentative", vic_price: 500 }),
        ],
      },
      {
        day_number: 8,
        date: "2026-07-22",
        title: "Departure",
        location: "Malé",
        events: [
          ev({ id: "m8-1", event_type: "note", title: "Check-out" }),
          ev({ id: "m8-2", event_type: "transfer", title: "Speedboat transfer to Malé", status: "confirmed", vic_price: 800 }),
          ev({ id: "m8-3", event_type: "flight", title: "Departure Malé International", status: "confirmed" }),
        ],
      },
    ],
    tags: ["family", "beach", "wellness"],
    currency: "EUR",
    total_vic_price: 42000,
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
    pipeline_stage: "preparing",
    pipeline_history: [
      { from_stage: "lead", to_stage: "discovery", changed_at: "2025-12-05T09:00:00Z", changed_by: "Manon L." },
      { from_stage: "discovery", to_stage: "proposal", changed_at: "2025-12-12T14:00:00Z", changed_by: "Manon L." },
      {
        from_stage: "proposal",
        to_stage: "revision",
        changed_at: "2025-12-18T10:00:00Z",
        changed_by: "Manon L.",
        note: "VIC wants water villa instead of beach villa",
      },
      {
        from_stage: "revision",
        to_stage: "committed",
        changed_at: "2025-12-22T15:30:00Z",
        changed_by: "Manon L.",
        note: "Full payment received",
      },
      {
        from_stage: "committed",
        to_stage: "preparing",
        changed_at: "2026-01-05T09:00:00Z",
        changed_by: "Manon L.",
        note: "Booking confirmed — starting concierge prep",
      },
    ] satisfies PipelineEvent[],
  } as Itinerary,
  {
    id: "itin-004",
    agency_id: "agency-1",
    trip_name: "Paris Weekend — Valérie Rousseau",
    description: "Two-night art and dining weekend.",
    hero_image_url: HERO.paris,
    primary_vic_id: "vic-014",
    primary_vic_name: "Valérie Rousseau",
    primary_advisor_id: "2",
    primary_advisor_name: "Claire Dubois",
    status: "confirmed",
    trip_start_date: "2026-04-10",
    trip_end_date: "2026-04-12",
    destinations: ["Paris"],
    traveler_count: 2,
    days: [
      { day_number: 1, date: "2026-04-10", title: "Arrival", location: "Paris", events: [ev({ id: "p1-1", event_type: "flight", title: "Arrival Paris CDG", start_time: "14:00", status: "confirmed" }), ev({ id: "p1-2", event_type: "stay", title: "Check-in Four Seasons George V", start_time: "16:00", status: "confirmed", vic_price: 2400, source_product_id: "prod-waldorf-london", source_product_name: "Waldorf Astoria London", source_product_category: "hotel" }), ev({ id: "p1-3", event_type: "meal", title: "Dinner Alain Ducasse au Plaza Athénée", start_time: "20:00", status: "confirmed", vic_price: 720 })] },
      { day_number: 2, date: "2026-04-11", title: "Art & Culture", location: "Paris", events: [ev({ id: "p2-1", event_type: "experience", title: "Private viewing — Musée d'Orsay", start_time: "10:00", status: "confirmed", vic_price: 400 }), ev({ id: "p2-2", event_type: "meal", title: "Lunch Le Cinq", start_time: "13:00", status: "confirmed", vic_price: 450 }), ev({ id: "p2-3", event_type: "free_time", title: "Afternoon at leisure", start_time: "15:00" })] },
      { day_number: 3, date: "2026-04-12", title: "Departure", location: "Paris", events: [ev({ id: "p3-1", event_type: "note", title: "Check-out", start_time: "11:00" }), ev({ id: "p3-2", event_type: "flight", title: "Departure Paris CDG", start_time: "14:00", status: "confirmed" })] },
    ],
    currency: "EUR",
    data_ownership_level: "Advisor",
    created_by: "2",
    created_at: iso(now),
    updated_at: iso(now),
    publish_state: "published_clean",
    published_version: 1,
    last_published_at: iso(new Date(Date.now() - 20 * 86400000)),
    pipeline_stage: "proposal",
    pipeline_history: [
      { from_stage: "lead", to_stage: "discovery", changed_at: "2026-02-01T10:00:00Z", changed_by: "Manon L." },
      {
        from_stage: "discovery",
        to_stage: "proposal",
        changed_at: "2026-02-10T16:00:00Z",
        changed_by: "Manon L.",
        note: "Sent 2 options via AXUS",
      },
    ] satisfies PipelineEvent[],
  } as Itinerary,
  {
    id: "itin-005",
    agency_id: "agency-1",
    trip_name: "Rome & Amalfi Short Break",
    hero_image_url: HERO.rome,
    description: "Four nights: Rome then Amalfi coast.",
    primary_vic_id: "vic-023",
    primary_vic_name: "Pierre Garnier",
    primary_advisor_id: "1",
    primary_advisor_name: "Marco Pellegrini",
    status: "in_progress",
    trip_start_date: "2026-06-01",
    trip_end_date: "2026-06-05",
    destinations: ["Rome", "Amalfi Coast"],
    traveler_count: 2,
    days: [
      { day_number: 1, date: "2026-06-01", title: "Rome", location: "Rome", events: [ev({ id: "r1-1", event_type: "flight", title: "Arrival Rome FCO", status: "confirmed" }), ev({ id: "r1-2", event_type: "stay", title: "Hotel Hassler Roma", status: "confirmed", vic_price: 1800 }), ev({ id: "r1-3", event_type: "meal", title: "Dinner La Pergola", status: "tentative", vic_price: 650 })] },
      { day_number: 2, date: "2026-06-02", title: "Rome", location: "Rome", events: [ev({ id: "r2-1", event_type: "experience", title: "Vatican private tour", status: "confirmed", vic_price: 550 }), ev({ id: "r2-2", event_type: "transfer", title: "Private car Rome → Amalfi", status: "confirmed", vic_price: 800 })] },
      { day_number: 3, date: "2026-06-03", title: "Amalfi", location: "Amalfi", events: [ev({ id: "r3-1", event_type: "stay", title: "Belmond Hotel Caruso", status: "confirmed", vic_price: 2200, description: "2 nights", source_product_id: "prod-villa-001", source_product_name: "Villa Treville — Positano", source_product_category: "villa" }), ev({ id: "r3-2", event_type: "meal", title: "Dinner at hotel", status: "tentative", vic_price: 380 })] },
      { day_number: 4, date: "2026-06-04", title: "Amalfi", location: "Ravello", events: [ev({ id: "r4-1", event_type: "activity", title: "Boat trip Positano & Capri", status: "tentative", vic_price: 1200 })] },
      { day_number: 5, date: "2026-06-05", title: "Departure", location: "Naples", events: [ev({ id: "r5-1", event_type: "transfer", title: "Car to Naples airport", status: "confirmed", vic_price: 350 }), ev({ id: "r5-2", event_type: "flight", title: "Departure Naples", status: "confirmed" })] },
    ],
    currency: "EUR",
    data_ownership_level: "Advisor",
    created_by: "1",
    created_at: iso(now),
    updated_at: iso(now),
    pipeline_stage: "committed",
    pipeline_history: [
      {
        from_stage: "lead",
        to_stage: "discovery",
        changed_at: "2026-01-10T09:00:00Z",
        changed_by: "Manon L.",
        note: "Initial call — anniversary trip for June",
      },
      { from_stage: "discovery", to_stage: "proposal", changed_at: "2026-01-15T14:30:00Z", changed_by: "Manon L." },
      {
        from_stage: "proposal",
        to_stage: "committed",
        changed_at: "2026-01-22T11:00:00Z",
        changed_by: "Manon L.",
        note: "VIC approved Option B — $2,500 deposit received",
      },
    ] satisfies PipelineEvent[],
  } as Itinerary,
  {
    id: "itin-006",
    agency_id: "agency-1",
    trip_name: "Lyon Gastronomy — Thomas Bresson",
    description: "Two-night wine and dining trip.",
    hero_image_url: HERO.lyon,
    primary_vic_id: "vic-011",
    primary_vic_name: "Thomas Bresson",
    primary_advisor_id: "2",
    primary_advisor_name: "Claire Dubois",
    status: "draft",
    trip_start_date: "2026-09-15",
    trip_end_date: "2026-09-17",
    destinations: ["Lyon", "Beaujolais"],
    traveler_count: 2,
    days: [
      { day_number: 1, date: "2026-09-15", title: "Lyon", location: "Lyon", events: [ev({ id: "l1-1", event_type: "flight", title: "Arrival Lyon", start_time: "12:00", status: "confirmed" }), ev({ id: "l1-2", event_type: "stay", title: "Villa Florentine", start_time: "15:00", status: "tentative", vic_price: 950 }), ev({ id: "l1-3", event_type: "meal", title: "Dinner Paul Bocuse (L'Auberge)", start_time: "20:00", status: "tentative", vic_price: 420, source_product_id: "prod-rest-001", source_product_name: "Mirazur — Menton", source_product_category: "restaurant" })] },
      { day_number: 2, date: "2026-09-16", title: "Beaujolais", location: "Beaujolais", events: [ev({ id: "l2-1", event_type: "activity", title: "Wine tour — Côte du Py", start_time: "09:30", status: "tentative", vic_price: 350 }), ev({ id: "l2-2", event_type: "meal", title: "Lunch at domaine", start_time: "13:00", status: "tentative", vic_price: 180 })] },
      { day_number: 3, date: "2026-09-17", title: "Departure", location: "Lyon", events: [ev({ id: "l3-1", event_type: "flight", title: "Departure Lyon", start_time: "10:00", status: "confirmed" })] },
    ],
    currency: "EUR",
    tags: [],
    data_ownership_level: "Advisor",
    created_by: "2",
    created_at: iso(now),
    updated_at: iso(now),
    publish_state: "never",
    pipeline_stage: "lead",
    pipeline_history: [] as PipelineEvent[],
  } as Itinerary,
];

export type ItineraryFilters = {
  tab: "mine" | "agency";
  userId?: string;
  agencyId?: string;
  search?: string;
  status?: string;
  pipeline_stage?: PipelineStage;
  /** When set, keep itineraries whose pipeline_stage is in this list (e.g. upcoming trips) */
  pipeline_stages_in?: PipelineStage[];
  vic_id?: string;
  destination_countries?: string[];
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
  if (filters.pipeline_stages_in?.length) {
    const allowed = new Set(filters.pipeline_stages_in);
    list = list.filter((it) => allowed.has((it.pipeline_stage ?? "lead") as PipelineStage));
  } else if (filters.pipeline_stage) {
    list = list.filter((it) => (it.pipeline_stage ?? "lead") === filters.pipeline_stage);
  }
  if (filters.vic_id) list = list.filter((it) => it.primary_vic_id === filters.vic_id);
  if (filters.destination_countries?.length) {
    list = list.filter((it) =>
      itineraryMatchesDestinationCountries(it.destinations, filters.destination_countries!)
    );
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
