"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ProductCatalogSectionTabs } from "@/components/products/ProductCatalogSectionTabs";
import {
  hrefForCatalogTab,
  type CatalogSegment,
} from "@/components/products/productDirectoryCatalogSegments";
import { useUser } from "@/contexts/UserContext";
import { createStubDestination, getDestinationBySlug, listDestinationSummaries } from "@/data/destinations";
import { loadPublishedDestination } from "@/lib/destinationLocalEdits";
import { countDestinationVirtualSections } from "@/lib/destinationSectionModel";
import {
  buildMergedDestinationSummaries,
  DESTINATION_STORAGE_EVENT,
} from "@/lib/destinationLocalEdits";
import { usePermissions } from "@/hooks/usePermissions";
import { DestinationCard } from "./DestinationCard";
import { AddDestinationDialog } from "./AddDestinationDialog";
import { Button } from "@/components/ui/button";
import { APP_PAGE_CONTENT_MAX, APP_PAGE_CONTENT_PAD_X, APP_TOOLBAR_ROW } from "@/lib/dashboardChrome";
import { PageSearchField } from "@/components/ui/page-search-field";
import { cn } from "@/lib/utils";

export function DestinationsPortal() {
  const router = useRouter();
  const { user } = useUser();
  const { isAdmin } = usePermissions();
  const agencyId = user?.agency_id ?? null;
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [summaries, setSummaries] = useState(() => listDestinationSummaries(agencyId));

  useEffect(() => {
    setSummaries(buildMergedDestinationSummaries(agencyId));
    const bump = () => setSummaries(buildMergedDestinationSummaries(agencyId));
    window.addEventListener(DESTINATION_STORAGE_EVENT, bump);
    return () => window.removeEventListener(DESTINATION_STORAGE_EVENT, bump);
  }, [agencyId]);

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

  const filteredWithSections = useMemo(
    () =>
      filtered.map((s) => {
        const full =
          getDestinationBySlug(s.slug) ??
          loadPublishedDestination(s.slug, createStubDestination(s.slug, s.name, s.tagline));
        return {
          ...s,
          sectionCount: countDestinationVirtualSections(full),
        };
      }),
    [filtered],
  );

  const hasQuery = q.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {isAdmin ? <AddDestinationDialog open={addOpen} onOpenChange={setAddOpen} /> : null}

      {/* Match ProductDirectoryPage: tabs row, then inset strip (same as browse filter band). */}
      <div className="shrink-0">
        <div
          className={cn(
            APP_TOOLBAR_ROW,
            "relative z-50 min-w-0 flex flex-wrap items-center gap-3 px-6",
          )}
        >
          <div className="min-w-0 max-w-full flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ProductCatalogSectionTabs
              value="destinations"
              onChange={(segment: CatalogSegment) => router.push(hrefForCatalogTab(segment))}
            />
          </div>
        </div>

        <div
          className={cn(
            "relative z-50 shrink-0 border-b border-border bg-inset py-3",
            APP_PAGE_CONTENT_MAX,
            APP_PAGE_CONTENT_PAD_X,
          )}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
              <PageSearchField
                value={q}
                onChange={setQ}
                placeholder="Search destinations…"
                aria-label="Search destinations"
              />
            </div>
            {isAdmin ? (
              <Button
                type="button"
                variant="toolbarAccent"
                size="sm"
                className="shrink-0"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add destination
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <a
        href="#destinations-portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-brand-cta/40"
      >
        Skip to destination list
      </a>

      <main
        id="destinations-portal-main"
        className={cn(
          "relative z-0 min-h-0 flex-1 overflow-y-auto pb-6",
          APP_PAGE_CONTENT_MAX,
          APP_PAGE_CONTENT_PAD_X,
          "pt-4",
        )}
      >
        <h1 className="sr-only">Destinations</h1>
        {filteredWithSections.length > 0 ? (
          <div
            className={cn(
              "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 view-transition-active",
              "xl:grid-cols-4",
            )}
          >
            {filteredWithSections.map((s) => (
              <DestinationCard key={s.slug} summary={s} highlightQuery={q.trim()} />
            ))}
          </div>
        ) : null}

        {filteredWithSections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-foreground/[0.03] px-6 py-12 text-center">
            <p className="text-compact font-medium text-foreground">
              {hasQuery ? "No destinations match your search" : "No destinations yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasQuery ? "Try another term, or clear the filter." : "Destinations appear here when they are added."}
            </p>
            {hasQuery ? (
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setQ("")}>
                Clear search
              </Button>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
