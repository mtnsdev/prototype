"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { formatBriefingRelativeTime, usePublicationFeed } from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";

export function PublicationFeedWidget() {
  const { data, isPending, isError, error } = usePublicationFeed();
  const items = (data ?? []).slice(0, 6);

  return (
    <WidgetShell
      title="Publication feed"
      icon={Newspaper}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load publications") : undefined}
      skeletonRows={5}
      actions={
        <Link
          href="/dashboard/settings/integrations"
          className="text-2xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          Manage sources
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No publications yet. Connect sources in settings.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((pub) => (
            <li key={pub.id} className="border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0">
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-chat-user)]/40"
              >
                <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-cta)]">
                  {pub.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{pub.summary}</p>
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-2xs text-[var(--text-tertiary)]">{pub.source}</span>
                <span className="text-2xs text-[var(--text-quaternary)]">·</span>
                <span className="text-2xs text-[var(--text-tertiary)]">
                  {formatBriefingRelativeTime(pub.publishedAt)}
                </span>
              </div>
              {pub.destinationTags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {pub.destinationTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-interactive)] px-2 py-0.5 text-2xs text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
