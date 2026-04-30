"use client";

import { ComponentExample } from "../ComponentExample";

export function Surfaces() {
  return (
    <section id="surfaces" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Surfaces</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Cards, sunken regions, overlays. All surfaces draw from the Paper &amp; Linen palette.
        </p>
      </header>

      <ComponentExample
        title="Card"
        description="--surface-card with --border-subtle. Hover swaps to --surface-card-hover."
        preview={
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--chrome-label)]">Default</div>
              <div className="mt-1 text-[14px] font-medium text-[color:var(--text-primary)]">Aman Tokyo</div>
              <div className="text-[12px] text-[color:var(--text-tertiary)]">Tokyo, Japan</div>
            </div>
            <div className="rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface-card-hover)] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[color:var(--chrome-label)]">Hover</div>
              <div className="mt-1 text-[14px] font-medium text-[color:var(--text-primary)]">Aman Tokyo</div>
              <div className="text-[12px] text-[color:var(--text-tertiary)]">Tokyo, Japan</div>
            </div>
          </div>
        }
      />

      <ComponentExample
        title="Sunken (input bg / code blocks)"
        description="--surface-sunken sits below the page surface. Used for inputs, code blocks, map chrome."
        preview={
          <div className="w-full rounded-md bg-[color:var(--surface-sunken)] p-4 font-mono text-[12px] text-[color:var(--text-secondary)]">
            sqlite3 enable_production.db &quot;.schema products&quot;
          </div>
        }
      />

      <ComponentExample
        title="Overlay (popover / dropdown)"
        description="--surface-overlay with --shadow-md elevation."
        preview={
          <div
            className="w-72 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-overlay)] p-2"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="rounded px-2 py-1.5 text-[13px] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-interactive)]">Edit</div>
            <div className="rounded px-2 py-1.5 text-[13px] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-interactive)]">Duplicate</div>
            <div className="rounded px-2 py-1.5 text-[13px] text-[color:var(--color-error)] hover:bg-[color:var(--surface-interactive)]">Delete</div>
          </div>
        }
      />
    </section>
  );
}
