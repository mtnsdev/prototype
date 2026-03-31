"use client";

import React from "react";
import type { CommissionIncentive } from "@/types/commission-incentive";

interface CommissionIncentiveBadgeProps {
  incentive: CommissionIncentive;
  size?: "sm" | "md";
  showDaysRemaining?: boolean;
}

/**
 * CommissionIncentiveBadge
 *
 * Small component rendering active commission incentives on product cards.
 * Shows incentive title, bonus %, and days remaining with gold accent styling.
 *
 * Design: Gold accent (#C9A96E) on dark background, compact display.
 */
export const CommissionIncentiveBadge: React.FC<
  CommissionIncentiveBadgeProps
> = ({ incentive, size = "md", showDaysRemaining = true }) => {
  const isExpiringSoon = incentive.days_remaining && incentive.days_remaining <= 5;

  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-2 py-1" : "px-3 py-2";

  return (
    <div
      className={`
        inline-flex items-center gap-2
        ${padding}
        rounded-md
        bg-slate-900 border border-slate-700
        ${isExpiringSoon ? "border-orange-500/50 bg-slate-800" : ""}
      `}
      title={`${incentive.title} — ${incentive.terms_summary}`}
    >
      {/* Gold accent dot */}
      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />

      {/* Incentive title and bonus */}
      <div className={`flex flex-col gap-0.5 ${textSize}`}>
        <span className="font-semibold text-slate-50 leading-tight">
          {incentive.title}
        </span>

        {/* Bonus percentage or flat amount */}
        {incentive.bonus_percentage && (
          <span className="text-[#C9A96E] font-medium">
            +{incentive.bonus_percentage}%
          </span>
        )}
        {incentive.bonus_flat && !incentive.bonus_percentage && (
          <span className="text-[#C9A96E] font-medium">
            +{incentive.currency} {incentive.bonus_flat.toLocaleString()}
          </span>
        )}
      </div>

      {/* Days remaining (urgency indicator) */}
      {showDaysRemaining && incentive.days_remaining && (
        <div className={`ml-auto text-right ${textSize}`}>
          <span
            className={`
              font-semibold
              ${isExpiringSoon ? "text-orange-400" : "text-slate-400"}
            `}
          >
            {incentive.days_remaining}d
          </span>
          <span className="text-slate-500 block text-xs">left</span>
        </div>
      )}

      {/* Urgency indicator (optional visual cue) */}
      {incentive.urgency === "high" && (
        <div className="ml-1 px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded text-orange-400 text-xs font-medium">
          Urgent
        </div>
      )}
    </div>
  );
};

/**
 * CommissionIncentiveGrid
 *
 * Renders a grid/list of multiple commission incentives,
 * useful for product detail pages or search results.
 */
interface CommissionIncentiveGridProps {
  incentives: CommissionIncentive[];
  size?: "sm" | "md";
  layout?: "grid" | "stack";
}

export const CommissionIncentiveGrid: React.FC<
  CommissionIncentiveGridProps
> = ({ incentives, size = "md", layout = "stack" }) => {
  if (incentives.length === 0) {
    return null;
  }

  const gridClass =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "flex flex-col gap-2";

  return (
    <div className={gridClass}>
      {incentives.map((incentive) => (
        <CommissionIncentiveBadge
          key={incentive.id}
          incentive={incentive}
          size={size}
          showDaysRemaining
        />
      ))}
    </div>
  );
};
