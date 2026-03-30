"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import type { NewsAlertContent, NewsAlertItem } from "@/types/briefing";
import { cn } from "@/lib/utils";

function NewsThumb({ item }: { item: NewsAlertItem }) {
  if (item.thumbnail_url) {
    return (
      <span className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-zinc-800 ring-1 ring-white/5">
        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  const letter = (item.source ?? "?")[0].toUpperCase();
  return (
    <span className="w-8 h-8 rounded-lg shrink-0 bg-amber-500/15 flex items-center justify-center text-[var(--color-warning)]/90 text-sm font-medium">
      {letter}
    </span>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return `${Math.floor(diff / 60000)}m ago`;
}

function severityDot(severity: string) {
  if (severity === "urgent") return "bg-red-500";
  if (severity === "warning") return "bg-amber-500";
  return "bg-muted-foreground/40";
}

type Props = {
  content: NewsAlertContent;
  staggerIndex?: number;
};

export default function NewsAlertsWidget({ content, staggerIndex = 0 }: Props) {
  const items = content.items ?? [];
  const total = items.length;
  const sorted = [...items].sort((a, b) => {
    const order = { urgent: 0, warning: 1, info: 2 };
    const diff = (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
    if (diff !== 0) return diff;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
  const top3 = sorted.slice(0, 3);

  if (total === 0) {
    return (
      <AppleWidgetCard
        accent="amber"
        icon={<Bell size={20} />}
        title="News & Alerts"
        staggerIndex={staggerIndex}
      >
        <p className="text-2xs text-muted-foreground/70 -mt-2 mb-3 text-center md:text-left">
          Based on your destinations and partners
        </p>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell size={28} className="text-muted-foreground/70 mb-2" />
          <p className="text-sm text-muted-foreground">No alerts right now — your world is quiet</p>
        </div>
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="amber"
      icon={<Bell size={20} />}
      title="News & Alerts"
      rightElement={
        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-[var(--color-warning)]">
          {total}
        </span>
      }
      staggerIndex={staggerIndex}
    >
      <p className="text-2xs text-muted-foreground/70 -mt-2 mb-3">
        Based on your destinations and partners
      </p>
      <div className="space-y-2">
        {top3.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl bg-white/[0.03] p-3 flex gap-3",
              item.severity === "urgent" && "bg-red-500/5"
            )}
          >
            <NewsThumb item={item} />
            <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5 self-start", severityDot(item.severity))} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{item.headline}</p>
              <p className="text-xs text-muted-foreground/90 truncate mt-0.5">{item.summary}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <span className="bg-white/[0.04] rounded px-1.5 py-0.5">{item.source}</span>
                {item.tags?.map((tag) => (
                  <span key={tag} className="text-2xs text-muted-foreground/70">
                    {tag}
                  </span>
                ))}
                {!item.tags?.length && item.destination && <span>{item.destination}</span>}
                <span>{timeAgo(item.published_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {total > 3 && (
        <Link
          href="#"
          className="inline-block mt-4 text-xs text-[var(--color-warning)] hover:text-amber-300 transition-colors"
        >
          View all {total} alerts →
        </Link>
      )}
    </AppleWidgetCard>
  );
}
