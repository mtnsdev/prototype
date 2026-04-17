/**
 * Product Directory (unified /dashboard/products) — advisor catalog categories.
 * Distinct from master registry `Product` in product.ts (ProductsPage legacy).
 *
 * Rep firms are not a product category: they live in the rep firm registry + tab
 * and link to catalog products via `repFirmLinks`.
 */

import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import type { RepFirmProductLink } from "@/types/rep-firm";

export type DirectoryProductCategory =
  | "hotel"
  | "villa"
  | "restaurant"
  | "dmc"
  | "experience"
  | "cruise"
  | "wellness"
  | "transport";

/** `private` = advisor-only; `agency` = agency catalog; else team id (KV-aligned). */
export type DirectoryProductScope = "private" | "agency" | string;

/** Directory-facing row for a time-bound program incentive (merged from registry `Incentive`). */
export interface DirectoryProductIncentive {
  id: string;
  /** Display-only resolved rate for timelines / admin tooling — cards use guaranteed base only. */
  effectiveRate: number;
  bookingStart: string;
  bookingEnd: string;
  travelStart: string;
  travelEnd: string;
  /** Short label shown in directory / partner programs (e.g. “Spring bonus”). */
  title?: string;
  /** Advisor-facing terms, stacking rules, or internal notes for the incentive. */
  details?: string;
  /** Mirrors registry `Incentive.rateType`. Omitted legacy rows default to percentage in the UI. */
  rateType?: "percentage" | "flat";
  /** Registry: whether the incentive stacks with the base program commission. */
  stacksWithBase?: boolean;
  /** Volume incentive metric when set on the registry incentive. */
  volumeMetric?: "room_nights" | "bookings" | "revenue";
  volumeThreshold?: number | null;
  volumeRetroactive?: boolean;
}

/** @deprecated Use `DirectoryProductIncentive`. */
export type DirectoryProductPromotion = DirectoryProductIncentive;

/**
 * A temporary commission incentive advisory linked to a product and/or program.
 * Modeled as an advisory (not a promotion) — advisors see it as proactive intelligence,
 * not a discount. Source can be a rep firm, partner program, or internal.
 */
export interface CommissionAdvisory {
  id: string;
  /** Which product this advisory applies to (required). */
  productId: string;
  /** Optionally scoped to a specific partner program on this product. */
  programId?: string;
  /** Human-readable title (e.g. "Summer Bonus — Virtuoso"). */
  title: string;
  /** Longer advisor-facing description with terms, stacking rules, booking codes. */
  details?: string;
  /**
   * What kind of incentive this is.
   */
  incentiveType: "bonus_percentage" | "bonus_flat" | "override" | "tier_upgrade";
  /**
   * Numeric value of the incentive:
   * - bonus_percentage: e.g. 2 means +2% on top of base
   * - bonus_flat: e.g. 150 means +$150 per booking
   * - override: e.g. 18 means commission overridden to 18%
   * - tier_upgrade: null (tier upgrade has no numeric value, just qualitative)
   */
  incentiveValue?: number;
  /** Date range the incentive is valid for (ISO strings). */
  validFrom: string;
  validUntil: string;
  /** Where this incentive comes from. */
  source: "rep_firm" | "partner_program" | "internal" | "virtuoso";
  /** Display name of the source (e.g. "LUSH Experiences", "Virtuoso Wanderlist"). */
  sourceName: string;
  /** Advisory lifecycle. Manual close only — no auto-expire. */
  status: "active" | "upcoming" | "expired" | "dismissed";
  /** Who dismissed it and when (null if still active/upcoming). */
  dismissedAt?: string;
  dismissedBy?: string;
  /** Audit trail. */
  createdAt: string;
  updatedAt?: string;
}

/** Structured amenity tags for program/amenity filters and card highlights. */
export type DirectoryAmenityTag =
  | "breakfast"
  | "spa-credit"
  | "room-upgrade"
  | "late-checkout"
  | "early-checkin"
  | "hotel-credit"
  | "airport-transfer"
  | "welcome-amenity"
  | "club-lounge"
  | "complimentary-night"
  | "dining-credit"
  | "house-car"
  | "dedicated-host";

/** Partner program lifecycle in the registry (filters + detail UI). */
export type DirectoryProgramRegistryStatus = "active" | "expiring-soon" | "expired" | "inactive";

export interface DirectoryPartnerProgram {
  id: string;
  /** Display name (legacy; prefer programName when both set). */
  name: string;
  /** Stable id for filters (e.g. prog-virtuoso). Defaults to `id` in helpers when omitted. */
  programId?: string;
  programName?: string;
  /** Enable-curated vs team scope — detail panel badge. */
  scope?: "enable" | string;
  commissionRate: number | null;
  expiryDate: string | null;
  contact?: string;
  activeIncentives: DirectoryProductIncentive[];
  /** Free-text amenities copy for the detail panel. */
  amenities?: string;
  amenityTags?: DirectoryAmenityTag[];
  commissionType?: "percentage" | "flat";
  /** Explicit registry state; when omitted, derived from expiry + legacy `status`. */
  registryStatus?: DirectoryProgramRegistryStatus;
  /** Legacy: omitted = active */
  status?: "active" | "inactive";
  /** Audit metadata for admin edits. */
  lastEditedAt?: string;
  lastEditedById?: string;
  lastEditedByName?: string;
}

