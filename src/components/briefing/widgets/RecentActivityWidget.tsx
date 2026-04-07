"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import AppleWidgetCard, { type WidgetCardDensity } from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import { mergeWidgetHeaderRight } from "../mergeWidgetHeaderRight";
import type { RecentActivityContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

function entityLink(item: RecentActivityContent["items"][0]): string {
  if (item.entity_type === "itinerary") return `/dashboard/itineraries/${item.entity_id}`;
  if (item.entity_type === "vic") return `/dashboard/vics/${item.entity_id}`;
  if (item.entity_type === "product") return `/dashboard/products/${item.entity_id}`;
  if (item.entity_type === "acuity") return `/dashboard/vics/${item.entity_id}`;
  return "#";
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function dotColor(entity_type: string): string {
  if (entity_type === "acuity") return "bg-[var(--muted-accent-text)]";
  if (entity_type === "itinerary") return "bg-[var(--color-info)]";
  if (entity_type === "vic" || entity_type === "product") return "bg-[var(--color-info)]";
  return "bg-muted-foreground/45";
}

type Props = {
  content: RecentActivityContent;
  staggerIndex?: number;
  isAdmin?: boolean;
  cardDensity?: WidgetCardDensity;
  layoutMenu?: ReactNode;
};

export default function RecentActivityWidget({
  content,
  staggerIndex = 0,
  isAdmin = false,
  cardDensity,
  layoutMenu,
}: Props) {
  const items = (content.items ?? []).slice(0, 5);

  if (items.length === 0) {
    return (
      <AppleWidgetCard
        accent="cyan"
        icon={<Activity size={20} />}
        title="Recent Activity"
        staggerIndex={staggerIndex}
        density={cardDensity ?? "compact"}
        rightElement={mergeWidgetHeaderRight(undefined, layoutMenu)}
      >
        <BriefingEmptyState
          icon={<Activity />}
          title="No recent activity"
          description="Itineraries, VICs, and products you touch will show up here."
        />
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="cyan"
      icon={<Activity size={20} />}
      title="Recent Activity"
      rightElement={mergeWidgetHeaderRight(
        <Link href="#" className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
          View all
        </Link>,
        layoutMenu,
      )}
      staggerIndex={staggerIndex}
      density={cardDensity ?? "compact"}
    >
      {isAdmin && (
        <p className="text-2xs text-muted-foreground/70 -mt-1 mb-2">Agency-wide activity</p>
      )}
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex items-center gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-muted/40 -mx-1 rounded-md px-1">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor(item.entity_type))} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground">{item.actor_name}</span>
                <span className="text-sm text-muted-foreground"> {item.action} </span>
                <Link
                  href={entityLink(item)}
                  className="inline-block max-w-[min(100%,220px)] truncate align-bottom text-sm text-foreground/90 underline-offset-2 hover:underline"
                >
                  {item.entity_name}
                </Link>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatTimestamp(item.timestamp)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </AppleWidgetCard>
  );
}
