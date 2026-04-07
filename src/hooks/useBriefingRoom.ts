"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WidgetType } from "@/types/briefing";
import type {
  ActionItem,
  Advisory,
  IntegrationStatus,
  KnowledgeHighlight,
  PreDepartureTrigger,
  ProductUpdate,
  PublicationItem,
  RecentActivityItem,
  UpcomingTrip,
  WidgetConfig,
} from "@/types/briefing-room";
import type {
  ActionItemsContent,
  BriefingWidget,
  ClientIntelligenceContent,
  CommissionAlertContent,
} from "@/types/briefing";

const STALE_MS = 60_000;

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400_000).toISOString();
}

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400_000).toISOString();
}

export function formatBriefingRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) {
    const dayMs = 86400_000;
    const days = Math.ceil(-diffMs / dayMs);
    if (days <= 1) return "Tomorrow";
    return `in ${days} days`;
  }
  if (diffMs < 60_000) return "Just now";
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function groupRecentActivityLabel(iso: string): "Today" | "Yesterday" | "This week" | "Earlier" {
  const d = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const t = d.getTime();
  if (t >= startOfToday.getTime()) return "Today";
  if (t >= startOfYesterday.getTime()) return "Yesterday";
  if (t >= startOfWeek.getTime()) return "This week";
  return "Earlier";
}

function mockRecentActivity(): RecentActivityItem[] {
  return [
    {
      id: "ra-1",
      type: "vic",
      title: "Sarah Johnson",
      subtitle: "Acuity profile updated · Virtuoso",
      timestamp: hoursAgo(2),
      route: "/dashboard/vics",
    },
    {
      id: "ra-2",
      type: "document",
      title: "Belmond Bellini Club — Q2 incentives",
      subtitle: "Knowledge Vault · Team",
      timestamp: hoursAgo(5),
      route: "/dashboard/knowledge-vault",
    },
    {
      id: "ra-3",
      type: "product",
      title: "Aman Tokyo",
      subtitle: "Virtuoso · City hotels",
      timestamp: hoursAgo(8),
      route: "/dashboard/products",
    },
    {
      id: "ra-4",
      type: "search",
      title: "Patagonia expedition pacing",
      subtitle: "Search in Knowledge Vault",
      timestamp: hoursAgo(20),
      route: "/dashboard/knowledge-vault",
    },
    {
      id: "ra-5",
      type: "itinerary",
      title: "The Hartley Family · Amalfi Coast",
      subtitle: "Draft itinerary",
      timestamp: daysAgo(1),
      route: "/dashboard/itineraries",
    },
    {
      id: "ra-6",
      type: "vic",
      title: "Jacques & Marie Veyrat",
      subtitle: "Notes added · Four Seasons Preferred",
      timestamp: daysAgo(1),
      route: "/dashboard/vics",
    },
    {
      id: "ra-7",
      type: "document",
      title: "Mykonos villa compliance checklist",
      subtitle: "Knowledge Vault · Private",
      timestamp: daysAgo(3),
      route: "/dashboard/knowledge-vault",
    },
    {
      id: "ra-8",
      type: "product",
      title: "The Brando",
      subtitle: "Program update reviewed",
      timestamp: daysAgo(5),
      route: "/dashboard/products",
    },
  ];
}

function mockActionItems(): ActionItem[] {
  return [
    {
      id: "ai-1",
      priority: "urgent",
      description: "Approve Virtuoso booking for Sarah Johnson · Aman Tokyo",
      source: "Approval queue",
      dueDate: daysFromNow(1),
      route: "/dashboard/notifications",
    },
    {
      id: "ai-2",
      priority: "normal",
      description: "Follow up on Hartley Family Amalfi villa options",
      source: "Meeting transcript",
      route: "/dashboard/chat",
    },
    {
      id: "ai-3",
      priority: "normal",
      description: "Review Swiss Alps rail pass add-on for Veyrat party",
      source: "Task",
      dueDate: daysFromNow(4),
      route: "/dashboard/itineraries",
    },
    {
      id: "ai-4",
      priority: "low",
      description: "Archive expired Patagonia rate sheet in vault",
      source: "Knowledge Vault",
      route: "/dashboard/knowledge-vault",
    },
  ];
}

