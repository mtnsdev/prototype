"use client";

import { ClipboardCheck } from "lucide-react";
import { usePreDepartureTriggers } from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";

export function PreDepartureWidget() {
  const { data, isPending, isError, error } = usePreDepartureTriggers();
  const triggers = data ?? [];

  return (
    <WidgetShell
      title="Pre-departure triggers"
      icon={ClipboardCheck}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load triggers") : undefined}
      skeletonRows={3}
    >
      <div className="mb-3 rounded-md border border-[var(--border-subtle)] bg-[rgba(174,133,80,0.12)] px-3 py-2">
        <p className="text-2xs font-medium text-[var(--text-primary)]">Preview — connects with Axus</p>
        <p className="text-2xs text-[var(--text-secondary)]">
          Checklist progress and deadlines will sync when Axus is connected.
        </p>
      </div>
      {triggers.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No sample triggers.</p>
      ) : (
        <ul className="space-y-4">
          {triggers.map((t) => {
            const total = t.checklistItems.length;
            const pct = total === 0 ? 0 : Math.round((t.completedCount / total) * 100);
            return (
              <li
                key={t.id}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]/40 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{t.clientName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {t.destination} · {t.daysUntil} days out
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-2xs text-[var(--text-tertiary)]">
                    <span>Checklist</span>
                    <span className="tabular-nums">
                      {t.completedCount}/{total}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-interactive)]"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Checklist progress for ${t.clientName}`}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--brand-chat-user)] transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-2xs text-[var(--text-secondary)]">
                  {t.checklistItems.map((c) => (
                    <li key={c}>· {c}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetShell>
  );
}
