/**
 * Product Cards — Master Registry types (Section 1).
 * Universal Product + 7 category extensions, enums, page state.
 */

// ─── Enums ─────────────────────────────────────────────────────────────────

export type ProductCategory =
  | "accommodation"
  | "dmc"
  | "cruise"
  | "service_provider"
  | "activity"
  | "restaurant"
  | "transportation";

export type ProductStatus =
  | "draft"
  | "active"
  | "inactive"
  | "pending_review"
  | "archived";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type PriceRange =
  | "budget"
  | "mid"
  | "premium"
  | "luxury"
  | "ultra_luxury";

export type CommissionType =
  | "percentage"
  | "flat"
  | "net"
  | "none";

export type PartnershipTier =
  | "preferred"
  | "partner"
  | "standard"
  | "none";

export type DataOwnershipLevel =
  | "Enable"
  | "Agency"
  | "Advisor";

// ─── Universal Product (Section 1) ─────────────────────────────────────────

export interface Product {
  id: string;
  _id?: string;

  // Core
  name: string;
  description?: string;
  category: ProductCategory;
  subcategory?: string;
  status: ProductStatus;

  // Location
  country: string; // ISO
  city: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  time_zone?: string;

  // Commercial (permission-gated)
  commission_rate?: number;
  commission_type?: CommissionType;
  payment_terms?: string;
  contract_start?: string; // ISO date
  contract_end?: string; // ISO date
  partnership_tier?: PartnershipTier;
  partner_program?: string;
  affiliated_networks?: string[];

  // Content & media
  hero_image_url?: string;
  gallery_urls?: string[];
  tags?: string[];
  best_for_occasions?: string[];

  // Client suitability
  ideal_group_size?: string;
  accessibility_features?: string[];
  languages_supported?: string[];
  age_appropriateness?: string;
  seasonality_notes?: string;
  insider_tips?: string;

  // Verification & quality
  verification_status?: VerificationStatus;
  last_verified?: string; // ISO
  quality_score?: number; // 0–100

  // Discovery
  price_range?: PriceRange;

  // Governance
  data_ownership_level?: DataOwnershipLevel;
  agency_id?: string;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at?: string; // ISO
  updated_at?: string; // ISO
  field_locks?: Record<string, boolean>;
  field_provenance?: Record<string, { source: string; at: string }>;

  // Copy-from-Enable
  enable_product_id?: string;
  source_product_id?: string;
  is_agency_copy?: boolean;
}

// ─── Category extensions (Section 1) ──────────────────────────────────────

export interface AccommodationProduct extends Product {
  category: "accommodation";
  star_rating?: number;
  room_count?: number;
  check_in_time?: string;
  check_out_time?: string;
  amenities?: string[];
}

export interface DMCProduct extends Product {
  category: "dmc";
  destinations_covered?: string[];
  service_types?: string[];
}

export interface CruiseProduct extends Product {
  category: "cruise";
  ship_name?: string;
  cruise_line?: string;
  departure_ports?: string[];
  itinerary_summary?: string;
}

export interface ServiceProviderProduct extends Product {
  category: "service_provider";
  service_types?: string[];
}

export interface ActivityProduct extends Product {
  category: "activity";
  duration?: string; // e.g. "2 hours", "half day"
  difficulty_level?: string;
  minimum_age?: number;
}

export interface RestaurantProduct extends Product {
  category: "restaurant";
  michelin_stars?: number;
  cuisine_type?: string;
  dining_style?: string;
  opening_hours?: string;
}

export interface TransportationProduct extends Product {
  category: "transportation";
  vehicle_types?: string[];
  capacity?: number;
}

export type ProductWithCategory =
  | AccommodationProduct
  | DMCProduct
  | CruiseProduct
  | ServiceProviderProduct
  | ActivityProduct
  | RestaurantProduct
  | TransportationProduct;

// ─── List & API ────────────────────────────────────────────────────────────

export interface ProductListParams {
  agency_id?: string;
  search?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  country?: string;
  partnership_tier?: PartnershipTier;
  price_range?: PriceRange;
  verification?: VerificationStatus;
  tab?: "mine" | "agency" | "enable";
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

// ─── ProductsPageState (Section 8) ─────────────────────────────────────────

export interface ProductsPageState {
  activeTab: "mine" | "agency" | "enable";
  viewMode: "list" | "cards" | "compact";
  searchQuery: string;
  categoryFilter: ProductCategory | null;
  statusFilter: ProductStatus | null;
  countryFilter: string | null;
  partnershipTierFilter: PartnershipTier | null;
  priceRangeFilter: PriceRange | null;
  verificationFilter: VerificationStatus | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
  selectedIds: Set<string>;
  products: Product[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

// ─── Product Directory (`/dashboard/products` unified view) ────────────────
export type {
  DirectoryAgencyContact,
  DirectoryAgencyNote,
  DirectoryAmenityTag,
  DirectoryCollectionOption,
  DirectoryPartnerProgram,
  DirectoryProduct,
  DirectoryProductCategory,
  DirectoryProductCollectionRef,
  DirectoryProductPromotion,
  DirectoryProductScope,
  DirectoryProgramRegistryStatus,
} from "./product-directory";
