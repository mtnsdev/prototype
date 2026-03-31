"use client";

import type { BriefingWidget } from "@/types/briefing";
import NewsAlertsWidget from "./widgets/NewsAlertsWidget";
import ActionItemsWidget from "./widgets/ActionItemsWidget";
import UpcomingTripsWidget from "./widgets/UpcomingTripsWidget";
import CalendarWidget from "./widgets/CalendarWidget";
import RecentActivityWidget from "./widgets/RecentActivityWidget";
import AnnouncementsWidget from "./widgets/AnnouncementsWidget";
import ClientIntelligenceWidget from "./widgets/ClientIntelligenceWidget";
import CommissionAlertsWidget from "./widgets/CommissionAlertsWidget";

type Props = {
  widgets: BriefingWidget[];
  isAdmin: boolean;
};

export default function BriefingGrid({ widgets, isAdmin }: Props) {
  const byId = new Map(widgets.map((w) => [w.id, w]));

  const news = byId.get("w-news");
  const clientIntel = byId.get("w-client-intel");
  const commission = byId.get("w-commission");
  const actions = byId.get("w-actions");
  const trips = byId.get("w-trips");
  const calendar = byId.get("w-calendar");
  const activity = byId.get("w-activity");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 align-items-start">
      <div className="flex flex-col gap-5">
        {news && (
          <div className="min-h-[320px]">
            <NewsAlertsWidget
              content={news.content as import("@/types/briefing").NewsAlertContent}
              staggerIndex={0}
            />
          </div>
        )}
        {clientIntel && (
          <ClientIntelligenceWidget
            content={clientIntel.content as import("@/types/briefing").ClientIntelligenceContent}
            staggerIndex={1}
          />
        )}
        <AnnouncementsWidget isAdmin={isAdmin} staggerIndex={2} />
        {actions && (
          <ActionItemsWidget
            content={actions.content as import("@/types/briefing").ActionItemsContent}
            staggerIndex={3}
            isAdmin={isAdmin}
          />
        )}
        {activity && (
          <RecentActivityWidget
            content={activity.content as import("@/types/briefing").RecentActivityContent}
            staggerIndex={4}
            isAdmin={isAdmin}
          />
        )}
      </div>

      <div className="flex flex-col gap-5">
        {commission && (
          <CommissionAlertsWidget
            content={commission.content as import("@/types/briefing").CommissionAlertContent}
            staggerIndex={5}
          />
        )}
        {trips && (
          <UpcomingTripsWidget
            content={trips.content as import("@/types/briefing").UpcomingTripsContent}
            staggerIndex={6}
            isAdmin={isAdmin}
          />
        )}
        {calendar && (
          <CalendarWidget
            content={calendar.content as import("@/types/briefing").CalendarContent}
            staggerIndex={7}
          />
        )}
      </div>
    </div>
  );
}
