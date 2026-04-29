/**
 * Canonical imports for live briefing widgets (React Query + `useBriefingRoom`).
 * Implementations live under `components/briefing-room/widgets`; consume from here
 * so embeds and future grid wiring share one import path.
 */
export { RecentActivityWidget } from "@/components/briefing-room/widgets/RecentActivityWidget";
export { ActionItemsWidget } from "@/components/briefing-room/widgets/ActionItemsWidget";
export { AdvisoriesWidget } from "@/components/briefing-room/widgets/AdvisoriesWidget";
export { UpcomingTripsWidget } from "@/components/briefing-room/widgets/UpcomingTripsWidget";
export { PreDepartureWidget } from "@/components/briefing-room/widgets/PreDepartureWidget";
export { KnowledgeHighlightsWidget } from "@/components/briefing-room/widgets/KnowledgeHighlightsWidget";
export { PublicationFeedWidget } from "@/components/briefing-room/widgets/PublicationFeedWidget";
export { ProductIntelWidget } from "@/components/briefing-room/widgets/ProductIntelWidget";
