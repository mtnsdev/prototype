"use client";

import {
  Palette,
  MousePointerClick,
  PenLine,
  Compass,
  Layers,
  Bell,
  Table,
  Sparkles,
  Filter,
} from "lucide-react";
import { Foundations } from "@/components/design-system/ds-sections/Foundations";
import { Buttons } from "@/components/design-system/ds-sections/Buttons";
import { Inputs } from "@/components/design-system/ds-sections/Inputs";
import { Navigation as NavigationSection } from "@/components/design-system/ds-sections/Navigation";
import { Surfaces } from "@/components/design-system/ds-sections/Surfaces";
import { Feedback } from "@/components/design-system/ds-sections/Feedback";
import { DataDisplay } from "@/components/design-system/ds-sections/DataDisplay";
import { Patterns } from "@/components/design-system/ds-sections/Patterns";
import { CatalogToolbar } from "@/components/design-system/ds-sections/CatalogToolbar";

const SECTIONS = [
  { id: "foundations", label: "Foundations", icon: Palette, description: "Tokens, typography, spacing" },
  { id: "buttons", label: "Buttons", icon: MousePointerClick, description: "Variants, sizes, icons" },
  { id: "inputs", label: "Inputs", icon: PenLine, description: "Forms, search, controls" },
  { id: "navigation", label: "Navigation", icon: Compass, description: "Tabs, breadcrumbs" },
  { id: "catalog-toolbar", label: "Catalog toolbar", icon: Filter, description: "Category strip, filters, view modes" },
  { id: "surfaces", label: "Surfaces", icon: Layers, description: "Cards, sunken, overlays" },
  { id: "feedback", label: "Feedback", icon: Bell, description: "Toasts, badges, empty" },
  { id: "data-display", label: "Data display", icon: Table, description: "Rows, cards, metrics" },
  { id: "patterns", label: "Patterns", icon: Sparkles, description: "Hover, editing, drag" },
];

export default function DesignSystemPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[color:var(--surface-base)]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-6 py-10">
        {/* Main content (left, scrollable as part of page) */}
        <main className="min-w-0 flex-1 space-y-12">
          <header>
            <h1 className="text-[36px] leading-tight text-[color:var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
              Design system
            </h1>
          </header>

          <Foundations />
          <Buttons />
          <Inputs />
          <NavigationSection />
          <CatalogToolbar />
          <Surfaces />
          <Feedback />
          <DataDisplay />
          <Patterns />

          <footer className="border-t border-[color:var(--border-subtle)] pt-6 text-[12px] text-[color:var(--text-quaternary)]">
            Edit <code className="font-mono text-[12px]">src/app/globals.css</code> to change tokens.
            This page renders live components from <code className="font-mono text-[12px]">@/components</code>.
          </footer>
        </main>

        {/* Right sidebar nav (sticky) */}
        <aside className="sticky top-10 hidden h-fit w-52 shrink-0 lg:block">
          <nav aria-label="Section navigation" className="space-y-1">
            <div className="mb-2 px-3 text-[11px] uppercase tracking-wider text-[color:var(--chrome-label)]">
              Sections
            </div>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[color:var(--text-tertiary)] transition-colors hover:bg-[color:var(--surface-interactive)] hover:text-[color:var(--brand-primary)]"
                >
                  <Icon size={14} className="text-[color:var(--chrome-icon-muted)]" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium text-[color:var(--text-primary)]">{s.label}</span>
                    <span className="text-[11px] text-[color:var(--text-quaternary)]">{s.description}</span>
                  </span>
                </a>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
