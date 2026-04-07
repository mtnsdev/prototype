"use client";

import { useState } from "react";
import { TrendingUp, Clock, AlertTriangle, X, CheckCircle } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import type { CommissionAlertContent } from "@/types/briefing";
import { incentiveBorder } from "../agency-hub/core";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  content: CommissionAlertContent;
  staggerIndex?: number;
};

/**
 * March 31 decision: No auto-expire. Commission incentive advisories
 * are manually dismissed by the advisor. The days_remaining counter
 * is informational — it shows the partner's validity window but does
 * NOT auto-close the advisory.
 */
export default function CommissionAlertsWidget({
  title = "Partner incentives",
  content,
  staggerIndex = 0,
}: Props) {
  const items = content.items ?? [];
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const activeItems = items.filter((i) => !dismissedIds.has(i.id));
  const urgentCount = activeItems.filter((i) => i.urgency === "urgent").length;
  const sorted = [...activeItems].sort((a, b) => a.days_remaining - b.days_remaining);
  const top5 = sorted.slice(0, 5);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <AppleWidgetCard
      title={title}
      accent="blue"
      icon={<TrendingUp size={20} />}
      staggerIndex={staggerIndex}
      rightElement={urgentCount > 0 ? (
        <span className="text-xs font-medium text-[var(--color-error)]">{urgentCount} needs attention</span>
      ) : undefined}
    >
      <p className="mb-3 rounded-lg border border-border bg-muted/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground/80">
        <span className="font-medium text-foreground/90">Sample content.</span> Partner offers and
        bonuses your agency highlights—replace with your own list anytime.
      </p>
      <div className="space-y-2">
        {top5.map((item) => {
          return (
            <div
              key={item.id}
              className={cn(
                "group relative rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50",
                incentiveBorder(item.urgency),
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <span className="shrink-0 text-sm font-semibold text-[var(--color-warning)]">
                      {item.bonus_display}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{item.partner_name}</p>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                      {item.urgency === "urgent" ? (
                        <AlertTriangle size={10} className="text-[var(--color-error)]" />
                      ) : (
                        <Clock size={10} />
                      )}
                      Partner window: {item.days_remaining}d
                    </span>
                  </div>
                </div>
                {/* Manual dismiss button — March 31 decision: no auto-expire */}
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="shrink-0 rounded-md p-1.5 opacity-0 transition-opacity hover:bg-muted/60 group-hover:opacity-100"
                  title="Dismiss this incentive (manual close)"
                  aria-label="Dismiss incentive"
                >
                  <X size={12} className="text-muted-foreground/60" />
                </button>
              </div>
              {item.affected_vics && item.affected_vics.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <span className="text-2xs text-muted-foreground/60">Applies to:</span>
                  {item.affected_vics.slice(0, 3).map((v) => (
                    <span
                      key={v.id}
                      className="text-2xs rounded bg-[var(--color-warning-muted)] px-1.5 py-0.5 text-[var(--color-warning)]"
                    >
                      {v.name}
                    </span>
                  ))}
                  {item.affected_vics.length > 3 && (
                    <span className="text-2xs text-muted-foreground/50">
                      +{item.affected_vics.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {/* Show dismissed count */}
        {dismissedIds.size > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40 pt-1">
            <CheckCircle size={12} />
            <span>{dismissedIds.size} dismissed</span>
          </div>
        )}
        {activeItems.length === 0 && dismissedIds.size === 0 ? (
          <BriefingEmptyState
            icon={<TrendingUp />}
            title="No partner incentives"
            description="Highlight FAMs, bonuses, and limited offers for your team here."
          />
        ) : null}
        {activeItems.length === 0 && dismissedIds.size > 0 ? (
          <BriefingEmptyState
            icon={<TrendingUp />}
            title="All caught up"
            description="You’ve reviewed every active incentive. New ones will appear when added."
          />
        ) : null}
      </div>
    </AppleWidgetCard>
  );
}
