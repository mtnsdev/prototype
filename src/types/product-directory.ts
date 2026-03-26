/**
 * Product Directory (unified /dashboard/products) — 8-type advisor catalog.
 * Distinct from master registry `Product` in product.ts (ProductsPage legacy).
 */

import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";

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

export interface DirectoryProductPromotion {
  id: string;
  effectiveRate: number;
  bookingStart: string;
  bookingEnd: string;
  travelStart: string;
  travelEnd: string;
  /** Short label shown in directory / partner portal (e.g. “Spring bonus”). */
  title?: string;
  /** Advisor-facing terms, stacking rules, or internal notes for the incentive. */
  details?: string;
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
  | "dining-credit";

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
  activePromotions: DirectoryProductPromotion[];
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
  email: string;
  phone: string;
  note?: string;
  addedBy?: string;
  addedById?: string;
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
  priceTier?: DirectoryPriceTier;
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
  type: DirectoryProductCategory;
  region: string;
  description: string;
  scope: DirectoryProductScope;
  baseCommissionRate: number | null;
  effectiveCommissionRate: number | null;
  activePromotion: DirectoryProductPromotion | null;
  /** Aggregate rate for list cards / “Has rate” filter (null = unrated). */
  commissionRate: number | null;
  partnerProgramCount: number;
  collectionCount: number;
  collectionIds: string[];
  partnerPrograms: DirectoryPartnerProgram[];
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
