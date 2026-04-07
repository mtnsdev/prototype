"use client";

import { useRouter } from "next/navigation";
import { Activity, BookOpen, Building2, MapPin, Search, Users } from "lucide-react";
import type { RecentActivityItem, RecentActivityType } from "@/types/briefing-room";
import {
  formatBriefingRelativeTime,
  groupRecentActivityLabel,
  useRecentActivity,
} from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<RecentActivityType, typeof Users> = {
  vic: Users,
  document: BookOpen,
  product: Building2,
  search: Search,
  itinerary: MapPin,
};

const GROUP_ORDER: Record<ReturnType<typeof groupRecentActivityLabel>, number> = {
  Today: 0,
  Yesterday: 1,
  "This week": 2,
  Earlier: 3,
};

export function RecentActivityWidget() {
  const router = useRouter();
  const { data, isPending, isError, error } = useRecentActivity();

  const items = data ?? [];
  const grouped = [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const sections = new Map<string, RecentActivityItem[]>();
  for (const item of grouped) {
    const g = groupRecentActivityLabel(item.timestamp);
    const list = sections.get(g) ?? [];
    list.push(item);
    sections.set(g, list);
  }

  const sectionKeys = [...sections.keys()].sort(
    (a, b) =>
      GROUP_ORDER[a as ReturnType<typeof groupRecentActivityLabel>] -
      GROUP_ORDER[b as ReturnType<typeof groupRecentActivityLabel>]
  );

  return (
    <WidgetShell
      title="Recent activity"
      icon={Activity}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load activity") : undefined}
      skeletonRows={6}
      actions={
        <button
          type="button"
          className="text-2xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
          onClick={() => router.push("/dashboard/chat")}
        >
          See all
        </button>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No recent activity yet.</p>
      ) : (
        <div className="space-y-5">
          {sectionKeys.map((key) => {
            const list = sections.get(key);
            if (!list?.length) return null;
            return (
              <div key={key}>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {key}
                </p>
                <ul className="space-y-1">
                  {list.map((item) => (
                    <li key={item.id}>
                      <ActivityRow item={item} onNavigate={() => router.push(item.route)} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

function ActivityRow({ item, onNavigate }: { item: RecentActivityItem; onNavigate: () => void }) {
  const Icon = TYPE_ICONS[item.type];
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors",
        "hover:bg-[var(--surface-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-chat-user)]/40"
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-base)] text-[var(--text-tertiary)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
        <span className="block truncate text-xs text-[var(--text-secondary)]">{item.subtitle}</span>
      </span>
      <span className="shrink-0 text-2xs tabular-nums text-[var(--text-tertiary)]">
        {formatBriefingRelativeTime(item.timestamp)}
      </span>
    </button>
  );
}
