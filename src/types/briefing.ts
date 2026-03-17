/**
 * Briefing Room — widget dashboard types.
 * Frontend-only; backend built separately.
 */

export enum WidgetType {
  NewsAlerts = "news_alerts",
  PartnerUpdates = "partner_updates",
  ActionItems = "action_items",
  UpcomingTrips = "upcoming_trips",
  Calendar = "calendar",
  QuickStart = "quick_start",
  FreeText = "free_text",
  RecentActivity = "recent_activity",
}

export type WidgetSize = "small" | "medium" | "large";

export interface NewsAlertItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_icon?: string;
  category: "renovation" | "opening" | "closure" | "safety" | "promotion" | "industry" | "regulatory";
  severity: "info" | "warning" | "urgent";
  destination?: string;
  published_at: string;
  url?: string;
  affects_products?: string[];
  affects_vics?: string[];
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

export type WidgetContent =
  | NewsAlertContent
  | PartnerUpdateContent
  | ActionItemsContent
  | UpcomingTripsContent
  | CalendarContent
  | QuickStartContent
  | FreeTextContent
  | RecentActivityContent;

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
