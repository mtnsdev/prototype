"use client";

import type { BriefingWidget, WidgetSize } from "@/types/briefing";
import { WidgetType } from "@/types/briefing";
import BriefingWidgetCard from "./BriefingWidgetCard";
import NewsAlertsWidget from "./widgets/NewsAlertsWidget";
import PartnerUpdatesWidget from "./widgets/PartnerUpdatesWidget";
import ActionItemsWidget from "./widgets/ActionItemsWidget";
import UpcomingTripsWidget from "./widgets/UpcomingTripsWidget";
import CalendarWidget from "./widgets/CalendarWidget";
import QuickStartWidget from "./widgets/QuickStartWidget";
import FreeTextWidget from "./widgets/FreeTextWidget";
import RecentActivityWidget from "./widgets/RecentActivityWidget";

type Props = {
  widgets: BriefingWidget[];
  onResize: (id: string, size: WidgetSize) => void;
  onHide: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRefresh?: () => void;
};

export default function BriefingGrid({ widgets, onResize, onHide, onMoveUp, onMoveDown, onRefresh }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
      {widgets.map((widget) => (
        <BriefingWidgetCard
          key={widget.id}
          widget={widget}
          onResize={(size) => onResize(widget.id, size)}
          onHide={() => onHide(widget.id)}
          onMoveUp={() => onMoveUp(widget.id)}
          onMoveDown={() => onMoveDown(widget.id)}
          onRefresh={onRefresh}
          viewAllHref={widget.widget_type === WidgetType.NewsAlerts ? "#" : undefined}
          viewAllLabel={widget.widget_type === WidgetType.NewsAlerts ? "View all alerts" : undefined}
          titleSuffix={
            widget.widget_type === WidgetType.ActionItems && Array.isArray((widget.content as { items?: unknown[] }).items)
              ? `(${(widget.content as { items: unknown[] }).items.length})`
              : undefined
          }
        >
          {widget.widget_type === WidgetType.NewsAlerts && (
            <NewsAlertsWidget content={widget.content as import("@/types/briefing").NewsAlertContent} />
          )}
          {widget.widget_type === WidgetType.PartnerUpdates && (
            <PartnerUpdatesWidget content={widget.content as import("@/types/briefing").PartnerUpdateContent} />
          )}
          {widget.widget_type === WidgetType.ActionItems && (
            <ActionItemsWidget content={widget.content as import("@/types/briefing").ActionItemsContent} />
          )}
          {widget.widget_type === WidgetType.UpcomingTrips && (
            <UpcomingTripsWidget content={widget.content as import("@/types/briefing").UpcomingTripsContent} />
          )}
          {widget.widget_type === WidgetType.Calendar && (
            <CalendarWidget content={widget.content as import("@/types/briefing").CalendarContent} />
          )}
          {widget.widget_type === WidgetType.QuickStart && (
            <QuickStartWidget content={widget.content as import("@/types/briefing").QuickStartContent} />
          )}
          {widget.widget_type === WidgetType.FreeText && (
            <FreeTextWidget content={widget.content as import("@/types/briefing").FreeTextContent} />
          )}
          {widget.widget_type === WidgetType.RecentActivity && (
            <RecentActivityWidget content={widget.content as import("@/types/briefing").RecentActivityContent} />
          )}
        </BriefingWidgetCard>
      ))}
    </div>
  );
}