export interface DirectoryAgencyContact {
  id: string;
  name: string;
  role: string;
  /** Multiple email addresses for one person. When set, drives display; `email` mirrors the first row for legacy code. */
  emailAddresses?: string[];
  /** Multiple phone numbers for one person. When set, drives display; `phone` mirrors the first row for legacy code. */
  phoneNumbers?: string[];
  /** First email or "—" — kept in sync when saving from UI */
  email: string;
  /** First phone or "—" — kept in sync when saving from UI */
  phone: string;
  note?: string;
  addedBy?: string;
  addedById?: string;
  /** ISO — when the contact was added (prototype / audit). */
  addedAt?: string;
  /** Submitted from private contacts; awaiting admin approval. */
  pendingUpgrade?: boolean;
  upgradedById?: string;
  upgradedByName?: string;
}

export interface DirectoryProductCollectionRef {
  id: string;
  name: string;
  scope: "private" | "mirrors_source" | string;
}

export interface DirectoryAgencyNote {
  id: string;
  authorName: string;
  /** Optional stable id for permissions / attribution. */
  authorId?: string;
  text: string;
  createdAt: string;
  /** Submitted from personal notes; awaiting admin approval. */
  pendingUpgrade?: boolean;
  upgradedById?: string;
  upgradedByName?: string;
  pinned?: boolean;
}

export interface DirectoryProduct {
  id: string;
  name: string;
  /** Hero image for cards and detail panel. */
  imageUrl: string;
  /** Additional gallery images for detail (exclude the hero URL). */
  imageGalleryUrls?: string[];
  website?: string;
  /** Advisor-facing tier / enrichment (directory mocks). */
  tier?: DirectoryTierLevel;
  /** Legacy single-band display; when `priceBands` is set, first band should stay in sync for filters. */
  priceTier?: DirectoryPriceTier;
  /** Up to five price bands (spec). Display joins with middots; filters match if any band is selected. */
  priceBands?: DirectoryPriceTier[];
  enrichmentScore?: number;
  tags?: string[];
  /** Category-specific (optional). */
  starRating?: number;
  roomCount?: number;
  michelinStars?: number;
  cuisine?: string;
  duration?: string;
  groupSize?: string;
  cruiseLine?: string;
  destinations?: string;
  bedrooms?: number;
  maxGuests?: number;
  specialty?: string;
  vehicleType?: string;
  capacity?: string;
  location: string;
  /** Optional — used in map sidebar as “City, Country”; defaults to `location`. */
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  /** One or more directory categories (e.g. from Google Places mapping). */
  types: DirectoryProductCategory[];
  /** Raw Google Places types when provided by search/API (optional; aids DMC detection). */
  google_types?: string[];
  region: string;
  description: string;
  scope: DirectoryProductScope;
  baseCommissionRate: number | null;
  effectiveCommissionRate: number | null;
  /** First active registry incentive on the top bookable program (optional; cards use `getActiveIncentiveOfferCount`). */
  activeIncentive: DirectoryProductIncentive | null;
  /** Temporary commission incentive advisories linked to this product. */
  commissionAdvisories?: CommissionAdvisory[];
  /** Count of active commission advisories only; for the product-card flame badge use `getActiveIncentiveOfferCount` (advisories + partner-program incentives). */
  activeAdvisoryCount?: number;
  /** Aggregate rate for list cards / “Has rate” filter (null = unrated). */
  commissionRate: number | null;
  partnerProgramCount: number;
  collectionCount: number;
  collectionIds: string[];
  partnerPrograms: DirectoryPartnerProgram[];
  repFirmLinks: RepFirmProductLink[];
  repFirmCount: number;
  agencyContacts: DirectoryAgencyContact[];
  collections: DirectoryProductCollectionRef[];
  /** Team-scoped enrichment (programs, team notes, contacts). */
  hasTeamData?: boolean;
  /** Current advisor has saved personal notes. */
  hasAdvisorNotes?: boolean;
  /** ISO — when the product was first added to the directory. */
  addedAt?: string;
  /** ISO — last registry / enrichment update. */
  updatedAt?: string;
  /**
   * Planned opening (hotels/cruises). Displayed on cards/detail when set.
   * Prefer ISO date; optional `openingLabel` overrides formatting (e.g. “Q2 2026”).
   */
  openingDate?: string | null;
  openingLabel?: string | null;

  /** DMC operational fields (populated for DMC-type products; null or omitted for others). */
  general_requests_email?: string | null;
  pricing_model?: string | null;
  payment_process?: string | null;
  commission_process?: string | null;
  after_hours_support?: string | null;
  destinations_served?: string | null;
  repped_by?: string | null;
}

export interface DirectoryCollectionOption {
  id: string;
  name: string;
  scope: "private" | "team";
  ownerId: string;
  ownerName?: string;
  teamId: string | null;
  teamName?: string;
  description?: string;
  /** Canonical member ids for header count (live count also derived from products). */
  productIds?: string[];
  /** System collections (e.g. External Search) cannot be renamed or deleted. */
  isSystem?: boolean;
  /** Optional icon key for UI (e.g. `search`). */
  icon?: string;
  createdAt?: string;
}

/** Mock / analytics metadata for products saved into the External Search system collection. */
export interface DirectoryExternalSearchMeta {
  savedAt: string;
  savedBy: string;
  searchQuery?: string;
  sourceConversation?: number;
}

/** Payload when creating a collection from the add-to-collection picker. */
export type NewDirectoryCollectionInput = {
  name: string;
  description?: string;
  scope: "private" | "team";
  /** Required when `scope` is `"team"` */
  teamId: string | null;
};
