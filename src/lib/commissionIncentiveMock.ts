/**
 * Mock Commission Incentive Data
 *
 * 6-8 realistic commission incentives from luxury hotel brands
 * demonstrating various incentive types and urgency levels.
 */

import type { CommissionIncentive } from "@/types/commission-incentive";

const now = new Date();
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toISO = (date: Date): string => date.toISOString().split("T")[0];

export const MOCK_COMMISSION_INCENTIVES: CommissionIncentive[] = [
  // 1. Four Seasons — Urgent bonus commission (5 days remaining)
  {
    id: "ci-001",
    title: "April Flash Bonus — 3% Override",
    partner_name: "Four Seasons",
    partner_logo:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100&h=100&fit=crop",
    product_ids: [
      "prod-enable-001", // Four Seasons George V
    ],
    program_name: "Four Seasons Preferred Partners",
    incentive_type: "override",
    bonus_percentage: 3,
    currency: "USD",
    valid_from: toISO(now),
    valid_until: toISO(addDays(now, 5)),
    is_active: true,
    days_remaining: 5,
    terms_summary:
      "3% bonus override on all four Seasons properties globally. Valid for stays booked through April 5 only.",
    min_nights: 2,
    min_booking_value: 5000,
    source: "virtuoso",
    source_contact: "virtuoso@fourseasons.com",
    urgency: "high",
    created_at: toISO(addDays(now, -3)),
  },

  // 2. Aman — Virtuoso 2-month program override
  {
    id: "ci-002",
    title: "Aman Virtuoso Program Override — 2%",
    partner_name: "Aman",
    partner_logo:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=100&h=100&fit=crop",
    product_ids: [], // All Aman products
    program_name: "Aman Virtuoso",
    incentive_type: "override",
    bonus_percentage: 2,
    currency: "USD",
    valid_from: toISO(now),
    valid_until: toISO(addDays(now, 60)),
    is_active: true,
    days_remaining: 60,
    terms_summary:
      "2% override on all Aman properties. Virtuoso members only. Applies to new bookings with minimum 3 nights.",
    min_nights: 3,
    source: "virtuoso",
    source_contact: "virtuoso-partners@aman.com",
    urgency: "medium",
    created_at: toISO(addDays(now, -7)),
  },

  // 3. Belmond — FAM trip credit from rep firm
  {
    id: "ci-003",
    title: "Belmond FAM Trip Credit — May",
    partner_name: "Belmond",
    partner_logo:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
    product_ids: [
      "prod-agency-001", // Belmond Hotel Caruso
    ],
    program_name: "Belmond Preferred Partners",
    incentive_type: "fam_credit",
    bonus_flat: 2500,
    currency: "EUR",
    valid_from: toISO(addDays(now, 5)),
    valid_until: toISO(addDays(now, 35)),
    is_active: true,
    days_remaining: 35,
    terms_summary:
      "2,500 EUR FAM trip credit for complimentary 3-night stay at Belmond Hotel Caruso or other Belmond Italy properties. Must be accompanied by paying guest booking. Valid May only.",
    min_nights: 3,
    source: "rep_firm",
    source_contact: "partners@belmond.com",
    urgency: "high",
    created_at: toISO(addDays(now, -2)),
  },

  // 4. Silversea — Tiered bonus for 3+ cabin bookings
  {
    id: "ci-004",
    title: "Silversea Group Tiered Bonus",
    partner_name: "Silversea Cruises",
    partner_logo:
      "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=100&h=100&fit=crop",
    product_ids: [], // All Silversea cruises
    program_name: "Silversea Elite",
    incentive_type: "tiered_bonus",
    bonus_percentage: 5,
    currency: "USD",
    valid_from: toISO(addDays(now, -14)),
    valid_until: toISO(addDays(now, 45)),
    is_active: true,
    days_remaining: 45,
    terms_summary:
      "Tier 1: 3-4 cabins = 3% bonus. Tier 2: 5-6 cabins = 4% bonus. Tier 3: 7+ cabins = 5% bonus. Applied to expedition and luxury voyages.",
    min_booking_value: 75000,
    source: "partner_program",
    urgency: "medium",
    created_at: toISO(addDays(now, -14)),
  },

  // 5. Rosewood — Summer seasonal spiff for Mediterranean
  {
    id: "ci-005",
    title: "Rosewood Summer Mediterranean Spiff",
    partner_name: "Rosewood",
    partner_logo:
      "https://images.unsplash.com/photo-1455849318169-8d92f588aea7?w=100&h=100&fit=crop",
    product_ids: [
      "prod-enable-006", // Rosewood Mayakoba (fictional reference; use actual ID if available)
    ],
    program_name: "Rosewood Elite",
    incentive_type: "spiff",
    bonus_flat: 500,
    currency: "USD",
    valid_from: toISO(addDays(now, 45)),
    valid_until: toISO(addDays(now, 150)),
    is_active: false, // Not yet active
    days_remaining: 150,
    terms_summary:
      "500 USD spiff per booking for Mediterranean Rosewood properties (June-August departures). Minimum 4 nights, minimum 10,000 USD booking value.",
    min_nights: 4,
    min_booking_value: 10000,
    source: "email",
    source_contact: "incentives@rosewood.com",
    urgency: "low",
    created_at: toISO(addDays(now, -5)),
  },

  // 6. One&Only — Loyalty bonus commission
  {
    id: "ci-006",
    title: "One&Only Repeat Guest Bonus",
    partner_name: "One&Only",
    partner_logo:
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=100&h=100&fit=crop",
    product_ids: [
      "prod-enable-003", // One&Only Reethi Rah
    ],
    program_name: "One&Only Preferred",
    incentive_type: "bonus_commission",
    bonus_percentage: 2,
    currency: "USD",
    valid_from: toISO(addDays(now, -30)),
    valid_until: toISO(addDays(now, 90)),
    is_active: true,
    days_remaining: 90,
    terms_summary:
      "Additional 2% commission on bookings for guests with previous One&Only stay within past 3 years. Applies to all One&Only destinations.",
    min_booking_value: 5000,
    source: "partner_program",
    urgency: "low",
    created_at: toISO(addDays(now, -30)),
  },

  // 7. Ponant — Early booking incentive for expedition cruises
  {
    id: "ci-007",
    title: "Ponant Arctic Expedition Early Booking",
    partner_name: "Ponant",
    partner_logo:
      "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=100&h=100&fit=crop",
    product_ids: [
      "prod-enable-004", // Ponant Le Commandant Charcot
    ],
    program_name: "Ponant Explorer",
    incentive_type: "bonus_commission",
    bonus_percentage: 4,
    currency: "EUR",
    valid_from: toISO(now),
    valid_until: toISO(addDays(now, 20)),
    is_active: true,
    days_remaining: 20,
    terms_summary:
      "4% bonus commission on Arctic and polar voyages booked before April 20. Applies to 2026-2027 departures only.",
    min_booking_value: 25000,
    source: "email",
    source_contact: "partnerships@ponant.com",
    urgency: "high",
    created_at: toISO(addDays(now, -1)),
  },

  // 8. Virtuoso Q2 Challenge — spiff pool (manual tracking)
  {
    id: "ci-008",
    title: "Virtuoso Q2 Challenge — Luxury Hotels",
    partner_name: "Virtuoso Network",
    partner_logo:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&h=100&fit=crop",
    product_ids: [], // Multiple luxury properties
    program_name: "Virtuoso Challenge",
    incentive_type: "spiff",
    bonus_flat: 1000,
    currency: "USD",
    valid_from: toISO(addDays(now, -30)),
    valid_until: toISO(addDays(now, 60)),
    is_active: true,
    days_remaining: 60,
    terms_summary:
      "Spiff pool: 1,000 USD for reaching quarterly luxury hotel booking targets (5+ qualifying stays). Distributed at month end.",
    min_booking_value: 50000,
    source: "virtuoso",
    source_contact: "virtuoso-support@virtuoso.com",
    urgency: "medium",
    created_at: toISO(addDays(now, -30)),
  },
];

/**
 * Get all active commission incentives
 */
export function getActiveCommissionIncentives(): CommissionIncentive[] {
  const today = new Date().toISOString().split("T")[0];
  return MOCK_COMMISSION_INCENTIVES.filter(
    (ci) => ci.is_active && ci.valid_until >= today
  );
}

/**
 * Get incentives for a specific product
 */
export function getIncentivesForProduct(
  productId: string
): CommissionIncentive[] {
  return MOCK_COMMISSION_INCENTIVES.filter(
    (ci) =>
      ci.is_active &&
      (ci.product_ids.includes(productId) || ci.product_ids.length === 0)
  );
}

/**
 * Get high-urgency incentives (expiring within 10 days)
 */
export function getUrgentIncentives(): CommissionIncentive[] {
  return getActiveCommissionIncentives().filter(
    (ci) => ci.days_remaining && ci.days_remaining <= 10 && ci.urgency === "high"
  );
}
