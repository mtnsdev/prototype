"use client";

import { useMemo, useState } from "react";
import { listDestinationSummaries } from "@/data/destinations";
import { DestinationCard } from "./DestinationCard";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { PageSearchField } from "@/components/ui/page-search-field";
import {
  DASHBOARD_LIST_PAGE_HEADER,
  DASHBOARD_LIST_PAGE_HEADER_SUBTITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK,
} from "@/lib/dashboardChrome";

export function DestinationsPortal() {
  const [q, setQ] = useState("");
  const summaries = useMemo(() => listDestinationSummaries(), []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return summaries;
    return summaries.filter(
      (d) =>
        d.name.toLowerCase().includes(s) ||
        d.tagline.toLowerCase().includes(s) ||
        d.slug.includes(s.replace(/\s+/g, "-")),
    );
  }, [q, summaries]);

  const hasQuery = q.trim().length > 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className={DASHBOARD_LIST_PAGE_HEADER}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Breadcrumbs
            items={[{ label: "Products", href: "/dashboard/products" }, { label: "Destinations" }]}
          />
          <div className={DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK}>
            <h1 className={DASHBOARD_LIST_PAGE_HEADER_TITLE}>Destinations</h1>
            <p className={DASHBOARD_LIST_PAGE_HEADER_SUBTITLE}>
              Curated destination guides inside the catalog — DMCs, dining, hotels, and resources.
            </p>
          </div>
        </div>
      </header>

      <a
        href="#destinations-portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-24 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-brand-cta/40"
      >
        Skip to destination list
      </a>

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6" id="destinations-portal-main">
        <PageSearchField
          value={q}
          onChange={setQ}
          placeholder="Search destinations…"
          aria-label="Search destinations"
          className="max-w-md"
        />

        <p className="text-sm text-muted-foreground">
          {filtered.length} destination{filtered.length !== 1 ? "s" : ""}
          {hasQuery ? " match your search" : ""}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <DestinationCard key={s.slug} summary={s} highlightQuery={q.trim()} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">No destinations match your search.</p>
            {hasQuery ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setQ("")}>
                Clear search
              </Button>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
