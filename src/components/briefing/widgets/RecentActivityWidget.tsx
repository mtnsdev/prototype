"use client";

import Link from "next/link";
import type { RecentActivityContent } from "@/types/briefing";

function entityLink(item: RecentActivityContent["items"][0]): string {
  if (item.entity_type === "itinerary") return `/dashboard/itineraries/${item.entity_id}`;
  if (item.entity_type === "vic") return `/dashboard/vics/${item.entity_id}`;
  if (item.entity_type === "product") return `/dashboard/products/${item.entity_id}`;
  return "#";
}

function groupByTime(items: RecentActivityContent["items"]): { label: string; items: typeof items }[] {
  const now = Date.now();
  const day = 86400000;
  const today: typeof items = [];
  const yesterday: typeof items = [];
  const week: typeof items = [];
  items.forEach((i) => {
    const t = new Date(i.timestamp).getTime();
    if (now - t < day) today.push(i);
    else if (now - t < 2 * day) yesterday.push(i);
    else week.push(i);
  });
  const groups: { label: string; items: typeof items }[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (week.length) groups.push({ label: "This week", items: week });
  return groups;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

type Props = { content: RecentActivityContent };

export default function RecentActivityWidget({ content }: Props) {
  const items = (content.items ?? []).slice(0, 15);
  const groups = groupByTime(items);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[rgba(245,245,245,0.5)] py-4">No recent activity.</p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs font-medium text-[rgba(245,245,245,0.5)] mb-2">{g.label}</p>
          <ul className="space-y-2">
            {g.items.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-[#F5F5F5] shrink-0">
                  {item.actor_name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-[rgba(245,245,245,0.8)]">{item.action} — </span>
                  <Link
                    href={entityLink(item)}
                    className="text-sm text-[#F5F5F5] hover:underline"
                  >
                    {item.entity_name}
                  </Link>
                  <span className="text-xs text-[rgba(245,245,245,0.4)] ml-1">{timeAgo(item.timestamp)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
