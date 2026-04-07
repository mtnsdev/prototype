export type RecentActivityType = "vic" | "document" | "product" | "search" | "itinerary";

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
  route: string;
}

export type ActionItemPriority = "urgent" | "normal" | "low";

export interface ActionItem {
  id: string;
  priority: ActionItemPriority;
  description: string;
  source: string;
  dueDate?: string;
  route?: string;
}

export type AdvisorySeverity = "critical" | "warning" | "info";

export type AdvisoryCategory = "safety" | "entry-requirement" | "weather" | "disruption";

export interface Advisory {
  id: string;
  severity: AdvisorySeverity;
  destination: string;
  summary: string;
  category: AdvisoryCategory;
  personalizedContext?: string;
}

export interface UpcomingTrip {
  id: string;
  clientName: string;
  destination: string;
  departureDate: string;
  daysUntil: number;
  status: string;
}

export interface PreDepartureTrigger {
  id: string;
  clientName: string;
  destination: string;
  daysUntil: number;
  checklistItems: string[];
  completedCount: number;
}

export type KnowledgeHighlightScope = "private" | "team";

export interface KnowledgeHighlight {
  id: string;
  title: string;
  source: string;
  date: string;
  scope: KnowledgeHighlightScope;
  viewCount: number;
  isNew: boolean;
}

export interface PublicationItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  destinationTags: string[];
  publishedAt: string;
  url: string;
}

export type ProductUpdateType = "new" | "rate-change" | "program-update" | "amenity";

export interface ProductUpdate {
  id: string;
  productName: string;
  updateType: ProductUpdateType;
  summary: string;
  date: string;
  programName?: string;
  rateDirection?: "up" | "down";
}

export type BriefingWidgetType =
  | "recent-activity"
  | "action-items"
  | "advisories"
  | "upcoming-trips"
  | "pre-departure"
  | "knowledge-highlights"
  | "publication-feed"
  | "product-intel";

export type WidgetSize = "standard" | "wide";

export interface WidgetConfig {
  id: string;
  widgetType: BriefingWidgetType;
  visible: boolean;
  position: number;
  size: WidgetSize;
}

export type BriefingIntegrationId = "axus" | "tripsuite" | "virtuoso";

export interface IntegrationStatus {
  integration: BriefingIntegrationId;
  connected: boolean;
  lastSync?: string;
}

export interface UpcomingTripsResponse {
  trips: UpcomingTrip[];
  integration: IntegrationStatus;
}