function mockAdvisories(): Advisory[] {
  return [
    {
      id: "adv-1",
      severity: "critical",
      destination: "Tokyo, Japan",
      summary:
        "Haneda operational adjustments reported; confirm evening arrivals with carriers and lounge access.",
      category: "disruption",
    },
    {
      id: "adv-2",
      severity: "warning",
      destination: "Mykonos, Greece",
      summary: "Peak-season ferry schedules tightening; private transfers recommended for island hops.",
      category: "disruption",
    },
    {
      id: "adv-3",
      severity: "warning",
      destination: "Amalfi Coast, Italy",
      summary: "Coastal road restrictions on weekends — pad drive times for Ravello and Positano.",
      category: "safety",
    },
    {
      id: "adv-4",
      severity: "info",
      destination: "Swiss Alps",
      summary: "Mountain rail passes see seasonal uplift; Virtuoso amenities still apply at partner hotels.",
      category: "entry-requirement",
    },
  ];
}

function mockKnowledgeHighlights(): KnowledgeHighlight[] {
  const isoRecent = hoursAgo(30);
  return [
    {
      id: "kh-1",
      title: "Four Seasons Preferred Partner — Firenze spa credits",
      source: "Knowledge Vault",
      date: isoRecent,
      scope: "team",
      viewCount: 12,
      isNew: true,
    },
    {
      id: "kh-2",
      title: "Belmond Caruso: Caruso Club celebration packages",
      source: "Team playbook",
      date: daysAgo(2),
      scope: "team",
      viewCount: 8,
      isNew: true,
    },
    {
      id: "kh-3",
      title: "Patagonia lodge pacing — 5 vs 7 night splits",
      source: "Private notes",
      date: daysAgo(4),
      scope: "private",
      viewCount: 3,
      isNew: false,
    },
  ];
}

function mockPublicationFeed(): PublicationItem[] {
  return [
    {
      id: "pub-1",
      title: "Luxury trains return to the Alps with new sleeper cabins",
      source: "Skift",
      summary: "Operators are reopening vintage routes with elevated dining.",
      destinationTags: ["Swiss Alps", "Europe"],
      publishedAt: hoursAgo(6),
      url: "https://example.com/skift-alps",
    },
    {
      id: "pub-2",
      title: "Tokyo’s next wave of design-led city hotels",
      source: "Travel Weekly",
      summary: "Flagships lean into art-led lobbies and hyper-local F&B.",
      destinationTags: ["Tokyo"],
      publishedAt: hoursAgo(14),
      url: "https://example.com/tw-tokyo",
    },
    {
      id: "pub-3",
      title: "Mediterranean yacht season: berthing and customs primer",
      source: "Virtuoso Traveler",
      summary: "What advisors need for Mykonos and Amalfi embarkations.",
      destinationTags: ["Mykonos", "Amalfi Coast"],
      publishedAt: daysAgo(1),
      url: "https://example.com/virtuoso-yacht",
    },
    {
      id: "pub-4",
      title: "Patagonia lodges double down on conservation-led itineraries",
      source: "Substack · Field Notes",
      summary: "New pacing models for multi-region wildlife weeks.",
      destinationTags: ["Patagonia"],
      publishedAt: daysAgo(2),
      url: "https://example.com/field-patagonia",
    },
    {
      id: "pub-5",
      title: "Japan rail passes: what changed for 2026",
      source: "Nikkei Asia",
      summary: "Regional passes unbundle; pair with private transfers in Kanto.",
      destinationTags: ["Tokyo", "Japan"],
      publishedAt: daysAgo(3),
      url: "https://example.com/nikkei-rail",
    },
    {
      id: "pub-6",
      title: "Private island buyouts: contract clauses to watch",
      source: "The Brando Brief",
      summary: "Force majeure and helicopter windows in South Pacific programs.",
      destinationTags: ["South Pacific"],
      publishedAt: daysAgo(4),
      url: "https://example.com/brando-brief",
    },
  ];
}

function mockProductIntel(): ProductUpdate[] {
  return [
    {
      id: "pi-1",
      productName: "Four Seasons Firenze",
      updateType: "new",
      summary: "New penthouse pairing with private palazzo dinners.",
      date: hoursAgo(10),
      programName: "Four Seasons Preferred",
    },
    {
      id: "pi-2",
      productName: "Aman Tokyo",
      updateType: "rate-change",
      summary: "Weekend suites +4% through cherry season.",
      date: daysAgo(1),
      programName: "Virtuoso",
      rateDirection: "up",
    },
    {
      id: "pi-3",
      productName: "Belmond Caruso",
      updateType: "program-update",
      summary: "Bellini Club double upgrade window extended for Virtuoso bookings.",
      date: daysAgo(2),
      programName: "Belmond Bellini Club",
    },
    {
      id: "pi-4",
      productName: "The Brando",
      updateType: "amenity",
      summary: "Complimentary lagoon orientation for 5+ night stays.",
      date: daysAgo(3),
      programName: "Virtuoso",
    },
  ];
}

