"use client";

import { Check, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { MUTED_STATE_TOKENS } from "@/lib/designSystemTokens";
import { ComponentExample } from "../ComponentExample";

export function Feedback() {
  return (
    <section id="feedback" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Feedback</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Toasts, inline alerts, badges. All using the muted-state pairs from §1.
        </p>
      </header>

      <ComponentExample
        title="Bar notification"
        description="The new less-intrusive pattern (per April 30 call) — less than full-screen modal, more than nothing."
        preview={
          <div className="w-full max-w-md space-y-2">
            <Bar tone="success" icon={<Check size={14} />} title="Saved to itinerary" body="Aman Tokyo added to Greece - Day 4." />
            <Bar tone="warning" icon={<AlertTriangle size={14} />} title="Program expiring soon" body="Hilton Impresario renews on 2026-08-15." />
            <Bar tone="error" icon={<AlertCircle size={14} />} title="Sync failed" body="Could not reach the brand portal. Retry?" />
            <Bar tone="info" icon={<Info size={14} />} title="3 new documents" body="Knowledge Vault picked up new files from Google Drive." />
          </div>
        }
      />

      <ComponentExample
        title="Badges (muted-state)"
        description="One badge per muted-state token from §1. These are the canonical badge colors — no Tailwind drift."
        preview={
          <div className="flex flex-wrap gap-2">
            {MUTED_STATE_TOKENS.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: t.value,
                  color: t.pairText,
                  border: `1px solid ${t.pairBorder}`,
                }}
              >
                {t.badgeLabel}
              </span>
            ))}
          </div>
        }
        snippet={`<span style={{
  background: "var(--muted-success-bg)",
  color: "var(--muted-success-text)",
  border: "1px solid var(--muted-success-border)",
}} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium">
  Active
</span>`}
      />

      <ComponentExample
        title="Empty state"
        preview={
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-md border border-dashed border-[color:var(--border-default)] bg-[color:var(--surface-card)] py-10 text-center">
            <div className="text-[14px] font-medium text-[color:var(--text-primary)]">No products found</div>
            <div className="mt-1 text-[12px] text-[color:var(--text-tertiary)]">Try a different search term.</div>
          </div>
        }
      />
    </section>
  );
}

function Bar({ tone, icon, title, body }: { tone: "success" | "warning" | "error" | "info"; icon: React.ReactNode; title: string; body: string }) {
  const map = {
    success: {
      bg: "var(--muted-success-bg)",
      border: "var(--muted-success-border)",
      text: "var(--muted-success-text)",
    },
    warning: {
      bg: "var(--muted-warning-bg)",
      border: "var(--muted-warning-border)",
      text: "var(--muted-warning-text)",
    },
    error: {
      bg: "var(--muted-error-bg)",
      border: "var(--muted-error-border)",
      text: "var(--muted-error-text)",
    },
    info: {
      bg: "var(--muted-info-bg)",
      border: "var(--muted-info-border)",
      text: "var(--muted-info-text)",
    },
  }[tone];
  return (
    <div
      className="flex items-start gap-3 rounded-md border px-3 py-2.5"
      style={{ background: map.bg, borderColor: map.border, color: map.text }}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 text-[12px]">
        <div className="font-medium">{title}</div>
        <div className="opacity-90">{body}</div>
      </div>
    </div>
  );
}
