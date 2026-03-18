/**
 * VIC (Very Important Client) — full frontend spec types.
 * Section 3: interfaces, enums, and page state.
 */

// ─── Enums (Section 3) ─────────────────────────────────────────────────────

export type RelationshipStatus =
  | "active"
  | "inactive"
  | "prospect"
  | "past"
  | "do_not_contact";

export type AcuityStatus = "not_run" | "running" | "complete" | "failed";

export type TravelProfileType =
  | "business"
  | "leisure"
  | "romantic"
  | "adventure"
  | "wellness"
  | "cultural"
  | "celebration";

export type SharingLevel = "none" | "basic" | "full";

export type AccessLevel = "view" | "edit";

// ─── SharedAccess (Section 3) ───────────────────────────────────────────────

export interface SharedAccess {
  advisor_id: string;
  advisor_name?: string;
  access_level: AccessLevel;
  shared_at: string; // ISO
}

// ─── LoyaltyProgram (Section 3) ────────────────────────────────────────────

export interface LoyaltyProgram {
  id: string;
  program_name: string;
  membership_id: string; // stored masked for display unless canViewSensitiveFields
  tier?: string;
  added_at?: string; // ISO
}

// ─── TravelProfile (Section 3.1) ───────────────────────────────────────────

export interface TravelProfile {
  id: string;
  profile_type: TravelProfileType;
  is_primary: boolean;
  preferences_summary?: string;
  ai_confidence?: number; // 0–1
  // Full preferences (detail)
  destinations?: string[];
  accommodation_preferences?: string;
  pace?: string; // e.g. "relaxed" | "moderate" | "fast"
  budget_tier?: string;
  special_requests?: string;
  created_at?: string;
  updated_at?: string;
  // Optional detail fields for inline card
  accommodation_types?: string[];
  cuisine_preferences?: string[];
  cabin_class?: string;
  travel_pace?: string;
  budget_range?: string;
  destinations_preferred?: string[];
  source?: "acuity" | "manual";
}

// ─── Acuity / field provenance (Section 3) ──────────────────────────────────

export type FieldProvenanceSource = "acuity" | "manual" | "import" | "inferred_from_trip";

/** Per-field provenance: Acuity-enriched fields use source acuity; manual/import never show Acuity badge */
export interface FieldProvenance {
  source: FieldProvenanceSource;
  provider?: string; // gemini | perplexity | claude (display-capitalized)
  confidence?: "high" | "medium" | "low";
  sourced_at?: string; // ISO
  verified?: boolean;
  /** Original source snippet shown in badge detail */
  raw_excerpt?: string;
}

export interface RelationshipInsight {
  id: string;
  text: string;
  provider?: string;
  sourced_at?: string;
}

export interface TravelDiscoveredPreference {
  id: string;
  text: string;
  profile_type?: TravelProfileType;
  provider?: string;
  sourced_at?: string;
}

// ─── VIC (Section 3) — full model ──────────────────────────────────────────

export interface VIC {
  id: string;
  /** @deprecated use id */
  _id?: string;

  // Core Identity
  full_name: string;
  preferred_name?: string;
  title?: string;
  email?: string;
  email_secondary?: string;
  phone_primary?: string;
  phone_secondary?: string;
  nationality?: string; // ISO country
  date_of_birth?: string; // ISO date
  home_address?: string;
  home_city?: string;
  home_country?: string; // ISO
  time_zone?: string; // IANA
  language_primary?: string;
  languages_spoken?: string[];

  // Relationship
  assigned_advisor_id?: string;
  assigned_advisor_name?: string;
  secondary_advisor_id?: string;
  secondary_advisor_name?: string;
  client_since?: string; // ISO date
  referral_source?: string;
  referred_by_vic_id?: string;
  referred_by_vic_name?: string;
  relationship_status?: RelationshipStatus;
  vip_notes?: string;

