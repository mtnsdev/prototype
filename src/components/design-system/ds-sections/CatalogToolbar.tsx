"use client";

import { useState } from "react";
import {
  Building2,
  Compass,
  Globe,
  Heart,
  Plane,
  Ship,
  Sofa,
  Sparkles,
  Utensils,
  ArrowDownUp,
  MapPin,
  Hotel,
} from "lucide-react";
import { CategoryStrip } from "@/components/products/toolbar/CategoryStrip";
import { FilterPill } from "@/components/products/toolbar/FilterPill";
import { ResultsToolbar, type ViewMode } from "@/components/products/toolbar/ResultsToolbar";
import { ComponentExample } from "../ComponentExample";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "hotel", label: "Hotel / Resort", icon: Hotel },
  { id: "villa", label: "Villa / Residence", icon: Sofa },
  { id: "restaurant", label: "Restaurant", icon: Utensils },
  { id: "dmc", label: "DMC", icon: Globe },
  { id: "experience", label: "Experience / Tour", icon: Compass },
  { id: "cruise", label: "Cruise", icon: Ship },
  { id: "wellness", label: "Wellness / Spa", icon: Heart },
  { id: "transport", label: "Transport", icon: Plane },
  { id: "other", label: "Other", icon: Building2 },
];

export function CatalogToolbar() {
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [selectMode, setSelectMode] = useState(false);
  const [activeIncentives, setActiveIncentives] = useState(false);

  return (
    <section id="catalog-toolbar" className="space-y-8 scroll-mt-24">
      <header className="space-y-1">
        <h2 className="text-[22px] font-medium text-[color:var(--text-primary)]">Catalog toolbar</h2>
        <p className="text-[13px] text-[color:var(--text-secondary)]">
          The locked three-row pattern for the Products / Collections / Destinations directory:
          category strip → filter pill row → results toolbar.
        </p>
      </header>

      <ComponentExample
        title="Full toolbar"
        description="Live composition. Click a category, toggle Active incentives, switch view modes — all wired."
        preview={
          <div className="flex w-full flex-col gap-3">
            <CategoryStrip items={CATEGORIES} active={category} onChange={setCategory} />

            <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--border-subtle)] pt-3">
              <FilterPill label="Sort" value="Name A → Z" icon={ArrowDownUp} />
              <FilterPill label="Location" icon={MapPin} />
              <FilterPill label="Collection" />
              <FilterPill label="Program" />
              <FilterPill label="Rep firm" />
              <FilterPill label="Amenities" />
              <FilterPill
                label="Active incentives"
                toggle
                toggleOn={activeIncentives}
                onToggle={setActiveIncentives}
              />
              <FilterPill label="Commission" />
              <FilterPill label="Tier" />
              <FilterPill label="Price" />
            </div>

            <div className="border-t border-[color:var(--border-subtle)] pt-3">
              <ResultsToolbar
                count={3}
                view={view}
                onViewChange={setView}
                selectMode={selectMode}
                onSelectModeToggle={() => setSelectMode((s) => !s)}
              />
            </div>
          </div>
        }
        snippet={`<CategoryStrip items={CATEGORIES} active={cat} onChange={setCat} />

<FilterPill label="Location" value="Tokyo" icon={MapPin} onClick={open} />
<FilterPill label="Active incentives" toggle toggleOn={on} onToggle={set} />

<ResultsToolbar count={3} view={view} onViewChange={setView}
  selectMode={selectMode} onSelectModeToggle={toggle} />`}
      />

      <ComponentExample
        title="Category strip alone"
        description="Horizontal scrollable. Each chip optional icon + label. Active state uses --surface-interactive + --brand-primary."
        preview={
          <CategoryStrip items={CATEGORIES.slice(0, 6)} active={category} onChange={setCategory} />
        }
        snippet={`<CategoryStrip
  items={[{ id: "all", label: "All" }, { id: "hotel", label: "Hotel", icon: Hotel }]}
  active="all"
  onChange={setCat}
/>`}
      />

      <ComponentExample
        title="Filter pills — variants"
        description="Three states: closed, with active value, toggle. Each pill owns its own dropdown — no centralized filter panel."
        preview={
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label="Location" icon={MapPin} />
            <FilterPill label="Location" value="Tokyo" icon={MapPin} active />
            <FilterPill label="Sort" value="Name A → Z" icon={ArrowDownUp} />
            <FilterPill
              label="Active incentives"
              toggle
              toggleOn={activeIncentives}
              onToggle={setActiveIncentives}
            />
            <FilterPill label="Tier" open />
          </div>
        }
        snippet={`<FilterPill label="Location" icon={MapPin} />
<FilterPill label="Location" value="Tokyo" icon={MapPin} active />
<FilterPill label="Active incentives" toggle toggleOn={on} onToggle={set} />`}
      />

      <ComponentExample
        title="Results toolbar"
        description="Count + multi-select toggle + view mode switcher (Grid / List / Map)."
        preview={
          <ResultsToolbar
            count={142}
            view={view}
            onViewChange={setView}
            selectMode={selectMode}
            onSelectModeToggle={() => setSelectMode((s) => !s)}
          />
        }
        snippet={`<ResultsToolbar
  count={142}
  view={view}
  onViewChange={setView}
  selectMode={selectMode}
  onSelectModeToggle={toggle}
/>`}
      />
    </section>
  );
}
