"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import type { NewsAlertContent, NewsAlertItem } from "@/types/briefing";
import { cn } from "@/lib/utils";

function isUnsplashThumbnail(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "images.unsplash.com" && u.protocol === "https:";
  } catch {
    return false;
  }
}

function NewsThumb({ item }: { item: NewsAlertItem }) {
  if (item.thumbnail_url) {
    const allowlisted = isUnsplashThumbnail(item.thumbnail_url);
    return (
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
        <Image
          src={item.thumbnail_url}
          alt=""
          fill
          className="object-cover"
          sizes="32px"
          unoptimized={!allowlisted}
        />
      </span>
    );
  }
  const letter = (item.source ?? "?")[0].toUpperCase();
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/55 text-sm font-medium text-foreground/85">
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
  if (severity === "urgent") return "bg-foreground/65";
  if (severity === "warning") return "bg-foreground/40";
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
        accent="gray"
        icon={<Bell size={20} />}
        title="News & Alerts"
        staggerIndex={staggerIndex}
      >
        <p className="text-2xs text-muted-foreground/70 -mt-2 mb-3 text-center md:text-left">
          Based on your destinations and partners
        </p>
        <BriefingEmptyState
          icon={<Bell />}
          title="No alerts right now"
          description="News and partner updates for your destinations will land here."
        />
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="gray"
      icon={<Bell size={20} />}
      title="News & Alerts"
      rightElement={
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
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
              "flex gap-3 rounded-xl border border-border bg-muted/20 p-3",
              item.severity === "urgent" && "bg-muted/45",
            )}
          >
            <NewsThumb item={item} />
            <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5 self-start", severityDot(item.severity))} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.headline}</p>
              <p className="text-xs text-muted-foreground/90 truncate mt-0.5">{item.summary}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <span className="rounded bg-muted/50 px-1.5 py-0.5">{item.source}</span>
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
          className="mt-4 inline-block rounded-md text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          View all {total} alerts →
        </Link>
      )}
    </AppleWidgetCard>
  );
}
