"use client";

import { Building2, Layers, Map, Package, Handshake, ChevronRight } from "lucide-react";
import { ComponentExample } from "../ComponentExample";

export function Navigation() {
  return (
    <section id="navigation" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Navigation</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          Tab nav, sticky headers, breadcrumbs. The shapes used across the app.
        </p>
      </header>

      <ComponentExample
        title="Segment tab nav (pill)"
        description="The Products / Collections / Destinations / Rep Firms / Partner Programs pattern. Active tab uses --surface-card background + --brand-primary text."
        preview={
          <SegmentTabNav active="products" />
        }
      />

      <ComponentExample
        title="Underline tab nav"
        description="Alternative when the segment pill is too heavy for the context. Border-bottom + brand-primary text on active."
        preview={
          <div className="flex items-center gap-0.5 border-b border-[color:var(--border-default)] px-1 -mb-px">
            {[
              { key: "p", label: "Products", active: true },
              { key: "c", label: "Collections", active: false },
              { key: "d", label: "Destinations", active: false },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  t.active
                    ? "border-[color:var(--brand-primary)] text-[color:var(--brand-primary)]"
                    : "border-transparent text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <ComponentExample
        title="Breadcrumb"
        preview={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[color:var(--text-tertiary)]">
            <a href="#" className="hover:text-[color:var(--text-primary)]">Products</a>
            <ChevronRight size={12} />
            <a href="#" className="hover:text-[color:var(--text-primary)]">Destinations</a>
            <ChevronRight size={12} />
            <span className="text-[color:var(--text-primary)]">Greece</span>
          </nav>
        }
      />
    </section>
  );
}

function SegmentTabNav({ active }: { active: string }) {
  const tabs = [
    { key: "products", label: "Products", icon: Package },
    { key: "collections", label: "Collections", icon: Layers },
    { key: "destinations", label: "Destinations", icon: Map },
    { key: "rep-firms", label: "Rep Firms", icon: Building2 },
    { key: "partner-programs", label: "Partner Programs", icon: Handshake },
  ];
  return (
    <div className="flex w-fit items-center gap-1 rounded-full bg-[color:var(--surface-card-hover)] p-1">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-[color:var(--surface-card)] text-[color:var(--brand-primary)] shadow-[0_0_0_0.5px_rgba(40,48,42,0.09)]"
                : "text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
            }`}
          >
            <Icon size={14} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
