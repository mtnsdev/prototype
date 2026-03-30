"use client";

import {
  MoreHorizontal,
  Newspaper,
  Handshake,
  CheckSquare,
  Plane,
  Calendar as CalendarIcon,
  Zap,
  FileText,
  Activity,
  Box,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BriefingWidget, WidgetSize } from "@/types/briefing";
import { WidgetType } from "@/types/briefing";
import { cn } from "@/lib/utils";

const WIDGET_ICONS: Record<WidgetType, React.ComponentType<{ size?: number; className?: string }>> = {
  [WidgetType.NewsAlerts]: Newspaper,
  [WidgetType.PartnerUpdates]: Handshake,
  [WidgetType.ActionItems]: CheckSquare,
  [WidgetType.UpcomingTrips]: Plane,
  [WidgetType.Calendar]: CalendarIcon,
  [WidgetType.QuickStart]: Zap,
  [WidgetType.FreeText]: FileText,
  [WidgetType.RecentActivity]: Activity,
};

type Props = {
  widget: BriefingWidget;
  isLoading?: boolean;
  onResize?: (size: WidgetSize) => void;
  onHide?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRefresh?: () => void;
  viewAllHref?: string;
  viewAllLabel?: string;
  titleSuffix?: string;
  children: React.ReactNode;
  className?: string;
};

export default function BriefingWidgetCard({
  widget,
  isLoading,
  onResize,
  onHide,
  onMoveUp,
  onMoveDown,
  onRefresh,
  viewAllHref,
  viewAllLabel,
  titleSuffix,
  children,
  className,
}: Props) {
  const IconComponent = WIDGET_ICONS[widget.widget_type] ?? Box;
  const colSpanClass =
    widget.size === "large" ? "md:col-span-2" : "md:col-span-1";

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-[rgba(255,255,255,0.02)] flex flex-col overflow-hidden col-span-1",
        "backdrop-blur-sm transition-all duration-200 hover:border-input hover:bg-[rgba(255,255,255,0.03)]",
        colSpanClass,
        className
      )}
      data-size={widget.size}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 text-[rgba(245,245,245,0.85)]">
            <IconComponent size={18} />
          </div>
          <h3 className="font-medium text-foreground truncate text-sm">
            {widget.title}
            {titleSuffix != null && <span className="text-muted-foreground/75 font-normal ml-0.5"> {titleSuffix}</span>}
          </h3>
        </div>
        <div className="flex items-center gap-0.5">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground/55 hover:text-muted-foreground"
              onClick={() => onRefresh()}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground/55 hover:text-muted-foreground">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onResize && (
                <>
                  <DropdownMenuItem onClick={() => onResize("small")}>Resize: Small</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onResize("medium")}>Resize: Medium</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onResize("large")}>Resize: Large</DropdownMenuItem>
                </>
              )}
              {onMoveUp && <DropdownMenuItem onClick={onMoveUp}>Move Up</DropdownMenuItem>}
              {onMoveDown && <DropdownMenuItem onClick={onMoveDown}>Move Down</DropdownMenuItem>}
              {onHide && <DropdownMenuItem onClick={onHide} className="text-[var(--muted-error-text)]">Hide</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-5">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
            <div className="h-4 bg-white/[0.06] rounded-lg w-1/2" />
            <div className="h-4 bg-white/[0.06] rounded-lg w-5/6" />
          </div>
        ) : (
          children
        )}
      </div>
      {viewAllHref && viewAllLabel && (
        <div className="px-5 py-2.5 border-t border-border">
          <a
            href={viewAllHref}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            {viewAllLabel} →
          </a>
        </div>
      )}
    </article>
  );
}

export function briefingGridColSpan(size: WidgetSize): string {
  if (size === "large") return "md:col-span-2";
  return "md:col-span-1";
}
