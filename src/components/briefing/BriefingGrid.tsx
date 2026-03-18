"use client";

import type { BriefingWidget } from "@/types/briefing";
import NewsAlertsWidget from "./widgets/NewsAlertsWidget";
import ActionItemsWidget from "./widgets/ActionItemsWidget";
import UpcomingTripsWidget from "./widgets/UpcomingTripsWidget";
import CalendarWidget from "./widgets/CalendarWidget";
import RecentActivityWidget from "./widgets/RecentActivityWidget";

type Props = {
  widgets: BriefingWidget[];
};

export default function BriefingGrid({ widgets }: Props) {
  const byId = new Map(widgets.map((w) => [w.id, w]));

  const news = byId.get("w-news");
  const actions = byId.get("w-actions");
  const trips = byId.get("w-trips");
  const calendar = byId.get("w-calendar");
  const activity = byId.get("w-activity");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 align-items-start">
      {/* Left column: News (tall) + Action Items */}
      <div className="flex flex-col gap-5">
        {news && (
          <div className="min-h-[380px]">
            <NewsAlertsWidget
              content={news.content as import("@/types/briefing").NewsAlertContent}
              staggerIndex={0}
            />
          </div>
        )}
        {actions && (
          <ActionItemsWidget
            content={actions.content as import("@/types/briefing").ActionItemsContent}
            staggerIndex={1}
          />
        )}
      </div>

      {/* Right column: Upcoming Trips + Calendar (Quick Start is in header) */}
      <div className="flex flex-col gap-5">
        {trips && (
          <UpcomingTripsWidget
            content={trips.content as import("@/types/briefing").UpcomingTripsContent}
            staggerIndex={2}
          />
        )}
        {calendar && (
          <CalendarWidget
            content={calendar.content as import("@/types/briefing").CalendarContent}
            staggerIndex={3}
          />
        )}
      </div>

      {/* Full width: Recent Activity */}
      {activity && (
        <div className="xl:col-span-2">
          <RecentActivityWidget
            content={activity.content as import("@/types/briefing").RecentActivityContent}
            staggerIndex={5}
          />
        </div>
      )}
    </div>
  );
}
