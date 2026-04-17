/**
 * Commission Incentive Advisory Types
 *
 * Temporary commission incentives linked to products/programs,
 * surfaced proactively during search and itinerary building,
 * and feed into commission projections.
 */

export interface CommissionIncentive {
  id: string;
  /** Display title */
  title: string;
  /** Partner/program name */
  partner_name: string;
  partner_logo?: string;
  /** Which products this applies to (empty = all partner products) */
  product_ids: string[];
  /** Which program this belongs to */
  program_name?: string;
  /** Incentive details */
  incentive_type:
    | "bonus_commission"
    | "override"
    | "spiff"
    | "tiered_bonus"
    | "fam_credit";
  /** Additional commission percentage on top of base */
  bonus_percentage?: number;
  /** Flat bonus amount */
  bonus_flat?: number;
  currency: string;
  /** Validity window */
  valid_from: string; // ISO date
  valid_until: string; // ISO date
  /** Is it currently active? */
  is_active: boolean;
  /**
   * March 31 decision: no auto-expire. Advisories are manually dismissed.
   * days_remaining is informational only — it does NOT auto-close the incentive.
   */
  days_remaining?: number;
  /** Advisor manually dismissed this incentive */
  dismissed_at?: string;
  dismissed_by?: string;
  /** Terms and conditions summary */
  terms_summary: string;
  /** Booking requirements */
  min_nights?: number;
  min_booking_value?: number;
  /** How this was discovered */
  source:
    | "virtuoso"
    | "partner_program"
    | "email"
    | "manual"
    | "rep_firm";
  source_contact?: string;
  /** Urgency for surfacing */
  urgency: "high" | "medium" | "low";
  created_at: string;
}