function mockWidgetConfig(): WidgetConfig[] {
  return [
    { id: "wc-1", widgetType: "recent-activity", visible: true, position: 0, size: "standard" },
    { id: "wc-2", widgetType: "action-items", visible: true, position: 1, size: "standard" },
    { id: "wc-3", widgetType: "advisories", visible: true, position: 2, size: "wide" },
    { id: "wc-4", widgetType: "upcoming-trips", visible: true, position: 3, size: "standard" },
    { id: "wc-5", widgetType: "pre-departure", visible: true, position: 4, size: "standard" },
    { id: "wc-6", widgetType: "knowledge-highlights", visible: true, position: 5, size: "standard" },
    { id: "wc-7", widgetType: "publication-feed", visible: true, position: 6, size: "standard" },
    { id: "wc-8", widgetType: "product-intel", visible: true, position: 7, size: "standard" },
  ];
}

function mockIntegrationStatuses(): IntegrationStatus[] {
  return [
    { integration: "axus", connected: false },
    { integration: "tripsuite", connected: false },
    { integration: "virtuoso", connected: true, lastSync: hoursAgo(2) },
  ];
}

function mockPreDeparture(): PreDepartureTrigger[] {
  return [
    {
      id: "pd-1",
      clientName: "Sarah Johnson",
      destination: "Tokyo",
      daysUntil: 12,
      checklistItems: [
        "eVisa confirmation",
        "Aman Tokyo airport meet",
        "Virtuoso amenity letter",
        "Dining at Toranomon notes",
      ],
      completedCount: 2,
    },
    {
      id: "pd-2",
      clientName: "The Hartley Family",
      destination: "Amalfi Coast",
      daysUntil: 5,
      checklistItems: ["Belmond Caruso transfer", "Boat day weather window", "Ravello concert tickets"],
      completedCount: 1,
    },
    {
      id: "pd-3",
      clientName: "Jacques & Marie Veyrat",
      destination: "Swiss Alps",
      daysUntil: 18,
      checklistItems: ["Rail pass delivery", "Heli weather hold", "Spa preferences"],
      completedCount: 3,
    },
  ];
}

function mockUpcomingTrips(): UpcomingTrip[] {
  return [
    {
      id: "ut-1",
      clientName: "Sarah Johnson",
      destination: "Tokyo",
      departureDate: daysFromNow(12),
      daysUntil: 12,
      status: "Confirmed",
    },
    {
      id: "ut-2",
      clientName: "The Hartley Family",
      destination: "Amalfi Coast",
      departureDate: daysFromNow(5),
      daysUntil: 5,
      status: "Ticketing",
    },
    {
      id: "ut-3",
      clientName: "Jacques & Marie Veyrat",
      destination: "Swiss Alps",
      departureDate: daysFromNow(18),
      daysUntil: 18,
      status: "Planning",
    },
  ];
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["briefing-room", "recent-activity"],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/recent-activity
      return mockRecentActivity();
    },
    staleTime: STALE_MS,
  });
}

export function useActionItems() {
  return useQuery({
    queryKey: ["briefing-room", "action-items"],
    queryFn: async (): Promise<ActionItem[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/action-items
      return mockActionItems();
    },
    staleTime: STALE_MS,
  });
}

export function useAdvisories() {
  return useQuery({
    queryKey: ["briefing-room", "advisories"],
    queryFn: async (): Promise<Advisory[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/advisories
      return mockAdvisories();
    },
    staleTime: STALE_MS,
  });
}

export function useUpcomingTrips() {
  return useQuery({
    queryKey: ["briefing-room", "upcoming-trips"],
    queryFn: async () => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/upcoming-trips
      const integration = mockIntegrationStatuses().find((i) => i.integration === "axus") ?? {
        integration: "axus" as const,
        connected: false,
      };
      const trips = integration.connected ? mockUpcomingTrips() : [];
      return { trips, integration } as const;
    },
    staleTime: STALE_MS,
  });
}

export function usePreDepartureTriggers() {
  return useQuery({
    queryKey: ["briefing-room", "pre-departure"],
    queryFn: async (): Promise<PreDepartureTrigger[]> => {
      // TODO: Replace mock with real API call when Axus-backed endpoint exists
      return mockPreDeparture();
    },
    staleTime: STALE_MS,
  });
}

export function useKnowledgeHighlights() {
  return useQuery({
    queryKey: ["briefing-room", "knowledge-highlights"],
    queryFn: async (): Promise<KnowledgeHighlight[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/knowledge-highlights
      return mockKnowledgeHighlights();
    },
    staleTime: STALE_MS,
  });
}

export function usePublicationFeed() {
  return useQuery({
    queryKey: ["briefing-room", "publication-feed"],
    queryFn: async (): Promise<PublicationItem[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/publication-feed
      return mockPublicationFeed();
    },
    staleTime: STALE_MS,
  });
}

