/** Advisor workspace — VIC profile domain types (see mock seed + tabs UI). */

export interface VICProfile {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  location: string;
  occupation?: string;
  clientSince: string;
  referredBy?: { name: string; type: "client" | "partner" | "organic"; vicId?: string };
  ltvTier: "platinum" | "gold" | "silver" | "bronze" | "pending";
  primaryAdvisorId: string;
  primaryAdvisorName: string;
  keyDates: KeyDate[];
  tags: string[];
}

export interface KeyDate {
  label: string;
  date: string;
  recurring: boolean;
}

export interface ActivityEvent {
  id: string;
  type:
    | "booking_created"
    | "proposal_sent"
    | "note_added"
    | "advisory_created"
    | "data_updated"
    | "trip_completed"
    | "payment_received";
  title: string;
  timestamp: string;
  sourceIcon?: "axus" | "tripsuite" | "manual" | "virtuoso";
  linkedEntityId?: string;
  linkedEntityType?: "trip" | "proposal" | "advisory" | "note";
}

export interface PreferenceDomain {
  id: string;
  name: "accommodation" | "dining" | "experiences" | "logistics" | "budget" | "communication" | "sensitivities";
  displayName: string;
  icon: string;
  signals: PreferenceSignal[];
}

export interface PreferenceSignal {
  id: string;
  domainId: string;
  value: string;
  confidence: "high" | "medium" | "low";
  sources: SignalSource[];
  firstObserved: string;
  lastConfirmed: string;
  lastConfirmedContext?: string;
  conflicts?: SignalConflict[];
  pinned: boolean;
}

export interface SignalSource {
  type: "booking_data" | "advisor_note" | "client_statement" | "itinerary_extraction" | "program_data";
  label: string;
  date?: string;
}

