/**
 * Itinerary — full trip structure, links to VIC and products.
 * Frontend-only types; backend built separately.
 */

export type ItineraryStatus =
  | "draft"
  | "proposed"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type EventType =
  | "stay"
  | "activity"
  | "meal"
  | "transfer"
  | "experience"
  | "flight"
  | "free_time"
  | "note";

export type EventStatus = "tentative" | "confirmed" | "cancelled";

export interface ItineraryEvent {
  id: string;
  event_type: EventType;
  title: string;
  description?: string;
  thumbnail_url?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  source_product_id?: string;
  source_product_name?: string;
  source_product_category?: string;
  client_price?: number;
  net_cost?: number;
  commission_rate?: number;
  commission_amount?: number;
  confirmation_number?: string;
  contact_info?: string;
  custom_notes?: string;
  status: EventStatus;
  // Type-specific (optional)
  room_type?: string;
  cuisine?: string;
  dietary_notes?: string;
  pickup_location?: string;
  dropoff_location?: string;
  vehicle_type?: string;
  flight_number?: string;
  departure_airport?: string;
  arrival_airport?: string;
}

export interface ItineraryDay {
  day_number: number;
  date?: string;
  title?: string;
  location?: string;
  events: ItineraryEvent[];
  notes?: string;
}

/** Alternative trip build (e.g. Budget vs Luxury) — frontend mock */
export interface ItineraryTripOption {
  id: string;
  name: string;
  days: ItineraryDay[];
  total_client_price?: number;
}

export type ItineraryPublishState = "never" | "published_clean" | "unpublished_changes";

export interface Itinerary {
  id: string;
  agency_id: string;
  trip_name: string;
  description?: string;
  hero_image_url?: string;
  primary_vic_id: string;
  primary_vic_name?: string;
  primary_advisor_id: string;
  primary_advisor_name?: string;
  secondary_advisor_id?: string;
  status: ItineraryStatus;
  trip_start_date?: string;
  trip_end_date?: string;
  destinations: string[];
  traveler_count?: number;
  days: ItineraryDay[];
  /** When set (draft/proposed multi-option trips), tabs switch between option day plans */
  trip_options?: ItineraryTripOption[];
  tags: string[];
  notes?: string;
  total_client_price?: number;
  total_net_cost?: number;
  total_margin?: number;
  total_commission?: number;
  currency: string;
  data_ownership_level: "Enable" | "Agency" | "Advisor";
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  last_edited_by?: string;
  last_edited_by_name?: string;
  /** Client-facing publish — mock */
  publish_state?: ItineraryPublishState;
  published_version?: number;
  last_published_at?: string;
}

export interface ItineraryListParams {
  agency_id?: string;
  search?: string;
  status?: ItineraryStatus;
  vic_id?: string;
  destination?: string;
  date_from?: string;
  date_to?: string;
  tab?: "mine" | "agency";
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ItineraryListResponse {
  itineraries: Itinerary[];
  total: number;
}
