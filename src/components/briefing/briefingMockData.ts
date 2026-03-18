/**
 * Briefing Room mock data. Used when API is unavailable.
 */

import {
  WidgetType,
  type BriefingWidget,
  type NewsAlertContent,
  type PartnerUpdateContent,
  type ActionItemsContent,
  type UpcomingTripsContent,
  type CalendarContent,
  type QuickStartContent,
  type FreeTextContent,
  type RecentActivityContent,
} from "@/types/briefing";

const now = new Date().toISOString();

function addDays(d: Date, n: number): string {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export function getMockBriefingWidgets(): BriefingWidget[] {
  return [
    {
      id: "w-news",
      widget_type: WidgetType.NewsAlerts,
      title: "News & Alerts",
      position: 0,
      size: "large",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockNewsAlertContent(),
    },
    {
      id: "w-quick",
      widget_type: WidgetType.QuickStart,
      title: "Quick Start",
      position: 1,
      size: "small",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockQuickStartContent(),
    },
    {
      id: "w-actions",
      widget_type: WidgetType.ActionItems,
      title: "Action Items",
      position: 2,
      size: "medium",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockActionItemsContent(),
    },
    {
      id: "w-trips",
      widget_type: WidgetType.UpcomingTrips,
      title: "Upcoming Trips",
      position: 3,
      size: "medium",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockUpcomingTripsContent(),
    },
    {
      id: "w-calendar",
      widget_type: WidgetType.Calendar,
      title: "Calendar",
      position: 4,
      size: "medium",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockCalendarContent(),
    },
    {
      id: "w-partner",
      widget_type: WidgetType.PartnerUpdates,
      title: "Partner Updates",
      position: 5,
      size: "medium",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockPartnerUpdateContent(),
    },
    {
      id: "w-activity",
      widget_type: WidgetType.RecentActivity,
      title: "Recent Activity",
      position: 6,
      size: "large",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockRecentActivityContent(),
    },
    {
      id: "w-freetext",
      widget_type: WidgetType.FreeText,
      title: "Daily Notes",
      position: 7,
      size: "small",
      is_visible: true,
      created_by: "system",
      updated_at: now,
      content: getMockFreeTextContent(),
    },
  ];
}

const NEWS_THUMB = {
  fourSeasons: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100&h=100&fit=crop",
  aman: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop",
  belmond: "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=100&h=100&fit=crop",
  ponant: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=100&h=100&fit=crop",
  raffles: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop",
};

function getMockNewsAlertContent(): NewsAlertContent {
  return {
    type: "news_alert",
    items: [
      {
        id: "news-001",
        headline: "Air France Strike Action — June 12-15",
        summary: "Significant cancellations expected. Rebook or advise clients with France travel.",
        source: "ASTA",
        category: "safety",
        severity: "urgent",
        destination: "France",
        tags: ["France"],
        published_at: addDays(new Date(), -1),
      },
      {
        id: "news-002",
        headline: "Four Seasons George V — Major Renovation Q3 2026",
        summary: "Property will close for full renovation from July 2026. Rebook affected stays.",
        source: "Four Seasons",
        thumbnail_url: NEWS_THUMB.fourSeasons,
        category: "renovation",
        severity: "warning",
        destination: "Paris, France",
        tags: ["Paris, France"],
        published_at: addDays(new Date(), -2),
      },
      {
        id: "news-003",
        headline: "Bali Visa Policy Change Effective May 2026",
        summary: "Extended visa-on-arrival and new e-VOA. Ensure clients are informed.",
        source: "ASTA",
        category: "regulatory",
        severity: "warning",
        destination: "Bali",
        tags: ["Bali"],
        published_at: addDays(new Date(), -3),
      },
    ],
  };
}

function getMockPartnerUpdateContent(): PartnerUpdateContent {
  return {
    type: "partner_update",
    items: [
      {
        id: "pu1",
        partner_name: "Marriott Luxury Collection",
        update_type: "rate_change",
        title: "New Commission Structure",
        description: "Revised commission tiers effective 1 July 2026. Review your dashboard.",
        effective_date: "2026-07-01",
        action_required: true,
        action_url: "#",
      },
      {
        id: "pu2",
        partner_name: "Aman",
        update_type: "fam_trip",
        title: "Exclusive FAM Trip Invitation — Amanpuri, Oct 2026",
        description: "Three-night FAM for qualified advisors. Apply by 30 June.",
        effective_date: "2026-10-15",
        action_required: false,
      },
      {
        id: "pu3",
        partner_name: "Virtuoso",
        update_type: "policy_change",
        title: "Updated Preferred Partner Benefits 2026",
        description: "New benefits and recognition levels. Summary in member portal.",
        action_required: false,
      },
      {
        id: "pu4",
        partner_name: "Four Seasons",
        update_type: "training",
        title: "Advisor Training Webinar Series",
        description: "Monthly webinars on luxury selling. Next: 20 March 2026.",
        effective_date: "2026-03-20",
        action_required: false,
      },
      { id: "pu5", partner_name: "Belmond", update_type: "rate_change", title: "Trains & Cruises 2026 Rates", description: "Venice Simplon-Orient-Express and river cruise rates updated.", effective_date: "2026-04-01", action_required: false },
      { id: "pu6", partner_name: "Ponant", update_type: "fam_trip", title: "Antarctica FAM — Jan 2027", description: "Limited places for qualified advisors. Apply by 30 Sept 2026.", effective_date: "2027-01-15", action_required: true, action_url: "#" },
      { id: "pu7", partner_name: "Silversea", update_type: "policy_change", title: "Door-to-Door All-Inclusive Terms", description: "Updated inclusions and booking conditions. See partner portal.", action_required: false },
      { id: "pu8", partner_name: "A&K", update_type: "training", title: "DMC Specialist Certification", description: "New certification for Europe and Africa. Modules available online.", effective_date: "2026-05-01", action_required: false },
    ],
  };
}

function getMockActionItemsContent(): ActionItemsContent {
  const today = new Date();
  const in2 = new Date(today);
  in2.setDate(in2.getDate() + 2);
  return {
    type: "action_items",
    items: [
      {
        id: "a1",
        title: "Confirm Monaco GP hotel for JC",
        priority: "high",
        due_date: in2.toISOString().slice(0, 10),
        related_entity_type: "itinerary",
        related_entity_id: "fake-it-1",
        related_entity_name: "Monaco Grand Prix Weekend",
        status: "pending",
        pipeline_stage: "preparing",
        advisor_name: "Pierre Duval",
      },
      {
        id: "a2",
        title: "Follow up on Maldives transfer options for Camille",
        priority: "high",
        due_date: today.toISOString().slice(0, 10),
        related_entity_type: "itinerary",
        related_entity_id: "fake-it-3",
        related_entity_name: "Maldives Family Retreat",
        status: "in_progress",
        pipeline_stage: "preparing",
        advisor_name: "Marie Limousis",
      },
      {
        id: "a3",
        title: "Update Eric Tournier passport details (expiring soon)",
        priority: "medium",
        related_entity_type: "vic",
        related_entity_id: "fake-vic-4",
        related_entity_name: "Eric Tournier",
        status: "pending",
        pipeline_stage: null,
        advisor_name: "Marie Limousis",
      },
      {
        id: "a4",
        title: "Review Tuscany wine tour options",
        priority: "medium",
        related_entity_type: "itinerary",
        related_entity_id: "fake-it-2",
        related_entity_name: "Tuscany Wine & Culture",
        status: "pending",
        pipeline_stage: "final_review",
        advisor_name: "Marie Limousis",
      },
      {
        id: "a5",
        title: "Add loyalty programs for Isabelle Forget",
        priority: "low",
        related_entity_type: "vic",
        related_entity_id: "vic-isabelle",
        related_entity_name: "Isabelle Forget",
        status: "pending",
        advisor_name: "Pierre Duval",
      },
      {
        id: "a6",
        title: "Confirm Rome & Amalfi car transfer",
        priority: "high",
        due_date: in2.toISOString().slice(0, 10),
        related_entity_type: "itinerary",
        related_entity_id: "fake-it-5",
        related_entity_name: "Rome & Amalfi Short Break",
        status: "pending",
        pipeline_stage: "preparing",
        advisor_name: "Pierre Duval",
      },
      {
        id: "a7",
        title: "Send Lyon trip proposal to Thomas Bresson",
        priority: "medium",
        related_entity_type: "itinerary",
        related_entity_id: "fake-it-6",
        related_entity_name: "Lyon Gastronomy",
        status: "pending",
        pipeline_stage: "proposal",
        advisor_name: "Pierre Duval",
      },
      {
        id: "a8",
        title: "Review Paris weekend restaurant bookings",
        priority: "medium",
        related_entity_type: "itinerary",
        related_entity_id: "fake-it-4",
        related_entity_name: "Paris Weekend — Valérie Rousseau",
        status: "pending",
        pipeline_stage: "committed",
        advisor_name: "Pierre Duval",
      },
      {
        id: "a9",
        title: "Acuity Lookup — Claire Mérigot",
        priority: "low",
        related_entity_type: "vic",
        related_entity_id: "fake-vic-10",
        related_entity_name: "Claire Mérigot",
        status: "pending",
        advisor_name: "Pierre Duval",
      },
      {
        id: "a10",
        title: "Follow up with Sandra Müller (prospect)",
        priority: "medium",
        related_entity_type: "vic",
        related_entity_id: "fake-vic-18",
        related_entity_name: "Sandra Müller",
        status: "pending",
        advisor_name: "Marie Limousis",
      },
    ],
  };
}

function getMockUpcomingTripsContent(): UpcomingTripsContent {
  const dep1 = new Date();
  dep1.setDate(dep1.getDate() + 67);
  const dep2 = new Date();
  dep2.setDate(dep2.getDate() + 120);
  return {
    type: "upcoming_trips",
    items: [
      {
        itinerary_id: "fake-it-1",
        trip_name: "Monaco Grand Prix Weekend",
        vic_name: "Jean-Christophe Chopin",
        destinations: ["Monaco", "Nice, France"],
        departure_date: dep1.toISOString().slice(0, 10),
        return_date: addDays(dep1, 3),
        status: "confirmed",
        days_until_departure: 67,
        pending_confirmations: 1,
        advisor_name: "Pierre Duval",
      },
      {
        itinerary_id: "fake-it-3",
        trip_name: "Maldives Family Retreat",
        vic_name: "Camille Signoles",
        destinations: ["Malé, Maldives"],
        departure_date: dep2.toISOString().slice(0, 10),
        return_date: addDays(dep2, 7),
        status: "proposed",
        days_until_departure: 120,
        pending_confirmations: 3,
        advisor_name: "Marie Limousis",
      },
      {
        itinerary_id: "fake-it-2",
        trip_name: "Tuscany Wine & Culture",
        vic_name: "Eric Tournier",
        destinations: ["Florence", "Tuscany"],
        departure_date: addDays(new Date(), 45),
        return_date: addDays(new Date(), 51),
        status: "confirmed",
        days_until_departure: 45,
        pending_confirmations: 0,
        advisor_name: "Marie Limousis",
      },
      {
        itinerary_id: "fake-it-4",
        trip_name: "Paris Weekend — Valérie Rousseau",
        vic_name: "Valérie Rousseau",
        destinations: ["Paris"],
        departure_date: addDays(new Date(), 24),
        return_date: addDays(new Date(), 26),
        status: "confirmed",
        days_until_departure: 24,
        pending_confirmations: 0,
        advisor_name: "Pierre Duval",
      },
      {
        itinerary_id: "fake-it-5",
        trip_name: "Rome & Amalfi Short Break",
        vic_name: "Pierre Garnier",
        destinations: ["Rome", "Amalfi Coast"],
        departure_date: addDays(new Date(), 76),
        return_date: addDays(new Date(), 80),
        status: "in_progress",
        days_until_departure: 76,
        pending_confirmations: 2,
        advisor_name: "Pierre Duval",
      },
      {
        itinerary_id: "fake-it-6",
        trip_name: "Lyon Gastronomy — Thomas Bresson",
        vic_name: "Thomas Bresson",
        destinations: ["Lyon"],
        departure_date: addDays(new Date(), 18),
        return_date: addDays(new Date(), 22),
        status: "confirmed",
        days_until_departure: 18,
        pending_confirmations: 1,
        advisor_name: "Pierre Duval",
      },
    ],
  };
}

/** Agency-wide trip list for admin Briefing view (more trips, advisor labels). */
export function getMockUpcomingTripsContentAgency(): UpcomingTripsContent {
  const base = getMockUpcomingTripsContent();
  return {
    type: "upcoming_trips",
    items: [
      ...base.items,
      {
        itinerary_id: "fake-it-agency-1",
        trip_name: "Swiss Alps Ski — Müller family",
        vic_name: "Sandra Müller",
        destinations: ["Zermatt", "St. Moritz"],
        departure_date: addDays(new Date(), 34),
        return_date: addDays(new Date(), 41),
        status: "confirmed",
        days_until_departure: 34,
        pending_confirmations: 0,
        advisor_name: "Marie Limousis",
      },
      {
        itinerary_id: "fake-it-agency-2",
        trip_name: "Tokyo Cherry Blossom",
        vic_name: "Philippe Moreau",
        destinations: ["Tokyo", "Kyoto"],
        departure_date: addDays(new Date(), 52),
        return_date: addDays(new Date(), 61),
        status: "proposed",
        days_until_departure: 52,
        pending_confirmations: 2,
        advisor_name: "Pierre Duval",
      },
    ],
  };
}

function getMockCalendarContent(): CalendarContent {
  const today = new Date();
  const base = today.toISOString().slice(0, 10);
  return {
    type: "calendar",
    items: [
      { id: "c1", title: "VIC call — Jean-Christophe", event_type: "meeting", date: base, time: "10:00", color: "#3b82f6" },
      { id: "c2", title: "Monaco GP hotel confirmation deadline", event_type: "deadline", date: "2026-03-19", color: "#ef4444" },
      { id: "c3", title: "Four Seasons Advisor Webinar", event_type: "training", date: "2026-03-20", time: "14:00", color: "#06b6d4" },
      { id: "c4", title: "Eric Tournier birthday", event_type: "birthday", date: "2026-03-22", color: "#ec4899" },
      { id: "c5", title: "Passport expiry warning — Jacques Veyrat", event_type: "passport_expiry", date: "2026-03-25", color: "#f59e0b" },
      { id: "c6", title: "Ponant Antarctica FAM application deadline", event_type: "deadline", date: "2026-04-01", color: "#ef4444" },
      { id: "c7", title: "Monaco GP trip departure — JC", event_type: "trip_departure", date: "2026-05-23", color: "#22c55e" },
      { id: "c8", title: "Maldives trip departure — Camille", event_type: "trip_departure", date: "2026-07-15", color: "#22c55e" },
    ],
  };
}

function getMockQuickStartContent(): QuickStartContent {
  return {
    type: "quick_start",
    actions: [
      { label: "Add VIC", icon: "UserPlus", route: "/dashboard/vics", description: "Create a new VIC profile" },
      { label: "Create Itinerary", icon: "Route", route: "/dashboard/itineraries?create=1", description: "Start a new trip" },
      { label: "Browse Products", icon: "Package", route: "/dashboard/products", description: "Search the product registry" },
      { label: "Search Knowledge", icon: "Search", route: "/dashboard/search", description: "Search across knowledge bases" },
      { label: "Acuity Lookup", icon: "Sparkles", route: "/dashboard/vics", description: "Open VIC list to run Acuity on a specific client" },
      { label: "Import CSV", icon: "FileDown", route: "/dashboard/vics", description: "Bulk import VICs" },
    ],
  };
}

function getMockFreeTextContent(): FreeTextContent {
  return {
    type: "free_text",
    body: "**Welcome to the Briefing Room.**\n\nUse this space for agency-wide announcements, daily notes, or tips. You can edit this widget to add markdown.",
    author: "Enable Team",
    pinned: true,
  };
}

function getMockRecentActivityContent(): RecentActivityContent {
  const t = (d: number) => new Date(Date.now() - d * 60 * 60 * 1000).toISOString();
  return {
    type: "recent_activity",
    items: [
      { id: "r1", action: "Created VIC", entity_type: "vic", entity_name: "Marie Dupont", entity_id: "v1", actor_name: "You", timestamp: t(2) },
      { id: "r2", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Monaco Grand Prix Weekend", entity_id: "fake-it-1", actor_name: "You", timestamp: t(5) },
      { id: "r3", action: "Searched Knowledge Vault", entity_type: "product", entity_name: "Maldives guides", entity_id: "fake-agency-5", actor_name: "You", timestamp: t(8) },
      { id: "r4", action: "Added product", entity_type: "product", entity_name: "Hôtel de Paris Monte-Carlo", entity_id: "p1", actor_name: "You", timestamp: t(12) },
      { id: "r5", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Maldives Family Retreat", entity_id: "fake-it-3", actor_name: "You", timestamp: t(24) },
      { id: "r6", action: "Created VIC", entity_type: "vic", entity_name: "Pierre Martin", entity_id: "v2", actor_name: "Advisor 2", timestamp: t(36) },
      { id: "r7", action: "Generated destination brief", entity_type: "itinerary", entity_name: "Monaco Grand Prix Weekend", entity_id: "fake-it-1", actor_name: "You", timestamp: t(48) },
      { id: "r8", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Tuscany Wine & Culture", entity_id: "fake-it-2", actor_name: "You", timestamp: t(72) },
      { id: "r9", action: "Added product", entity_type: "product", entity_name: "One&Only Reethi Rah", entity_id: "p2", actor_name: "You", timestamp: t(72) },
      { id: "r10", action: "Created VIC", entity_type: "vic", entity_name: "Sophie Bernard", entity_id: "v3", actor_name: "Advisor 2", timestamp: t(80) },
      { id: "r11", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Paris Weekend — Valérie Rousseau", entity_id: "fake-it-4", actor_name: "Pierre Duval", timestamp: t(4) },
      { id: "r12", action: "Created VIC", entity_type: "vic", entity_name: "Thomas Bresson", entity_id: "fake-vic-11", actor_name: "Pierre Duval", timestamp: t(6) },
      { id: "r13", action: "Added product", entity_type: "product", entity_name: "Soneva Fushi", entity_id: "fake-agency-5", actor_name: "You", timestamp: t(10) },
      { id: "r14", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Rome & Amalfi Short Break", entity_id: "fake-it-5", actor_name: "You", timestamp: t(14) },
      { id: "r15", action: "Acuity completed for", entity_type: "acuity", entity_name: "Jean-Christophe Chopin", entity_id: "fake-vic-1", actor_name: "You", timestamp: t(20) },
      { id: "r16", action: "Created itinerary", entity_type: "itinerary", entity_name: "Lyon Gastronomy — Thomas Bresson", entity_id: "fake-it-6", actor_name: "Pierre Duval", timestamp: t(28) },
      { id: "r17", action: "Created VIC", entity_type: "vic", entity_name: "Claire Mérigot", entity_id: "fake-vic-10", actor_name: "You", timestamp: t(96) },
      { id: "r18", action: "Added product", entity_type: "product", entity_name: "Hôtel de Paris Monte-Carlo", entity_id: "fake-enable-5", actor_name: "You", timestamp: t(100) },
    ],
  };
}

/** Agency-wide recent activity for admin Briefing view. */
export function getMockRecentActivityContentAgency(): RecentActivityContent {
  const t = (d: number) => new Date(Date.now() - d * 60 * 60 * 1000).toISOString();
  return {
    type: "recent_activity",
    items: [
      { id: "ag-r1", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Monaco Grand Prix Weekend", entity_id: "fake-it-1", actor_name: "Pierre Duval", timestamp: t(1) },
      { id: "ag-r2", action: "Created itinerary", entity_type: "itinerary", entity_name: "Tokyo Cherry Blossom", entity_id: "fake-it-agency-2", actor_name: "Pierre Duval", timestamp: t(2) },
      { id: "ag-r3", action: "Acuity completed for", entity_type: "acuity", entity_name: "Camille Signoles", entity_id: "fake-vic-3", actor_name: "Marie Limousis", timestamp: t(3) },
      { id: "ag-r4", action: "Created VIC", entity_type: "vic", entity_name: "Thomas Bresson", entity_id: "fake-vic-11", actor_name: "Pierre Duval", timestamp: t(5) },
      { id: "ag-r5", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Maldives Family Retreat", entity_id: "fake-it-3", actor_name: "Marie Limousis", timestamp: t(6) },
      { id: "ag-r6", action: "Added product", entity_type: "product", entity_name: "Aman Kyoto (pre-opening)", entity_id: "p-aman-kyoto", actor_name: "Kristin", timestamp: t(8) },
      { id: "ag-r7", action: "Published announcement", entity_type: "product", entity_name: "2026 Hotel Launches", entity_id: "ann-briefing", actor_name: "Kristin", timestamp: t(48) },
      { id: "ag-r8", action: "Updated itinerary", entity_type: "itinerary", entity_name: "Paris Weekend — Valérie Rousseau", entity_id: "fake-it-4", actor_name: "Pierre Duval", timestamp: t(12) },
      { id: "ag-r9", action: "Created VIC", entity_type: "vic", entity_name: "Isabelle Blanc", entity_id: "fake-vic-22", actor_name: "Pierre Duval", timestamp: t(20) },
      { id: "ag-r10", action: "Searched Knowledge Vault", entity_type: "product", entity_name: "Virtuoso benefits", entity_id: "kv-1", actor_name: "Marie Limousis", timestamp: t(30) },
    ],
  };
}
