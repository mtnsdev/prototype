"use client";

import type { IntelligenceEmbedVariant } from "@/types/briefing";
import { RecentActivityWidget as IntelRecentActivityWidget } from "@/components/briefing-room/widgets/RecentActivityWidget";
import { ActionItemsWidget as IntelActionItemsWidget } from "@/components/briefing-room/widgets/ActionItemsWidget";
import { AdvisoriesWidget } from "@/components/briefing-room/widgets/AdvisoriesWidget";
import { UpcomingTripsWidget as IntelUpcomingTripsWidget } from "@/components/briefing-room/widgets/UpcomingTripsWidget";
import { PreDepartureWidget } from "@/components/briefing-room/widgets/PreDepartureWidget";
import { KnowledgeHighlightsWidget } from "@/components/briefing-room/widgets/KnowledgeHighlightsWidget";
import { PublicationFeedWidget } from "@/components/briefing-room/widgets/PublicationFeedWidget";
import { ProductIntelWidget } from "@/components/briefing-room/widgets/ProductIntelWidget";

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
