"use client";

import { useState } from "react";
import { TrendingUp, Clock, AlertTriangle, X, CheckCircle } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import type { CommissionAlertContent, CommissionAlertItem } from "@/types/briefing";
import { cn } from "@/lib/utils";

const URGENCY_STYLES: Record<CommissionAlertItem["urgency"], { ring: string; text: string; bg: string }> = {
  urgent: { ring: "border-red-400/30", text: "text-red-400", bg: "bg-red-400/10" },
  soon: { ring: "border-amber-400/30", text: "text-amber-400", bg: "bg-amber-400/10" },
  info: { ring: "border-blue-400/30", text: "text-blue-400", bg: "bg-blue-400/10" },
};

type Props = {
  content: CommissionAlertContent;
  staggerIndex?: number;
};

/**
 * March 31 decision: No auto-expire. Commission incentive advisories
 * are manually dismissed by the advisor. The days_remaining counter
 * is informational — it shows the partner's validity window but does
 * NOT auto-close the advisory.
 */
export default function CommissionAlertsWidget({ content, staggerIndex = 0 }: Props) {
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
      title="Commission Opportunities"
      accent="emerald"
      icon={<TrendingUp size={20} />}
      staggerIndex={staggerIndex}
      rightElement={urgentCount > 0 ? (
        <span className="text-xs font-medium text-red-400">{urgentCount} needs attention</span>
      ) : undefined}
    >
      <div className="space-y-2">
        {top5.map((item) => {
          const style = URGENCY_STYLES[item.urgency] ?? URGENCY_STYLES.info;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border px-3 py-2.5 transition-colors hover:bg-white/[0.04] group relative",
                style.ring,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <span className={cn(
                      "shrink-0 text-sm font-semibold",
                      "text-[#C9A96E]",
                    )}>
                      {item.bonus_display}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{item.partner_name}</p>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                      {item.urgency === "urgent" ? (
                        <AlertTriangle size={10} className="text-red-400" />
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
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white/10"
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
                      className="text-2xs text-[#C9A96E] bg-[rgba(201,169,110,0.08)] rounded px-1.5 py-0.5"
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
        {activeItems.length === 0 && dismissedIds.size === 0 && (
          <p className="text-sm text-muted-foreground/50 text-center py-4">
            No active commission incentives
          </p>
        )}
        {activeItems.length === 0 && dismissedIds.size > 0 && (
          <p className="text-sm text-muted-foreground/50 text-center py-4">
            All incentives reviewed
          </p>
        )}
      </div>
    </AppleWidgetCard>
  );
}
