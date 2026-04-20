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
import { listDestinationSummaries } from "@/data/destinations";
import {
  buildMergedDestinationSummaries,
  DESTINATION_STORAGE_EVENT,
} from "@/lib/destinationLocalEdits";
import { usePermissions } from "@/hooks/usePermissions";
import { DestinationCard } from "./DestinationCard";
import { AddDestinationDialog } from "./AddDestinationDialog";
import { Button } from "@/components/ui/button";
import { AppPageHeroHeader } from "@/components/ui/app-page-hero-header";
import { APP_PAGE_CONTENT_SHELL } from "@/lib/dashboardChrome";
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

  const hasQuery = q.trim().length > 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {isAdmin ? <AddDestinationDialog open={addOpen} onOpenChange={setAddOpen} /> : null}
      <AppPageHeroHeader
        eyebrow="Catalog"
        title="Destinations"
        subtitle="Curated destination guides — DMCs, dining, hotels, and resources for your agency."
        toolbarPlacement="with-title"
        toolbar={
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <div className="min-w-0 max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ProductCatalogSectionTabs
                value="destinations"
                onChange={(segment) => router.push(hrefForCatalogTab(segment))}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:min-w-[min(100%,20rem)] sm:flex-1">
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
        }
      />
      <a
        href="#destinations-portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-brand-cta/40"
      >
        Skip to destination list
      </a>

      <main
        className="min-h-0 flex-1 overflow-y-auto"
        id="destinations-portal-main"
      >
        <div className={cn(APP_PAGE_CONTENT_SHELL, "space-y-4 py-6")}>
          {filtered.length > 0 ? (
            <div
              className={cn(
                "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 view-transition-active",
                "xl:grid-cols-4",
              )}
            >
              {filtered.map((s) => (
                <DestinationCard key={s.slug} summary={s} highlightQuery={q.trim()} />
              ))}
            </div>
          ) : null}

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
        </div>
      </main>
    </div>
  );
}