export interface SignalConflict {
  conflictingValue: string;
  source: SignalSource;
  context?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface Trip {
  id: string;
  vicId: string;
  name?: string;
  status: "completed" | "confirmed" | "in_progress" | "proposed" | "cancelled";
  type?: "leisure" | "honeymoon" | "anniversary" | "family" | "solo" | "corporate" | "bleisure";
  startDate: string;
  endDate: string;
  destinations: TripDestination[];
  totalValue?: number;
  commissionEarned?: number;
  commissionRate?: number;
  clientFeedback?: string;
  clientRating?: number;
  patternTags: string[];
  travelingWith: TripCompanion[];
}

export interface TripDestination {
  id: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  properties: TripProperty[];
  experiences: TripExperience[];
  logistics: TripLogistic[];
}

export interface TripProperty {
  id: string;
  name: string;
  brand?: string;
  roomCategory?: string;
  nights: number;
  nightlyRate?: number;
  totalCost?: number;
  commissionRate?: number;
  advisorNotes?: string;
  clientRating?: number;
}

export interface TripExperience {
  id: string;
  name: string;
  type: "cultural" | "adventure" | "wellness" | "culinary" | "nature" | "entertainment" | "transfer";
  provider?: string;
  duration?: string;
  costPerPerson?: number;
  advisorNotes?: string;
}

export interface TripLogistic {
  id: string;
  type: "flight" | "transfer" | "rail" | "ferry" | "car_rental";
  from: string;
  to: string;
  carrier?: string;
  class?: string;
  details?: string;
}

export interface TripCompanion {
  name: string;
  relationship: string;
  vicId?: string;
}

export interface Proposal {
  id: string;
  vicId: string;
  title: string;
  status: "draft" | "sent" | "reviewing" | "accepted" | "declined" | "expired";
  createdAt: string;
  sentAt?: string;
  lastStatusChange: string;
  daysSinceStatusChange: number;
  linkedTripId?: string;
  summary: string;
  destinations: string[];
  estimatedValue: number;
}

export interface ActionItem {
  id: string;
  tripId: string;
  title: string;
  dueDate?: string;
  status: "pending" | "completed" | "overdue";
  assignedTo?: string;
}

export interface Relationship {
  id: string;
  vicId: string;
  relatedPersonName: string;
  relatedVicId?: string;
  type:
    | "spouse"
    | "child"
    | "parent"
    | "sibling"
    | "extended_family"
    | "assistant"
    | "companion"
    | "referral_source"
    | "referred_client";
  dateOfBirth?: string;
  age?: number;
  contactInfo?: { email?: string; phone?: string; preferredMethod?: string };
  authorityLevel?: "full" | "limited" | "none";
  authorityLimit?: number;
  notes?: string;
  tripsTogetherCount?: number;
  sharedPreferences?: string[];
  differingPreferences?: string[];
  referralDate?: string;
  referralContext?: string;
}

export interface FinancialSummary {
  vicId: string;
  lifetimeValue: number;
  lifetimeCommission: number;
  effectiveCommissionRate: number;
  averageTripValue: number;
  totalTrips: number;
  projectedPipelineValue: number;
  projectedPipelineCommission: number;
  yearlyBreakdown: YearlyFinancial[];
  partnerBreakdown: PartnerFinancial[];
  categoryBreakdown: CategoryFinancial[];
  dataSource: "tripsuite" | "axus_partial" | "manual" | "unavailable";
}

export interface YearlyFinancial {
  year: number;
  totalValue: number;
  commission: number;
  tripCount: number;
  yoyChange?: number;
}

export interface PartnerFinancial {
  partnerName: string;
  partnerType: "hotel_brand" | "dmc" | "airline" | "cruise" | "other";
  totalValue: number;
  commission: number;
  stayCount: number;
}

export interface CategoryFinancial {
  category: "accommodation" | "experiences" | "flights" | "transfers" | "other";
  totalValue: number;
  percentage: number;
}

export interface TouchPoint {
  id: string;
  vicId: string;
  type: "call" | "email" | "meeting" | "whatsapp" | "proposal_sent" | "special_request" | "gift_sent" | "note";
  title: string;
  date: string;
  details?: string;
  linkedTripId?: string;
  linkedProposalId?: string;
  contactPerson?: string;
  direction: "inbound" | "outbound";
}

export interface SpecialRequest {
  id: string;
  vicId: string;
  request: string;
  date: string;
  status: "active" | "fulfilled" | "archived";
  linkedTripId?: string;
  source: string;
}

export interface GiftLog {
  id: string;
  vicId: string;
  description: string;
  date: string;
  occasion?: string;
  cost?: number;
  propertyOrPartner?: string;
}

export interface AdvisoryNote {
  id: string;
  vicId: string;
  category: "medical" | "commission_incentive" | "travel_warning" | "vip_status" | "payment_concern" | "general";
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  status: "active" | "resolved" | "archived";
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  linkedProductId?: string;
  linkedProgramId?: string;
  /**
   * March 31 decision: no auto-expire. Advisories are manually closed only.
   * Stale review nudge deferred to Layer 4.
   */
  dismissedAt?: string;
  dismissedBy?: string;
  isAdvisorOnly: boolean;
}

export interface SourceConflict {
  id: string;
  vicId: string;
  field: string;
  values: ConflictValue[];
  status: "unresolved" | "resolved";
  resolvedValue?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * March 31 decision: show all conflicting values, advisor resolves manually.
 * Enhanced to surface provenance (source type, provider, confidence) so the
 * advisor can make an informed choice.
 */
export interface ConflictValue {
  value: string;
  source: string;
  /** Where the value came from: manual entry, Axus import, Acuity AI, email extraction, etc. */
  source_type: "manual" | "axus" | "virtuoso" | "acuity" | "email" | "tripsuite" | "import";
  /** AI provider if source_type is "acuity" */
  provider?: "gemini" | "perplexity" | "claude";
  /** Confidence score (0-1) if AI-sourced */
  confidence?: number;
  date: string;
  context?: string;
  /** Raw excerpt from the original source for traceability */
  raw_excerpt?: string;
}

export interface AdvisorNote {
  id: string;
  vicId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  linkedTripId?: string;
  linkedContext?: string;
  tags: string[];
}

export type InternalFlag =
  | "sensitive_client"
  | "senior_advisor_approval_required"
  | "payment_history_concern"
  | "high_maintenance"
  | "referral_vip"
  | "press_sensitive";

/** Full persona payload for advisor workspace (seed + UI). */
export interface VICPersonaBundle {
  personaKey: string;
  linkedVicIds?: string[];
  profile: VICProfile;
  domains: PreferenceDomain[];
  trips: Trip[];
  proposals: Proposal[];
  actionItems: ActionItem[];
  relationships: Relationship[];
  financials: FinancialSummary;
  touchPoints: TouchPoint[];
  specialRequests: SpecialRequest[];
  giftLogs: GiftLog[];
  advisories: AdvisoryNote[];
  sourceConflicts: SourceConflict[];
  advisorNotes: AdvisorNote[];
  internalFlags: InternalFlag[];
  activity: ActivityEvent[];
}
