"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  formatBriefingRelativeTime,
  useKnowledgeHighlights,
} from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";
import { cn } from "@/lib/utils";

const NEW_MS = 48 * 3600_000;

function isHighlightNew(dateIso: string, isNew: boolean): boolean {
  if (isNew) return true;
  return Date.now() - new Date(dateIso).getTime() <= NEW_MS;
}

export function KnowledgeHighlightsWidget() {
  const { data, isPending, isError, error } = useKnowledgeHighlights();
  const items = data ?? [];

  return (
    <WidgetShell
      title="Knowledge highlights"
      icon={Sparkles}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load highlights") : undefined}
      skeletonRows={3}
      actions={
        <Link
          href="/dashboard/knowledge-vault"
          className="text-2xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          See all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No highlights in your vault yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((h) => (
            <li
              key={h.id}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]/40 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">{h.title}</p>
                {isHighlightNew(h.date, h.isNew) ? (
                  <span className="shrink-0 rounded-md border border-[var(--color-success-muted)] bg-[var(--color-success-muted)] px-2 py-0.5 text-2xs font-semibold text-[var(--color-success)]">
                    New
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-interactive)] px-2 py-0.5 text-2xs text-[var(--text-secondary)]">
                  {h.source}
                </span>
                <span className="text-2xs text-[var(--text-tertiary)]">{formatBriefingRelativeTime(h.date)}</span>
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-2xs",
                    h.scope === "team"
                      ? "border-[var(--muted-info-border)] bg-[var(--muted-info-bg)] text-[var(--muted-info-text)]"
                      : "border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                  )}
                >
                  {h.scope === "team" ? "Team" : "Private"}
                </span>
              </div>
              {h.viewCount >= 3 ? (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2" aria-hidden>
                    {["K", "M", "J"].map((initial, i) => (
                      <span
                        key={i}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--surface-card)] bg-[var(--surface-interactive)] text-2xs font-medium text-[var(--text-secondary)]"
                      >
                        {initial}
                      </span>
                    ))}
                  </div>
                  <p className="text-2xs text-[var(--text-tertiary)]">
                    Trending · {h.viewCount} colleague{h.viewCount === 1 ? "" : "s"} viewed
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