  // Preferences & Tags
  tags?: string[];
  dietary_restrictions?: string;
  accessibility_needs?: string;
  gdpr_consent_given?: boolean;
  gdpr_consent_date?: string; // ISO
  marketing_consent?: boolean;
  data_retention_until?: string; // ISO

  // Documents (sensitive — mask unless canViewSensitiveFields)
  passport_number?: string;
  passport_country?: string;
  passport_expiry?: string; // ISO date
  known_traveler_number?: string;
  loyalty_programs?: LoyaltyProgram[];

  // Travel profiles
  travel_profiles?: TravelProfile[];

  // Acuity
  acuity_status?: AcuityStatus;
  acuity_last_run?: string; // ISO
  acuity_profile?: string; // rich text when complete
  acuity_provider?: string; // e.g. "Gemini", "Perplexity"
  acuity_confidence?: "high" | "medium" | "low";
  field_provenance?: Record<string, FieldProvenance>;
  relationship_insights?: RelationshipInsight[];
  travel_discovered_preferences?: TravelDiscoveredPreference[];

  // Sharing
  sharing_level?: SharingLevel;
  shared_with?: SharedAccess[];
  is_shared_to_agency?: boolean;

  // Governance
  data_ownership_level?: "personal" | "agency";
  created_by?: string;
  created_by_name?: string;
  /** @deprecated use created_by */
  createdBy?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at?: string; // ISO
  updated_at?: string; // ISO
  field_locks?: Record<string, boolean>;
  provenance?: Record<string, { source: string; at: string }>;
  edit_history?: { by: string; at: string; change: string }[];

  // Legacy/compat (old API shape)
  /** @deprecated use tags */
  customTags?: string[];
  /** @deprecated use home_city / home_country */
  city?: string;
  country?: string;
  company?: string;
  role?: string;
  notes?: string;
  createdByName?: string;
  /** @deprecated use acuity_status */
  acuityStatus?: AcuityStatus;
  /** @deprecated use acuity_last_run */
  acuityLastRun?: string;
  /** @deprecated use acuity_profile */
  acuityProfile?: string;
  phone?: string;
  familyContext?: string;
  preferences?: string;
  loyaltyPrograms?: string;
  additionalContext?: string;
  /** @deprecated use created_at */
  createdAt?: string;

  // Linked entities (ids for list; full in detail)
  linked_product_ids?: string[];
  linked_itinerary_ids?: string[];
}


// ─── List params (Section 9) ───────────────────────────────────────────────

export interface VICListParams {
  agency_id?: string;
  search?: string;
  tab?: "mine" | "shared" | "agency";
  status?: RelationshipStatus;
  tags?: string; // comma-separated
  country?: string; // home_country ISO
  acuity_status?: AcuityStatus;
  assigned_advisor_id?: string;
  passport_expiry_warning?: boolean; // filter <180d
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
  /** @deprecated use sort_by */
  sortBy?: string;
  /** @deprecated use sort_order */
  sortOrder?: "asc" | "desc";
  /** @deprecated use acuity_status */
  acuityStatus?: AcuityStatus;
}

export interface VICListResponse {
  vics: VIC[];
  total: number;
}

// ─── AcuitySettings (existing) ─────────────────────────────────────────────

export interface AcuitySettings {
  requester_type: string;
  requester_name: string;
  requester_location: string;
  requester_focus?: string;
}

// ─── VICsPageState (Section 8) ─────────────────────────────────────────────

export interface VICsPageState {
  // Tab
  activeTab: "mine" | "shared" | "agency";

  // View
  viewMode: "list" | "cards";

  // Filters (toolbar)
  searchQuery: string;
  relationshipStatus: RelationshipStatus | null;
  tags: string[];
  homeCountry: string | null;
  acuityStatus: AcuityStatus | null;
  assignedAdvisorId: string | null;
  passportExpiryWarning: boolean;

  // Sort
  sortBy: string;
  sortOrder: "asc" | "desc";

  // Pagination
  page: number;
  limit: number;

  // Selection (bulk)
  selectedIds: Set<string>;

  // Data
  vics: VIC[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}
