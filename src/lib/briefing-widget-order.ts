import {
  WidgetType,
  type BriefingWidget,
  type IntelligenceEmbedContent,
} from "@/types/briefing";

/**
 * Default tile order when API `position` values are arbitrary (Announcements strip is separate).
 */
export function defaultBriefingWidgetSortRank(w: BriefingWidget): number {
  if (w.widget_type === WidgetType.IntelligenceEmbed) {
    const c = w.content as IntelligenceEmbedContent;
    if (c.type !== "intelligence_embed") return 500;
    const v: Record<IntelligenceEmbedContent["variant"], number> = {
      recent_activity: 10,
      action_items: 20,
      knowledge_highlights: 35,
      advisories: 48,
      publication_feed: 62,
      product_intel: 64,
      pre_departure: 85,
      upcoming_trips: 88,
    };
    return v[c.variant] ?? 500;
  }
  const rank: Partial<Record<WidgetType, number>> = {
    [WidgetType.RecentActivity]: 10,
    [WidgetType.ActionItems]: 20,
    [WidgetType.FreeText]: 25,
    [WidgetType.CommissionAlerts]: 40,
    [WidgetType.NewsAlerts]: 52,
    [WidgetType.PartnerUpdates]: 60,
    [WidgetType.Calendar]: 70,
    [WidgetType.ClientIntelligence]: 80,
    [WidgetType.UpcomingTrips]: 90,
    [WidgetType.QuickStart]: 1000,
  };
  return rank[w.widget_type] ?? 500;
}

export function compareBriefingWidgetsByDefaultOrder(a: BriefingWidget, b: BriefingWidget): number {
  const ra = defaultBriefingWidgetSortRank(a);
  const rb = defaultBriefingWidgetSortRank(b);
  if (ra !== rb) return ra - rb;
  return a.position - b.position;
}
