/**
 * Briefing Room — widget dashboard types.
 * Frontend-only; backend built separately.
 */

import type { PipelineStage } from "@/types/itinerary";

export enum WidgetType {
  NewsAlerts = "news_alerts",
  PartnerUpdates = "partner_updates",
  ActionItems = "action_items",
  UpcomingTrips = "upcoming_trips",
  Calendar = "calendar",
  ClientIntelligence = "client_intelligence",
  CommissionAlerts = "commission_alerts",
  QuickStart = "quick_start",
  FreeText = "free_text",
  RecentActivity = "recent_activity",
  IntelligenceEmbed = "intelligence_embed",
}

/** Variants for `IntelligenceEmbedWidget` (briefing grid → intelligence-layer widgets). */
export type IntelligenceEmbedVariant =
  | "recent_activity"
  | "action_items"
  | "advisories"
  | "upcoming_trips"
  | "pre_departure"
  | "knowledge_highlights"
  | "publication_feed"
  | "product_intel";

export type WidgetSize = "small" | "medium" | "large";

export interface NewsAlertItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_icon?: string;
  thumbnail_url?: string;
  category: "renovation" | "opening" | "closure" | "safety" | "promotion" | "industry" | "regulatory";
  severity: "info" | "warning" | "urgent";
  destination?: string;
  published_at: string;
  url?: string;
  affects_products?: string[];
  affects_vics?: string[];
  /** Destination / partner tags for relevance */
  tags?: string[];
}

export interface NewsAlertContent {
  type: "news_alert";
  items: NewsAlertItem[];
}

export interface PartnerUpdateItem {
  id: string;
  partner_name: string;
  partner_logo?: string;
  update_type: "rate_change" | "new_program" | "policy_change" | "fam_trip" | "training" | "event";
  title: string;
  description: string;
  effective_date?: string;
  action_required: boolean;
  action_url?: string;
}

export interface PartnerUpdateContent {
  type: "partner_update";
  items: PartnerUpdateItem[];
}

export interface ActionItemEntry {
  id: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  due_date?: string;
  related_entity_type?: "vic" | "product" | "itinerary";
  related_entity_id?: string;
  related_entity_name?: string;
  status: "pending" | "in_progress" | "done";
  pipeline_stage?: PipelineStage | null;
  advisor_name?: string;
}

export interface ActionItemsContent {
  type: "action_items";
  items: ActionItemEntry[];
}

export interface UpcomingTripItem {
  itinerary_id: string;
  trip_name: string;
  vic_name: string;
  vic_avatar?: string;
  destinations: string[];
  departure_date: string;
  return_date: string;
  status: string;
  days_until_departure: number;
  pending_confirmations: number;
  advisor_name?: string;
}

export interface UpcomingTripsContent {
  type: "upcoming_trips";
  items: UpcomingTripItem[];
}

export interface CalendarEventItem {
  id: string;
  title: string;
  event_type: "meeting" | "trip_departure" | "trip_return" | "deadline" | "fam_trip" | "training" | "birthday" | "passport_expiry";
  date: string;
  time?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  color: string;
}

export interface CalendarContent {
  type: "calendar";
  items: CalendarEventItem[];
}

export interface QuickStartAction {
  label: string;
  icon: string;
  route: string;
  description: string;
}

export interface QuickStartContent {
  type: "quick_start";
  actions: QuickStartAction[];
}

export interface FreeTextContent {
  type: "free_text";
  body: string;
  author?: string;
  pinned: boolean;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  entity_type: "vic" | "product" | "itinerary" | "acuity";
  entity_name: string;
  entity_id: string;
  actor_name: string;
  timestamp: string;
}

export interface RecentActivityContent {
  type: "recent_activity";
  items: RecentActivityItem[];
}

export interface ClientIntelligenceItem {
  id: string;
  vic_id: string;
  vic_name: string;
  alert_type: "birthday_upcoming" | "passport_expiring" | "anniversary" | "trip_departure" | "no_contact_90d" | "loyalty_expiring";
  title: string;
  detail: string;
  date: string; // the relevant date
  days_away: number; // days until the event
  urgency: "urgent" | "soon" | "upcoming"; // <7d, <30d, <90d
  suggested_action?: string;
}

export interface ClientIntelligenceContent {
  type: "client_intelligence";
  items: ClientIntelligenceItem[];
}

export interface CommissionAlertItem {
  id: string;
  title: string;
  partner_name: string;
  incentive_type: string;
  bonus_display: string; // e.g. "+5% bonus" or "$200 spiff"
  valid_until: string;
  days_remaining: number;
  urgency: "urgent" | "soon" | "info";
  affected_vics?: { id: string; name: string }[]; // VICs with upcoming trips that could benefit
  product_ids?: string[];
}

export interface CommissionAlertContent {
  type: "commission_alerts";
  items: CommissionAlertItem[];
}

export interface IntelligenceEmbedContent {
  type: "intelligence_embed";
  variant: IntelligenceEmbedVariant;
}

export type WidgetContent =
  | NewsAlertContent
  | PartnerUpdateContent
  | ActionItemsContent
  | UpcomingTripsContent
  | CalendarContent
  | ClientIntelligenceContent
  | CommissionAlertContent
  | QuickStartContent
  | FreeTextContent
  | RecentActivityContent
  | IntelligenceEmbedContent;

export interface BriefingWidget {
  id: string;
  widget_type: WidgetType;
  title: string;
  position: number;
  size: WidgetSize;
  is_visible: boolean;
  created_by: string;
  updated_at: string;
  content: WidgetContent;
}