export function useProductIntel() {
  return useQuery({
    queryKey: ["briefing-room", "product-intel"],
    queryFn: async (): Promise<ProductUpdate[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/product-intel
      return mockProductIntel();
    },
    staleTime: STALE_MS,
  });
}

export function useWidgetConfig() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["briefing-room", "widget-config"],
    queryFn: async (): Promise<WidgetConfig[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/widget-config
      return mockWidgetConfig();
    },
    staleTime: STALE_MS,
  });

  const mutation = useMutation({
    mutationFn: async (next: WidgetConfig[]) => {
      // TODO: Replace mock with real API call — PUT /api/briefing-room/widget-config
      return next;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["briefing-room", "widget-config"], data);
    },
  });

  return { ...query, saveConfig: mutation.mutateAsync, isSaving: mutation.isPending };
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: ["briefing-room", "integration-status"],
    queryFn: async (): Promise<IntegrationStatus[]> => {
      // TODO: Replace mock with real API call — GET /api/briefing-room/integration-status
      return mockIntegrationStatuses();
    },
    staleTime: STALE_MS,
  });
}

const NEW_DOC_HOURS = 48;

export function countNewKnowledgeDocs(highlights: KnowledgeHighlight[]): number {
  const cutoff = Date.now() - NEW_DOC_HOURS * 3600_000;
  return highlights.filter((h) => h.isNew || new Date(h.date).getTime() >= cutoff).length;
}

/** One-line greeting subtitle from classic briefing widget payloads (expand as APIs land). */
export function buildSubtitleFromWidgets(widgets: BriefingWidget[] | undefined): string | null {
  if (!widgets?.length) return null;
  let pendingActions = 0;
  let commissions = 0;
  let passportSoon = 0;
  for (const w of widgets) {
    if (w.widget_type === WidgetType.ActionItems) {
      const c = w.content as ActionItemsContent;
      if (c.type === "action_items") {
        pendingActions += c.items.filter((i) => i.status !== "done").length;
      }
    }
    if (w.widget_type === WidgetType.CommissionAlerts) {
      const c = w.content as CommissionAlertContent;
      if (c.type === "commission_alerts") commissions += c.items.length;
    }
    if (w.widget_type === WidgetType.ClientIntelligence) {
      const c = w.content as ClientIntelligenceContent;
      if (c.type === "client_intelligence") {
        passportSoon += c.items.filter(
          (i) => i.alert_type === "passport_expiring" && i.days_away <= 90
        ).length;
      }
    }
  }
  if (pendingActions > 0 && commissions > 0) {
    return `You have ${pendingActions} action ${pendingActions === 1 ? "item" : "items"} and ${commissions} new commission opportunit${commissions === 1 ? "y" : "ies"}.`;
  }
  if (pendingActions > 0) {
    return `You have ${pendingActions} action ${pendingActions === 1 ? "item" : "items"} waiting in your queue.`;
  }
  if (commissions > 0) {
    return `${commissions} new commission opportunit${commissions === 1 ? "y" : "ies"} are live — review before they expire.`;
  }
  if (passportSoon > 0) {
    return `${passportSoon} client passport${passportSoon === 1 ? "" : "s"} expire in the next 90 days.`;
  }
  return null;
}

const ROTATING_BRIEFING_SUBTITLES = [
  "You have 3 action items and 2 new commission opportunities.",
  "4 new documents were added to your Knowledge Vault this week.",
  "2 client passports expire in the next 90 days.",
] as const;

export function pickRotatingBriefingSubtitle(widgets: BriefingWidget[] | undefined): string {
  const seed = widgets?.map((w) => w.id).join("|") || "briefing";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ROTATING_BRIEFING_SUBTITLES[h % ROTATING_BRIEFING_SUBTITLES.length];
}

export function buildBriefingSummaryLine(input: {
  advisoryCount: number;
  newDocCount: number;
  actionCount: number;
}): string | null {
  const parts: string[] = [];
  if (input.advisoryCount > 0) {
    parts.push(
      `${input.advisoryCount} new ${input.advisoryCount === 1 ? "advisory" : "advisories"}`
    );
  }
  if (input.newDocCount > 0) {
    parts.push(
      `${input.newDocCount} ${input.newDocCount === 1 ? "document" : "documents"} added to your vault`
    );
  }
  if (input.actionCount > 0) {
    parts.push(`${input.actionCount} ${input.actionCount === 1 ? "item" : "items"} need attention`);
  }
  if (parts.length === 0) return null;
  if (parts.length === 1) return `${parts[0]}.`;
  if (parts.length === 2) return `${parts[0]}, and ${parts[1]}.`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}.`;
}
