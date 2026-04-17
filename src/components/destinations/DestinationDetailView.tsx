"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Destination } from "@/data/destinations";
import { useUser } from "@/contexts/UserContext";
import { resolveAdvisorCatalogFromStorage } from "@/components/products/productDirectoryCatalogResolve";
import { mergeDestinationWithCatalog } from "@/lib/destinationCatalogJoin";
import {
  buildDestinationItemSectionMap,
  buildVirtualSectionsFromDestination,
} from "@/lib/destinationSectionModel";
import {
  resolveDestinationItemIdFromHash,
  resolveDestinationSectionId,
} from "@/lib/destinationSectionUrl";
import { logDestinationEvent } from "@/lib/destinationAnalytics";
import { destinationMapCoverageRatio } from "@/lib/destinationMapCoverage";
import { buildDestinationMapPins } from "@/lib/destinationMapPins";
import { DestinationHero } from "./DestinationHero";
import { DestinationSectionNav, type DestinationNavItem } from "./DestinationSectionNav";
import { SectionRenderer } from "./SectionRenderer";
import { DestinationAgencyNotes } from "./DestinationAgencyNotes";
import { TripReportBanner } from "./TripReportBanner";
import { destMuted, destPage } from "./destinationStyles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DestinationMapView = dynamic(
  () => import("./DestinationMapView").then((m) => m.DestinationMapView),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading map…</p> },
);

type Props = {
  destination: Destination;
  previewMode?: boolean;
  headerAside?: ReactNode;
};

export function DestinationDetailView({ destination, previewMode = false, headerAside }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();

  const [clientHash, setClientHash] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const displayDestination = useMemo(() => {
    if (userLoading || !user) return destination;
    const { products } = resolveAdvisorCatalogFromStorage(
      String(user.id),
      user.username ?? user.email?.split("@")[0] ?? "Advisor",
    );
    return mergeDestinationWithCatalog(destination, products);
  }, [destination, user, userLoading]);

  const sections = useMemo(
    () => buildVirtualSectionsFromDestination(displayDestination),
    [displayDestination],
  );

  const itemToSection = useMemo(
    () => buildDestinationItemSectionMap(displayDestination, sections),
    [displayDestination, sections],
  );

  const validIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    setClientHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHash = () => setClientHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const active = useMemo(
    () =>
      resolveDestinationSectionId({
        destinationSlug: displayDestination.slug,
        querySection: searchParams.get("section"),
        hash: clientHash || null,
        validSectionIds: validIds,
        itemToSection,
      }),
    [displayDestination.slug, searchParams, clientHash, validIds, itemToSection],
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.id === active) ?? sections[0],
    [sections, active],
  );

  const navItems: DestinationNavItem[] = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        label: s.title,
        iconKey: s.iconKey,
        count: s.count,
      })),
    [sections],
  );

  const mapRatio = useMemo(() => destinationMapCoverageRatio(displayDestination), [displayDestination]);
  const showMapToggle = mapRatio >= 0.3 && displayDestination.mapCenter != null;

  const mapPins = useMemo(
    () => buildDestinationMapPins(displayDestination, sections, activeSection?.id),
    [displayDestination, sections, activeSection?.id],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h) {
      logDestinationEvent("deep_link_opened", { destination: displayDestination.slug, source: "hash" });
    }
  }, [displayDestination.slug]);

  useEffect(() => {
    logDestinationEvent(
      "destination_viewed",
      { destination: displayDestination.slug },
      user?.id != null ? String(user.id) : undefined,
    );
  }, [displayDestination.slug, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const itemId = resolveDestinationItemIdFromHash(clientHash);
    if (!itemId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [clientHash, activeSection?.id]);

  const setSection = useCallback(
    (id: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("section");
      const qs = p.toString();
      const base = qs ? `${pathname}?${qs}` : pathname;
      const nextHash = `#section-${id}`;
      window.history.replaceState(null, "", `${base}${nextHash}`);
      setClientHash(nextHash);
    },
    [pathname, searchParams],
  );

  const onMapToggle = useCallback(
    (mode: "list" | "map") => {
      setViewMode(mode);
      logDestinationEvent("map_toggled", { destination: displayDestination.slug, on: mode === "map" });
    },
    [displayDestination.slug],
  );

  return (
    <div className={cn(destPage)}>
      <a
        href="#destination-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-brand-cta/40"
      >
        Skip to destination content
      </a>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="w-full">
          <div
            className={cn(
              "mb-3 flex min-w-0 flex-wrap items-center gap-3",
              headerAside ? "justify-between" : "",
            )}
          >
            <Link
              href="/dashboard/products/destinations"
              className="inline-flex shrink-0 text-sm font-medium text-brand-cta transition-colors hover:text-brand-cta-hover hover:underline"
            >
              ← All destinations
            </Link>
            {headerAside ? (
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">{headerAside}</div>
            ) : null}
          </div>
          <DestinationHero destination={displayDestination} mode={previewMode ? "preview" : "full"} />

          {showMapToggle ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                View
              </span>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "toolbarAccent" : "outline"}
                className="gap-1.5"
                onClick={() => onMapToggle("list")}
              >
                <List className="size-3.5" aria-hidden />
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "map" ? "toolbarAccent" : "outline"}
                className="gap-1.5"
                onClick={() => onMapToggle("map")}
              >
                <MapIcon className="size-3.5" aria-hidden />
                Map
              </Button>
            </div>
          ) : null}

          <p className={cn("mt-4 text-sm leading-relaxed", destMuted)}>{displayDestination.description}</p>

          <div className="mt-4">
            <TripReportBanner
              destinationSlug={displayDestination.slug}
              destinationName={displayDestination.name}
              reports={displayDestination.tripReports ?? []}
            />
          </div>

          <DestinationAgencyNotes destinationSlug={displayDestination.slug} />

          <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start lg:gap-8">
            <div className="min-w-0 space-y-5">
              {navItems.length > 0 ? (
                <div className="lg:hidden">
                  <DestinationSectionNav
                    variant="horizontal"
                    items={navItems}
                    activeId={active}
                    onChange={setSection}
                  />
                </div>
              ) : null}

              <main
                id="destination-main"
                tabIndex={-1}
                className="min-w-0 scroll-mt-24 outline-none"
                aria-labelledby="destination-section-title"
              >
                <h2 id="destination-section-title" className="sr-only">
                  {activeSection?.title ?? "Destination"}
                </h2>
                {activeSection ? (
                  <>
                    {viewMode === "map" && showMapToggle && displayDestination.mapCenter ? (
                      <DestinationMapView
                        pins={mapPins}
                        destinationSlug={displayDestination.slug}
                        center={displayDestination.mapCenter}
                      />
                    ) : (
                      <div id={`section-${activeSection.id}`} className="scroll-mt-28">
                        <SectionRenderer section={activeSection} destinationSlug={displayDestination.slug} />
                      </div>
                    )}
                  </>
                ) : (
                  <p className={cn("text-sm", destMuted)}>
                    No curated sections yet for this destination. Check back as content is added.
                  </p>
                )}
              </main>
            </div>

            {navItems.length > 0 ? (
              <aside className="hidden min-w-0 lg:block" aria-label="Section navigation">
                <div className="sticky top-4">
                  <DestinationSectionNav
                    variant="vertical"
                    items={navItems}
                    activeId={active}
                    onChange={setSection}
                  />
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
