"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { Advisory, AdvisorySeverity } from "@/types/briefing-room";
import { useAdvisories } from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: AdvisorySeverity[] = ["critical", "warning", "info"];

function severityBorder(sev: AdvisorySeverity): string {
  switch (sev) {
    case "critical":
      return "border-l-[var(--color-error)]";
    case "warning":
      return "border-l-[var(--color-warning)]";
    case "info":
      return "border-l-[var(--color-info)]";
    default:
      return "border-l-[var(--border-default)]";
  }
}

export function AdvisoriesWidget() {
  const { data, isPending, isError, error } = useAdvisories();
  const items = data ?? [];

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  }, [items]);

  return (
    <WidgetShell
      title="Advisories"
      icon={AlertTriangle}
      size="wide"
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load advisories") : undefined}
      skeletonRows={3}
    >
      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No active advisories for your corridors.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {sorted.map((advisory) => (
            <li key={advisory.id}>
              <AdvisoryCard advisory={advisory} />
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

function AdvisoryCard({ advisory }: { advisory: Advisory }) {
  return (
    <article
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] border-l-4 bg-[var(--surface-base)]/50 p-4",
        severityBorder(advisory.severity)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{advisory.destination}</h3>
        <span className="shrink-0 rounded-md border border-[var(--border-subtle)] px-2 py-0.5 text-2xs uppercase tracking-wide text-[var(--text-tertiary)]">
          {advisory.category.replace("-", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-snug text-[var(--text-secondary)]">{advisory.summary}</p>
      <button
        type="button"
        className="mt-3 text-left text-2xs font-medium text-[var(--brand-cta)] transition-colors hover:text-[var(--brand-cta-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-chat-user)]/40 rounded-sm"
      >
        View details
        <span className="sr-only"> for {advisory.destination}</span>
      </button>
    </article>
  );
}
