"use client";

import Link from "next/link";
import type { NewsAlertContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

function severityBorder(severity: string): string {
  if (severity === "urgent") return "border-l-[var(--muted-error-text)]";
  if (severity === "warning") return "border-l-[var(--muted-amber-text)]";
  return "border-l-[var(--muted-info-text)]";
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

type Props = { content: NewsAlertContent };

export default function NewsAlertsWidget({ content }: Props) {
  const items = content.items ?? [];
  if (items.length === 0) {
    return (
      <p className="text-sm text-[rgba(245,245,245,0.5)] py-4">No alerts right now.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "rounded-lg border border-[rgba(255,255,255,0.06)] border-l-4 bg-white/[0.03] p-3",
            severityBorder(item.severity),
            item.severity === "urgent" && "animate-pulse"
          )}
        >
          <p className="font-medium text-[#F5F5F5] text-sm">{item.headline}</p>
          <p className="text-xs text-[rgba(245,245,245,0.6)] mt-1 line-clamp-2">{item.summary}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]">
              {item.source}
            </span>
            {item.destination && (
              <span className="text-xs text-[rgba(245,245,245,0.5)]">{item.destination}</span>
            )}
            <span className="text-xs text-[rgba(245,245,245,0.4)]">{timeAgo(item.published_at)}</span>
            {item.affects_products && item.affects_products.length > 0 && (
              <Link
                href="/dashboard/products"
                className="text-xs text-[rgba(245,245,245,0.7)] hover:underline"
              >
                {item.affects_products.length} product{item.affects_products.length !== 1 ? "s" : ""} affected
              </Link>
            )}
            {item.affects_vics && item.affects_vics.length > 0 && (
              <span className="text-xs text-[var(--muted-amber-text)]">
                {item.affects_vics.length} VIC{item.affects_vics.length !== 1 ? "s" : ""} with upcoming trips
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
