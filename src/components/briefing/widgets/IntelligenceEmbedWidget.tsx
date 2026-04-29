"use client";

import type { IntelligenceEmbedVariant } from "@/types/briefing";
import {
  RecentActivityWidget as IntelRecentActivityWidget,
  ActionItemsWidget as IntelActionItemsWidget,
  AdvisoriesWidget,
  UpcomingTripsWidget as IntelUpcomingTripsWidget,
  PreDepartureWidget,
  KnowledgeHighlightsWidget,
  PublicationFeedWidget,
  ProductIntelWidget,
} from "@/components/briefing/liveIntelWidgets";

type Props = {
  variant: IntelligenceEmbedVariant;
};

/**
 * Renders intelligence-layer widgets (React Query data) inside the classic Briefing grid.
 */
export default function IntelligenceEmbedWidget({ variant }: Props) {
  switch (variant) {
    case "recent_activity":
      return <IntelRecentActivityWidget />;
    case "action_items":
      return <IntelActionItemsWidget />;
    case "advisories":
      return <AdvisoriesWidget />;
    case "upcoming_trips":
      return <IntelUpcomingTripsWidget />;
    case "pre_departure":
      return <PreDepartureWidget />;
    case "knowledge_highlights":
      return <KnowledgeHighlightsWidget />;
    case "publication_feed":
      return <PublicationFeedWidget />;
    case "product_intel":
      return <ProductIntelWidget />;
    default:
      return null;
  }
}
