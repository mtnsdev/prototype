"use client";

import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ComponentExample } from "../ComponentExample";

export function Patterns() {
  return (
    <section id="patterns" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Patterns</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Cross-component conventions. These aren&apos;t single components — they&apos;re shapes used
          consistently across surfaces.
        </p>
      </header>

      <ComponentExample
        title="Hover affordance pattern"
        description="Admin controls fade in on hover (opacity 0 → 1). At rest, the row looks identical to the advisor view. Force-hover state shown on the right."
        preview={
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <HoverRow forceHover={false} label="At rest" />
            <HoverRow forceHover={true} label="On hover (admin)" />
          </div>
        }
        snippet={`<div className="group relative">
  <div className="opacity-0 transition-opacity group-hover:opacity-100">
    <Button size="icon" variant="ghost"><Pencil /></Button>
    <Button size="icon" variant="ghost"><Trash2 /></Button>
  </div>
  {/* row content */}
</div>`}
      />

      <ComponentExample
        title="Inline editing — Option A: section expansion"
        description="Edit controls reveal in-place; the row expands. Faster for quick edits, can clutter long lists."
        preview={
          <div className="w-full overflow-hidden rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
            <div className="flex items-center gap-3 border-b border-[color:var(--border-subtle)] px-3 py-2.5">
              <span className="size-2 shrink-0 rounded-full bg-[color:var(--brand-primary)]" aria-hidden />
              <span className="text-[13px] font-medium text-[color:var(--text-primary)]">Aman Tokyo</span>
            </div>
            <div className="space-y-2 bg-[color:var(--surface-elevated)] px-3 py-3">
              <input
                defaultValue="Aman Tokyo"
                className="w-full rounded border border-[color:var(--border-default)] bg-[color:var(--surface-card)] px-2 py-1 text-[13px] focus:border-[color:var(--brand-cta)] focus:outline-none"
              />
              <textarea
                rows={2}
                defaultValue="Curation note: rooftop bar, exceptional Tokyo views."
                className="w-full rounded border border-[color:var(--border-default)] bg-[color:var(--surface-card)] px-2 py-1 text-[12px] focus:border-[color:var(--brand-cta)] focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button className="rounded px-2 py-1 text-[12px] text-[color:var(--text-tertiary)] hover:bg-[color:var(--surface-interactive)]">Cancel</button>
                <button className="rounded bg-[color:var(--brand-cta)] px-3 py-1 text-[12px] font-medium text-[color:var(--brand-cta-foreground)]">Save</button>
              </div>
            </div>
          </div>
        }
      />

      <ComponentExample
        title="Inline editing — Option B: modal"
        description="Edit happens in a modal overlay; the row is preserved underneath. Cleaner, more obvious entry/exit."
        preview={
          <div className="relative w-full overflow-hidden rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
            <div className="space-y-0">
              {[
                "Aman Tokyo",
                "Sushi Saito",
                "Imperial Tour Tokyo",
              ].map((n) => (
                <div key={n} className="flex items-center gap-3 px-3 py-2.5 opacity-30">
                  <span className="size-2 shrink-0 rounded-full bg-[color:var(--brand-primary)]" aria-hidden />
                  <span className="text-[13px] text-[color:var(--text-primary)]">{n}</span>
                </div>
              ))}
            </div>
            <div
              className="absolute inset-x-6 top-6 rounded-md border border-[color:var(--border-default)] bg-[color:var(--surface-overlay)] p-4"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-medium text-[color:var(--text-primary)]">Edit product</h4>
                <button className="rounded p-1 text-[color:var(--text-tertiary)] hover:bg-[color:var(--surface-interactive)]">
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                defaultValue="Aman Tokyo"
                className="mt-3 w-full rounded border border-[color:var(--border-default)] bg-[color:var(--surface-card)] px-2 py-1 text-[13px] focus:border-[color:var(--brand-cta)] focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="rounded px-2 py-1 text-[12px] text-[color:var(--text-tertiary)]">Cancel</button>
                <button className="rounded bg-[color:var(--brand-cta)] px-3 py-1 text-[12px] font-medium text-[color:var(--brand-cta-foreground)]">Save</button>
              </div>
            </div>
          </div>
        }
      />

      <ComponentExample
        title="Drag handle pattern"
        description="Vertical-grip handle reveals on hover. Pairs with dnd-kit SortableContext."
        preview={
          <div className="w-full divide-y divide-[color:var(--border-subtle)] rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
            {["Welcome amenities", "Recommended hotels", "Local guides"].map((s) => (
              <div key={s} className="group flex items-center gap-2 px-3 py-2.5">
                <button
                  className="cursor-grab text-[color:var(--chrome-icon-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Drag to reorder"
                >
                  <GripVertical size={14} />
                </button>
                <span className="text-[13px] font-medium text-[color:var(--text-primary)]">{s}</span>
              </div>
            ))}
          </div>
        }
      />
    </section>
  );
}

function HoverRow({ forceHover, label }: { forceHover: boolean; label: string }) {
  return (
    <div className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--chrome-label)]">{label}</div>
      <div className="relative flex items-center gap-3 rounded px-2 py-2">
        <span className="size-2 shrink-0 rounded-full bg-[color:var(--brand-primary)]" aria-hidden />
        <span className="text-[13px] font-medium text-[color:var(--text-primary)]">Aman Tokyo</span>
        <div
          className={`ml-auto flex items-center gap-0.5 transition-opacity ${
            forceHover ? "opacity-100" : "opacity-0"
          }`}
        >
          <button className="rounded p-1 text-[color:var(--chrome-icon)] hover:bg-[color:var(--surface-interactive)]" aria-label="Edit">
            <Pencil size={14} />
          </button>
          <button className="rounded p-1 text-[color:var(--chrome-icon)] hover:bg-[color:var(--surface-interactive)]" aria-label="More">
            <MoreHorizontal size={14} />
          </button>
          <button className="rounded p-1 text-[color:var(--color-error)] hover:bg-[color:var(--surface-interactive)]" aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
