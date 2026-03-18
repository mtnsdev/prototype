"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
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
  if (entity_type === "acuity") return "bg-violet-500";
  if (entity_type === "itinerary") return "bg-emerald-500";
  if (entity_type === "vic" || entity_type === "product") return "bg-cyan-500";
  return "bg-gray-500";
}

type Props = {
  content: RecentActivityContent;
  staggerIndex?: number;
  isAdmin?: boolean;
};

export default function RecentActivityWidget({ content, staggerIndex = 0, isAdmin = false }: Props) {
  const items = (content.items ?? []).slice(0, 5);

  if (items.length === 0) {
    return (
      <AppleWidgetCard
        accent="cyan"
        icon={<Activity size={20} />}
        title="Recent Activity"
        compact
        staggerIndex={staggerIndex}
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity size={28} className="text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="cyan"
      icon={<Activity size={20} />}
      title="Recent Activity"
      rightElement={
        <Link
          href="#"
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View all →
        </Link>
      }
      compact
      staggerIndex={staggerIndex}
    >
      {isAdmin && (
        <p className="text-[10px] text-gray-600 -mt-1 mb-2">Agency-wide activity</p>
      )}
      <ul className="space-y-0">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors -mx-1 px-1 rounded"
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor(item.entity_type))} />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-white">{item.actor_name}</span>
              <span className="text-sm text-gray-400"> {item.action} </span>
              <Link
                href={entityLink(item)}
                className="text-sm text-white hover:underline truncate inline-block max-w-[200px] align-bottom"
              >
                {item.entity_name}
              </Link>
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {formatTimestamp(item.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </AppleWidgetCard>
  );
}
